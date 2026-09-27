// One-off backfill: profiles.social_url / website_url as typed → social_links (handles) + canonical URLs, plus the
// GitHub account of everyone who signed in with GitHub. Junk ("NA", "Twitter ") becomes null, which reopens the
// "complete your profile" modal for those users.
//
//   node scripts/normalize-social-links.mjs            dry run: writes a before/after CSV, changes nothing
//   node scripts/normalize-social-links.mjs --apply    writes the changed rows (500 per request, paced)
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local). Node 23+ (runs the .ts directly).
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { normalizeUrl, parseSocialLink, profileLinks } from '../utils/socialLinks.ts';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .map(line => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')]),
);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// GitHub usernames of everyone who signed in with GitHub.
async function githubLogins() {
  const logins = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      // listUsers leaves out identities; GitHub's user_name is in user_metadata (matches the identity for 99%+).
      const name = user.app_metadata?.providers?.includes('github') ? user.user_metadata?.user_name : null;
      if (typeof name === 'string' && name) logins.set(user.id, name);
    }
    if (data.users.length < 1000) break;
    await sleep(200);
  }
  return logins;
}

async function allProfiles() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('profiles')
      .select('id, username, social_url, website_url, social_links, deleted_at')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
    await sleep(200);
  }
  return rows.filter(row => !row.deleted_at);
}

// What a profile becomes. Rows already saved in the new format (social_links set) only get the GitHub login added.
export function migrate(row, github) {
  const stored = row.social_links && typeof row.social_links === 'object' ? { ...row.social_links } : {};
  let kind = 'unchanged';
  let typed = null; // the link the person entered stays their social_url
  if (!row.social_links) {
    // A lone "@handle" on the old "Twitter/Linkedin/…" field was nearly always an X handle.
    const link = parseSocialLink(row.social_url) ?? (/^\s*@[A-Za-z0-9_]{1,15}\s*$/.test(row.social_url ?? '') ? parseSocialLink(row.social_url, 'x') : null);
    if (link?.platform === 'website') stored.other = [link.url];
    else if (link) stored[link.platform] = link.handle;
    kind = !row.social_url?.trim() ? 'empty' : link ? 'parsed' : 'junk';
    typed = link?.url ?? null;
  }
  if (github && stored.github !== github) {
    if (stored.github) stored.other = [...(stored.other ?? []), `https://github.com/${stored.github}`];
    stored.github = github;
  }
  const links = profileLinks({ social_links: stored });
  const social_links = links.length ? stored : null;
  const social_url = (typed && links.some(l => l.url === typed) ? typed : links[0]?.url) ?? null;
  const website_url = normalizeUrl(row.website_url);
  const changed =
    social_url !== row.social_url || website_url !== row.website_url || JSON.stringify(social_links) !== JSON.stringify(row.social_links ?? null);
  return { social_links, social_url, website_url, kind, changed };
}

const csv = value => (value == null ? '' : `"${String(typeof value === 'object' ? JSON.stringify(value) : value).replace(/"/g, '""')}"`);

const [logins, profiles] = await Promise.all([githubLogins(), allProfiles()]);
console.log(`${profiles.length} profiles, ${logins.size} GitHub sign-ins`);

const changes = [];
const counts = {};
const lines = ['id,username,kind,github_login,old_social_url,new_social_url,social_links,old_website,new_website'];
for (const row of profiles) {
  const next = migrate(row, logins.get(row.id));
  const kind = next.kind === 'empty' && next.social_url ? 'github_only' : next.kind;
  counts[kind] = (counts[kind] ?? 0) + 1;
  if (!next.changed) continue;
  counts.changed = (counts.changed ?? 0) + 1;
  changes.push({ id: row.id, social_links: next.social_links, social_url: next.social_url, website_url: next.website_url });
  lines.push([row.id, row.username, kind, logins.get(row.id), row.social_url, next.social_url, next.social_links, row.website_url, next.website_url].map(csv).join(','));
}
const out = new URL('../social-links-backfill.csv', import.meta.url);
writeFileSync(out, lines.join('\n'));
console.log(counts);
console.log(`CSV: ${out.pathname}`);

if (APPLY) {
  for (let i = 0; i < changes.length; i += 500) {
    const { error } = await db.from('profiles').upsert(changes.slice(i, i + 500), { onConflict: 'id' });
    if (error) throw new Error(`batch at ${i}: ${error.message}`);
    process.stdout.write(`\rupdated ${Math.min(i + 500, changes.length)}/${changes.length}`);
    await sleep(500);
  }
  console.log('\ndone');
}
