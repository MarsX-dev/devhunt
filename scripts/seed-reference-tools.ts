/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/prefer-nullish-coalescing -- one-off seed script */
// Seeds DevHunt's reference listings (utils/referenceTools.ts): scrapes each website for the description,
// logo and screenshot, inserts the product (is_reference, no launch dates), links its categories and
// generates its profile. Skips names whose slug already exists.
//
//   npx tsx --env-file=.env.local scripts/seed-reference-tools.ts            # dry run: prints what it would do
//   npx tsx --env-file=.env.local scripts/seed-reference-tools.ts --write    # writes to the database
//   ... --write --only=cursor,claude-code                                   # a subset (by slug)
import createSlug from '@/utils/createSlug';
import categoryList from '@/utils/categories';
import { draftFromPage } from '@/utils/toolImport';
import { rehostImage, scrapeWithFirecrawl } from '@/utils/server/toolImport';
import { claimToolProfile, generateToolProfile } from '@/utils/server/toolProfile';
import { supabase } from '@/utils/supabase/services/supabaseClient';
import { REFERENCE_TOOLS } from '@/utils/referenceTools';

const OWNER = 'd31a79c5-4834-4656-ba80-ad624acdccd5'; // @johnrush (the listing page shows "Listed by DevHunt", not the owner)
const WRITE = process.argv.includes('--write');
const only = process.argv
  .find(a => a.startsWith('--only='))
  ?.slice(7)
  .split(',');

void (async () => {
  const { data: cats } = await supabase.from('product_categories').select('id, name');
  const catId = new Map(((cats ?? []) as { id: number; name: string }[]).map(c => [c.name.toLowerCase(), c.id]));
  const options = ((cats ?? []) as { id: number; name: string }[]).filter(c => categoryList.some(k => k.name === c.name));

  for (const ref of REFERENCE_TOOLS) {
    const slug = createSlug(ref.name);
    if (only && !only.includes(slug)) continue;
    const { data: existing } = await supabase.from('products').select('id, is_reference').eq('slug', slug).maybeSingle();
    if (existing) {
      console.log(`skip ${slug}: exists (id ${existing.id}${existing.is_reference ? ', reference' : ''})`);
      continue;
    }
    const categoryIds = ref.categories.map(n => catId.get(n.toLowerCase())).filter((id): id is number => !!id);
    if (categoryIds.length !== ref.categories.length) console.log(`  ${slug}: unknown category in ${ref.categories.join(', ')}`);

    let page: Awaited<ReturnType<typeof scrapeWithFirecrawl>>;
    try {
      page = await scrapeWithFirecrawl(ref.url);
    } catch (err) {
      console.log(`fail ${slug}: scrape ${(err as Error).message}`);
      continue;
    }
    const draft = draftFromPage(page, options);
    // The site's own meta description: the page intro the importer also takes can catch accessibility text
    // ("This element contains an interactive demo...").
    const description = page.description?.trim() ? page.description.trim() : ref.slogan;
    if (!WRITE) {
      console.log(
        `would add ${slug} | ${ref.slogan} | logo ${draft.logoUrl?.slice(0, 60)} | shot ${
          draft.screenshotUrls[0]?.slice(0, 60) ?? '-'
        } | ${description.slice(0, 90).replace(/\n/g, ' ')}`,
      );
      continue;
    }

    const [logo, ...shots] = await Promise.all([
      draft.logoUrl ? rehostImage(draft.logoUrl, 'w=128') : Promise.resolve(null),
      ...draft.screenshotUrls.slice(0, 1).map(async u => await rehostImage(u, 'w=750')),
    ]);
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: ref.name,
        slug,
        slogan: ref.slogan,
        description,
        demo_url: ref.url,
        github_url: ref.githubUrl ?? null,
        pricing_type: ref.pricing,
        logo_url: logo,
        asset_urls: shots.filter(Boolean),
        owner_id: OWNER,
        is_draft: false,
        isPaid: false,
        is_reference: true,
        moderation: 'ok',
        comments_count: 0,
        votes_count: 0,
        launch_date: new Date().toISOString(), // NOT NULL column; only vote-window checks read it, and reference listings vote any time
        launch_start: null,
        launch_end: null,
      } as never)
      .select('id, name, slogan, description, demo_url, github_url')
      .single();
    if (error || !product) {
      console.log(`fail ${slug}: insert ${error?.message}`);
      continue;
    }
    const p: { id: number } = product;
    if (categoryIds.length) {
      await supabase.from('product_category_product').insert(categoryIds.map(id => ({ product_id: p.id, category_id: id })));
    }
    const claimed = await claimToolProfile(p.id);
    const profile = claimed ? await generateToolProfile(product as never) : { status: 'not claimed' };
    console.log(`added ${slug} (id ${p.id}) profile ${JSON.stringify(profile)}`);
  }
})();
