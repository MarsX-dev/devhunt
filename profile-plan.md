# Profile pages plan: clean links, enrichment, dev CV

## Why

Profile pages (`app/[user]/page.tsx` → `UserProfileInfo`) show a name, headline, about, one "Website" chip, one "Social"
chip and DevHunt stats. The one social field is free text, so the data is a mess. Production data, 2026-09-27:

| `profiles.social_url` (40,248 profiles)       | count  |
| --------------------------------------------- | ------ |
| set                                           | 29,428 |
| full URL (`https://…`)                        | 23,750 |
| no protocol (`x.com/foo`, `www.linkedin…`)    | 2,557  |
| junk, no dot (`NA`, `Twitter `, `ss`, `None`) | 2,577  |
| bare `@handle`                                | 494    |
| X / Twitter                                   | 9,318  |
| LinkedIn                                      | 7,435  |
| Facebook / GitHub / Instagram / YouTube       | 1,724 / 1,156 / 993 / 304 |
| looks like casino/bet spam                    | ~465   |

Other issues: `http://` links, trailing spaces, `https:shipai.me` with no slashes, websites and `Telegram: foo` typed
into the social field. `profiles.twitter` exists but is empty (0 rows). Both forms (`app/account/details/page.tsx` and
`components/ui/ProfileFormModal/ProfileFormModal.tsx`) are near copies, and their check
`if (!socialMediaLink && !validateURL(socialMediaLink))` never rejects anything that isn't empty.

Assets we already have:

- **10,429 users signed in with GitHub.** `auth.identities.identity_data` has `user_name` and the numeric `provider_id`
  for all of them, so we know their GitHub account for certain with no user input.
- `FIRECRAWL_KEY` and `GROQ_API_KEY` are already used by tool enrichment (`utils/server/enrich.ts`).
- Firecrawl: 846k of 1M credits left this cycle (resets 2026-10-12).

## What Firecrawl can fetch (tested 2026-09-27)

| Source      | Result | Cost | What comes back |
| ----------- | ------ | ---- | --------------- |
| X profile   | ✅ | **30 credits** | Clean markdown: name, bio, followers, verified, avatar, latest posts. It follows handle renames. |
| GitHub      | ✅ | 1 | Noisy page markdown. **Use the GitHub API instead**, which is free and structured. |
| Product Hunt | ✅ | 1 | Name, headline, followers, maker products |
| Peerlist, dev.to, YouTube | ✅ | 1 | Page markdown; needs Groq to turn it into fields |
| LinkedIn, Instagram, Facebook | ❌ | – | Firecrawl says "we do not support this site". Link only. |
| Bluesky     | ❌ (JS app) | – | **Use the free public API instead**: `public.api.bsky.app/xrpc/app.bsky.actor.getProfile` |

GitHub API: 60 requests/hour without auth (we hit that limit while testing), 5,000/hour with a token. Needs a new
`GITHUB_TOKEN` env var (a fine-grained token with no scopes is enough for public data). Look users up by numeric id
(`/user/{id}`) so renames don't break anything. Pinned repos need GraphQL; top repos by stars work over REST.

## Principles

- **All new data is optional.** Every new column is nullable. Every new section renders only if it has content. An
  old profile with nothing new looks exactly like today's page. Visitors never see "N/A", empty cards or placeholders.
- **Store handles, not URLs.** Build URLs when rendering, so there is one format forever.
- **Zero extra per-visitor DB work** (see `perf-plan.md`). Fetching happens on save or in cron. The page reads everything
  in its existing cached query, with the new data embedded in the same PostgREST call.
- **Users can't write fetched data.** Follower counts and similar live in a table only the service role can write.
- Test on prod on John's own profile, then clean up (no dev/stage).

---

## Batch 1: one link format (ship on its own)

- [x] **`utils/socialLinks.ts`**, a pure function with vitest tests covering every sample above.
      `parseSocialLink(input, platformHint?) → { platform, handle, url } | null`
  - trim; fix `https:foo`, `http//`, `http://`; add `https://`; drop `www.`, `m.` and `mobile.`; drop query strings and
    trailing slashes on known platforms
  - `twitter.com` → `x.com`; `linkedin.com/in/<slug>` and `/company/<slug>`; `github.com/<user>` (reject repo paths
    for the profile field); `bsky.app/profile/<h>`; `youtube.com/@h`; `instagram`, `facebook`, `producthunt.com/@h`,
    `peerlist.io/h`, `dev.to/h`, `threads`, `mastodon` (`@user@host`)
  - `@handle` or a bare handle **plus a platform hint** (from a per-platform field) → that platform
  - no dot and no hint, contains spaces, or `NA`/`none`/`-` → `null` (junk)
  - any other valid URL → `{ platform: 'website' }`
- [x] **Schema:** `profiles.social_links jsonb` (nullable), for example
      `{"x":"johnrush","github":"johnrushx","linkedin":"in/johnrush","bluesky":"…","youtube":"@…","other":["https://…"]}`.
      Keep `social_url` and `website_url`, which get rewritten to the canonical URL, because the onboarding gate
      (`ProfileFormModal/index.tsx`, `social_url == null`) and old code read them. Drop the dead `twitter` column later.
- [x] **`POST /api/profile`**, one server route for saving. It checks the session, normalizes with the same function,
      writes with the user's own client (RLS unchanged) and marks enrichment as pending. Today the forms write
      straight from the browser, so the server can't enforce the format.
- [x] **Shared `ProfileLinksFields` component** used by both forms. It has one field per platform (X, GitHub, LinkedIn,
      Website, and "+ add another link"). Each field accepts `@handle`, `handle`, `x.com/handle` or a full URL, shows
      the cleaned version on blur (`x.com/johnrush ✓`), and shows an error only for real junk. GitHub is prefilled and
      locked for GitHub sign-in users. The onboarding modal stays at a single link field (it auto-detects the platform)
      so the gate doesn't get harder. Fix the broken validation and the username error state while in there.
- [x] **Display:** `UserProfileInfo` shows one chip per link with a platform icon and the handle (`𝕏 @johnrush`,
      `GitHub johnrushx`) instead of a generic "Social". Use `rel="nofollow ugc noopener"`.
- [ ] **Backfill script** (written and dry-run 2026-09-28: 31,601 rows change; **not applied yet**) (`scripts/normalize-social-links.mjs`, service role, 500 rows per batch with a pause, run
      once): parse `social_url` and `website_url`, fill `social_links`, rewrite both columns to canonical URLs, and add
      GitHub from `auth.identities` for GitHub sign-in users. Write a CSV of before/after values first and review it.
- **Junk values (decided 2026-09-27):** set to `null`. Those users see the "complete your profile" modal again.
- **Out of scope, flag separately:** ~465 casino/bet spam profiles. They need a moderation pass, not a normalizer.

Batch 1 notes (2026-09-28): the migration is applied on prod. A lone `@handle` in the old field is read as X.
Profile page caches are tagged per username, so a save shows immediately. The old `validateURL` helper was removed.

## Batch 2: enrichment (GitHub + X + Bluesky)

- [ ] **Table `profile_enrichment`** with columns `profile_id`, `source` (`github`|`x`|`bluesky`|…), `handle`,
      `data jsonb`, `status` (`pending`|`ok`|`failed`|`not_found`), `error`, `fetched_at`, and a primary key on
      (`profile_id`, `source`). RLS lets everyone select; there is no insert/update policy, so only the service role
      writes.
- [ ] **Fetchers** in `utils/server/profileEnrich.ts`, keeping only the fields we display (small JSON):
  - GitHub (API): name, bio, company, location, blog, followers, public repos, account created, top 6 repos
    (name, description, stars, language, url), language mix
  - X (Firecrawl markdown, parsed with a regex; Groq only as a fallback): bio, followers, verified, avatar, up to 3
    latest posts (text, date, url)
  - Bluesky (public API): display name, bio, followers, avatar
- [ ] **When fetching runs:**
  - On save, only when a link has changed: `/api/profile` marks the source `pending`, then the client calls
    `/api/profile/enrich` once, so the owner sees the result in a few seconds. There is no `after()` in Next 13.5.
  - A new cron, `/api/cron/profile-enrich` (every 15 min, limited batch), handles pending rows and refreshes stale
    ones: GitHub every 7 days, X every 30 days (cost), only for profiles active in the last 90 days.
  - The owner gets a "Refresh" button, limited to once a day.
- [ ] **Backfill order:** (1) GitHub sign-in users, 10.4k, free, ~3 hours of cron at 5k/hour; (2) makers with X,
      3,009 × 30 ≈ **90k credits**; (3) other X profiles only once the user logs in or saves (all 9.3k would be ~280k).
- [ ] **Profile page:** embed `profile_enrichment(source, data, status)` in the existing `getByUsername` select,
      so there is no extra request.
- **Impersonation (decided 2026-09-27):** anyone can type `x.com/elonmusk`. GitHub from sign-in counts as verified ✓.
  For X and Bluesky, a JEV `score` question (`utils/server/jev.ts`) compares the fetched account (display name, handle,
  bio, links) with the DevHunt profile (full name, username, headline, about, website, tools launched). Store
  `match_score` in `profile_enrichment`. Show fetched data only when the score is ≥ 0.5; otherwise show just the link
  chip. If JEV is unavailable, treat the account as unmatched.

## Batch 3: the profile becomes a dev CV

New nullable `profiles` columns, all edited on `/account/details` in collapsible sections:

| field | type | notes |
| ----- | ---- | ----- |
| `location` | text | GitHub location as a suggestion |
| `availability` | text check (`open_to_work`,`hiring`,`freelance`,`not_looking`) | shows as a chip in the header |
| `current_role`, `current_company` | text | shows under the name if there's no headline |
| `skills` | text[] (max 20) | autocomplete; suggested from GitHub languages |
| `experience` | jsonb `[{title, company, url, start, end, description}]` | CV timeline |
| `projects` | jsonb `[{name, url, description, image}]` | DevHunt launches are shown separately and automatically |
| `featured` | jsonb `[{title, url, kind: talk|post|podcast}]` | optional |

- [ ] **Import instead of typing:** LinkedIn can't be scraped, so offer "Import from LinkedIn". The user uploads
      LinkedIn's "Save to PDF" file or pastes CV text, Groq extracts experience and skills, and the user reviews
      before saving. "Import from GitHub" fills location, company and skills from the GitHub data.
- [ ] **Layout:** header (avatar, name, verified ✓, headline or role @ company, location, availability chip, link chips)
      → stats bar (as today) → on desktop two columns: main (About, Experience, Projects, Launches, Upvoted,
      Comments) and side (Skills, GitHub card with top repos, X card with bio, followers and latest posts).
      With no data, the side column isn't rendered and the page stays one column like today. On mobile it's a
      single column.
- [ ] **Owner hints:** a small client component, which uses the session already in the Supabase provider (no query),
      shows ghost "Add your experience" cards **only to the owner**, so cached HTML stays the same for everyone.
- [ ] **Avatar fallback:** if the avatar is `/user.svg` and a verified GitHub/X avatar exists, use that.
- [ ] **SEO:** JSON-LD `ProfilePage` + `Person` with `sameAs` links and `jobTitle`. The sitemap already includes only
      makers (`utils/sitemap.ts`). Add profiles that have an about section or experience too.

## Batch 4 (later, optional)

- Product Hunt, Peerlist, dev.to and YouTube through Firecrawl (1 credit each) with Groq extraction, for example PH
  launches or YouTube subscribers.
- "Connect X" (option B above).

## Files touched

`utils/socialLinks.ts` (+test) · `app/api/profile/route.ts` · `app/api/profile/enrich/route.ts` ·
`app/api/cron/profile-enrich/route.ts` + `vercel.json` · `utils/server/profileEnrich.ts` ·
`components/ui/ProfileLinksFields/` · `app/account/details/page.tsx` · `components/ui/ProfileFormModal/*` ·
`components/ui/UserProfileInfo/UserProfileInfo.tsx` · `app/[user]/page.tsx` · `utils/supabase/services/profile.ts` ·
`utils/supabase/types.ts` · migrations for `social_links`, `profile_enrichment` and the CV columns ·
`scripts/normalize-social-links.ts` · env: `GITHUB_TOKEN` (new).
