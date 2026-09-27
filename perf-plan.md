# Supabase load & snappy UI plan

## Why (2026-09-27 outage)

Deploy `8b8cc80` (13:14 UTC) → from ~13:24 about 17% of requests 504'd site-wide. Postgres itself was
idle; Supabase's REST layer (PostgREST) took 15–30s per request because of request floods:

- `getVoters` fetched **one profile per voter** (1 + N requests; ~340 for a popular tool, plus a CORS
  preflight each from the browser). The new tool modal ran it on every open and every ←/→ step.
- No page is cached: the root layout sets `revalidate = 0` and reads cookies, so every visit, crawler
  hit and link prefetch runs every query live (CDN shows `x-vercel-cache: MISS` on all HTML).
- `product_ranks` (UNION of 3 ranking views over all products × votes) is the #1 DB cost: 4.4M calls,
  ~109ms each, uncached on every tool page request.

Goal: per-visitor Supabase work ≈ 0 for anonymous reads; pages served from the Vercel CDN; clicks feel
instant (prefetch hits the CDN, not a function).

## Batch 1 — stop the fan-out (code only, no DB changes)

- [x] **Voters N+1** — `getVoters`: 1 votes query + profiles `in (...)` in chunks of 100. Pushed `71efbc6`.
      Plus: the voter list shares one request per tool per minute (the modal re-mounted it 2–4× per step).
- [x] **Week rank by phase** (tool page) — upcoming: no query; live: position in this week's cached
      home data (no `product_ranks` call); ended: `unstable_cache` per tool for 7 days (final, never changes).
- [x] **Trending list** — one CDN-cached `/api/trending` (s-maxage 30), fetched once per page load
      (memoized) and filtered client-side; no more per-mount/per-modal-step RPCs from every browser.
- [x] **Tool page view count** — move the server-side `updateViews` (ran on every request, bots
      included) to a client beacon, once per visit. Also required for ISR in batch 2.
- [x] **No `router.refresh()` after upvotes** — the vote RPC already returns the new count.
      Also dropped a per-click own-profile fetch whose check could never be true.

## Batch 2 — make pages cacheable (the real fix; careful, touches auth UI)

- [x] Root layout: no `revalidate = 0`, no server session/profile read. `SupabaseProvider` loads the
      session + profile in the browser and exposes `loading`; `AccountGate` and the navbar auth slot
      wait for it (no login-page / "Sign In" flash). Server `SupabaseListener` removed.
- [x] Vote buttons re-check "voted" once the session arrives; `AvatarMenu` guards a not-yet-loaded
      profile; profile-completion modal decides client-side (and no longer fetches on every render).
- [x] Tool page + profile page metadata use the anon client / cached data (no `cookies()`).
- [x] Hidden tools (dead/hijacked site) are a 404 for everyone; the owner's explanation moved from the
      tool page to their dashboard (`/account/tools`). `ownHiddenTool` + dead `components/ui/ToolPage` removed.
- [x] Home (30s), static and account-shell pages prerendered and served from the CDN.
      Tool/profile/compare/blog pages stay per-request: on Next 13.5 an on-demand ISR page that calls
      `notFound()` is cached with status 200 (soft 404). Their data is cached instead (`getToolPageData` 30s).
      → Upgrading to Next 14 would let them move to the CDN too.
- [x] `ModalBannerCode` (useSearchParams) wrapped in Suspense - without it every static page bailed out
      of server rendering (home HTML was 46 chars of text). Fixed in c93963b.
- [x] Verified on prod: HIT on `/`, `/the-story`, `/login`, account shells, `/api/trending`; 404s keep status;
      no Set-Cookie on pages; signed-in vs anonymous responses byte-identical (HTML + RSC); John checked
      sign-out / sign-in on prod 2026-09-27.
- [ ] Prefetch: keep viewport prefetch (now CDN hits); add hover/touchstart prefetch on long lists.
- [x] `/upcoming` data cached 5 min (category pages already used the cached leaderboard).

## Batch 3 — instant tool modal

- [x] `/api/tool-preview/[slug]` (CDN 30s, same loader as the tool page) replaces ~5 Supabase calls per
      open/step; the modal preloads the previous/next tools. ~4 requests per step (was ~9 + voter fan-out).

## Batch 4 — DB-side (needs a prod migration → ask first)

- [x] `bump_views(ids bigint[])` RPC: one call per page for impressions instead of one per visible card.
      **Root cause of the DB freeze:** `updateViews` (since f06c4e0) also upserted ONE `site_daily_views`
      row per day for the whole site (34k updates/day), so concurrent calls queued on that row lock
      holding PostgREST connections. Now: daily counter sharded over 16 rows, rows locked in id order,
      `lock_timeout 2s` (drop the impression rather than hold a connection), old `updateViews` routed to it.
      Migration `20260928160000_bump_views.sql` applied on prod 2026-09-27.
- [ ] `track_pageview`: insert-only (or sharded) + cron rollup, instead of every view updating the same
      `(day, country)` row.
- [ ] Store the final week rank on `products` (cron at week close) or a refreshed materialized
      `product_ranks`; then drop the view from the request path entirely.
- [ ] `get_prev_launch_weeks`: filter by week before building JSON.

## Cleanup

- [ ] Delete dead code: `ProductsService.getProducts` (fetches whole table). (`components/ui/ToolPage` removed.)
- [ ] `getUpvotesGroupedByProducts` (cron): profile fetched twice per group.

## Watch after each deploy

- Vercel runtime logs: 504 count by deployment.
- Supabase edge logs: requests/min and top paths (a single page view should be < ~10 REST calls).
