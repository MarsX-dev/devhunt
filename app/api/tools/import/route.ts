import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { aiEnabled, classifyWithJev, importEnabled, rehostImage, scrapeWithFirecrawl } from '@/utils/server/toolImport';
import { draftFromPage, mergeClassification, type CategoryOption } from '@/utils/toolImport';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

// Whether the submit form should offer "start with your website URL".
export async function GET() {
  return NextResponse.json({ enabled: importEnabled(), ai: aiEnabled() });
}

// Reads a tool's website and returns a draft for the submit form (the user reviews everything).
export async function POST(req: Request) {
  if (!importEnabled()) return NextResponse.json({ error: 'Import is not configured.' }, { status: 503 });
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await withinLimit(`import:${user.id}`, 20, 3600))) return tooManyRequests('Too many imports, please try again in an hour.');

  const { url: raw } = (await req.json().catch(() => ({}))) as { url?: string };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw ?? '') ? raw! : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('bad url');
  } catch {
    return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 });
  }

  const started = Date.now();
  try {
    const [page, { data: categories }] = await Promise.all([
      scrapeWithFirecrawl(url.toString()),
      serviceClient.from('product_categories').select('id, name'),
    ]);
    const options = (categories ?? []) as CategoryOption[];
    let draft = draftFromPage(page, options);
    const ai = await classifyWithJev(page, options);
    if (ai) draft = mergeClassification(draft, ai, options);
    const [logoUrl, ...screenshotUrls] = await Promise.all([
      draft.logoUrl ? rehostImage(draft.logoUrl, 'w=128') : Promise.resolve(null),
      ...draft.screenshotUrls.map(url => rehostImage(url, 'w=750')),
    ]);
    draft = { ...draft, logoUrl, screenshotUrls: screenshotUrls.filter((u): u is string => !!u) };
    console.log(JSON.stringify({ event: 'tool_import', user: user.id, host: url.hostname, ai: !!ai, ms: Date.now() - started }));
    return NextResponse.json({ draft, categories: options.filter(c => draft.categoryIds.includes(c.id)) });
  } catch (err) {
    console.error('tool import failed:', url.hostname, (err as Error).message);
    return NextResponse.json({ error: "We couldn't read that website. Please fill in the form yourself." }, { status: 502 });
  }
}
