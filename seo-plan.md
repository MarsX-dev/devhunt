# DevHunt SEO / AEO / GEO Plan

Tracking doc for devhunt.org organic growth. Tick boxes as work ships; add the date and PR/commit next to each.

- **Owner:** John Rush
- **Created:** 2026-09-26
- **Data sources:** SEO Gets (GSC, Jun 2025 → Sep 23 2026), Ubersuggest (project `devhunt.org`, US/en), code review of this repo, and the SEO/AEO/GEO tactics doc (viral X posts, Jun–Sep 2026). Tactics from that doc are cited by author (e.g. *@regalstreak*).

---

## 1. Baseline (snapshot 2026-09-26)

Re-measure monthly in the **Progress log** (section 8).

| Metric | Value | Source |
|---|---|---|
| GSC clicks, last 90 days | ~32.9k (tool pages 28.3k, homepage 3.7k, blog 630) | SEO Gets |
| GSC daily clicks | ~400/day in Sep 2026 (low: ~150/day, Sep–Oct 2025) | SEO Gets |
| Avg position | ~9 (was ~17 in Aug 2026) | SEO Gets |
| Pages with impressions | 5,960, of which 4,683 had **0 clicks** | SEO Gets |
| Blog | 552 URLs, 616k impressions, 630 clicks (**0.1% CTR**) | SEO Gets |
| Branded clicks ("devhunt"/"dev hunt") | ~3.2k per 90 days | SEO Gets |
| Domain Authority | 31 | Ubersuggest |
| Referring domains / backlinks | 1,681 / 34.7k (600 ref domains point at `/`) | Ubersuggest |
| Organic keywords (US) | 5,360 (peak 8,990 in Mar 2026) | Ubersuggest |
| Est. organic traffic (US) | ~11.1k/mo | Ubersuggest |
| Ubersuggest site audit | 0 errors across its checks (4xx, titles, meta, H1, sitemap, SSL) | Ubersuggest |
| AI visibility (ChatGPT, 10 tracked prompts) | **0% visibility, 0 mentions** (first run, report still computing) | Ubersuggest AISV |
| PageSpeed mobile | LCP 3.3s, TTI 8.9s, redirect cost 630ms; field data "average" | Ubersuggest |
| PageSpeed desktop | LCP 0.9s, TBT 394ms | Ubersuggest |

**Key risks**
1. **Dependence on a few tools.** yt1d, y2down, yt1s, snapwc, dolphin-radar and toolfk bring 40%+ of clicks. None of them are dev tools; one core update or a dead tool wipes that out.
2. **Low-quality listings.** Several indexed tools are NSFW or "undress" tools (hifun, spicygen, pornify, vmate), which risks Google treating the whole site as low quality.
3. **Ranking keywords are shrinking** (8,990 → 5,360) while traffic holds, so rankings are getting more concentrated.
4. **Zero AI-assistant presence** for "launch dev tool" or "Product Hunt alternative" style prompts.
5. **Paid launches get dofollow links (deliberate).** Decided 2026-09-27: tools on a paid launch link to their site with a dofollow link; everyone else stays `nofollow`. Google's link spam policy asks for `rel="sponsored"` on paid links, so this is a known policy break. Possible outcomes: a manual action ("unnatural outbound links") or Google quietly ignoring devhunt's outbound links. Don't state "dofollow backlink" in public sales copy. If GSC ever shows a manual action, switch paid links to `rel="sponsored"` and file a reconsideration request.

---

## 2. Phase 1: Technical fixes (days 1–30)

- [ ] **Fix `www.devhunt.org`.** HTTPS www returns nothing, and `http://www` 308s to that dead URL. Add www in Vercel with a 308 redirect to the root domain, and check backlinks that point at www.
- [ ] **Remove the extra redirect on mobile** (630ms per Ubersuggest). Find which hop fires (trailing slash? locale?) and make sure every internal link uses the final URL. Per *@regalstreak*: use 301/308, never 307, so Google keeps the right canonical.
- [ ] **Sync the johnrushx fork.** As of 2026-09-28, the live site doesn't have anything from `0010fbc` onward on main: the robots.txt `/account/` and `/api/` disallows, the homepage canonical and all JSON-LD are missing on devhunt.org.
- [ ] **Add JSON-LD** (in code on main, not live yet):
  - [x] `SoftwareApplication` on `app/tool/[slug]/page.tsx` (2026-09-27, not live)
  - [ ] `AggregateRating` from votes/comments where legitimate
  - [ ] `Article` (+ `dateModified`, author) on `app/blog/[slug]/page.tsx`
  - [ ] `BreadcrumbList` on tool, category and blog pages
  - [ ] `Organization` + `WebSite` (with `SearchAction`) in the root layout. Organization + WebSite are on the homepage only (`app/(home)/page.tsx`); `SearchAction` is still missing.
  - [ ] `FAQPage` where an FAQ block exists (done on tool pages with a profile; still needed on `/faq` and category pages)
  - [ ] `ItemList` on category pages (`app/tools/[slug]`); no schema on compare or alternatives pages yet
  - [ ] `Person` (John Rush, credentials) on the about page
  - [ ] Validate with the Rich Results Test
- [ ] **Add `/llms.txt`** (404 today): a short summary of DevHunt plus links to key pages, top categories, `/faq` and `/about`. It's cheap to add, though no major AI engine has confirmed it reads the file.
- [ ] **robots.txt: name the AI crawlers explicitly** (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended). They're already allowed via `*`; this is optional. Also confirm Vercel/firewall bot protection doesn't block them.
- [ ] **Self-referencing canonicals.** Every page type has one except the homepage, which is in code but not live yet (see the fork sync above). Recheck after the sync.
- [ ] **Site-level `/faq` page** (404 today) with `FAQPage` schema, in the sitemap. Questions: what is DevHunt, how to launch a dev tool, is it free, how voting and winners work, DevHunt vs Product Hunt.
- [ ] **About page with credentials.** `/about` is 404; `/the-story` exists but isn't in the sitemap and has no `Person` schema. Add `/about` (or a 308 to `/the-story`) with John's background and links (X, GitHub, MarsX), and add it to the sitemap.
- [ ] **Tool page title and meta template** (`app/tool/[slug]/page.tsx:47`). Today it is `{name} - {slogan}` and the description is only the slogan. Change to `{Name}: {short value prop} – Features, Pricing & Alternatives | DevHunt` (~50–60 chars where possible), plus a unique 140–160 char description built from the tool's description.
- [ ] **Category pages** (`app/tools/[slug]`) have a title but no description and no intro copy. Add a meta description, ~300 words of intro above the grid, an FAQ, and "updated {month year}".
- [x] **Hide NSFW and "undress" listings.** 2026-09-27: soft-deleted 48 listings (porn, NSFW, undress/nudify, AI girlfriend). They now return 404 and drop from lists and the sitemap. To undo: set `deleted=false` on those rows.
  - [ ] Decide on borderline listings: nofiltergpt (3581), deepswap (6350), imagetovideo (7224), soulmaite-io (3753)
  - [ ] Block new NSFW submissions (keyword check on submit and/or an approval queue)
- [ ] **Noindex empty profiles** (`/@user` with no launched tools).
- [ ] **Split the sitemap** (tools / blog / categories / profiles) and add `lastmod`.
- [ ] **Bing Webmaster Tools + IndexNow** on deploy. ChatGPT search uses Bing's index (*@regalstreak*).
- [ ] **Turn on Google's Generative-AI performance report** in GSC and keep the site included in AI features (Sagapixel / Google docs).
- [ ] **Mobile performance.** Cut unused JS (~28KB) and get LCP under 2.5s on tool pages.

---

## 3. Phase 2: Fix pages that already rank (days 15–60)

Rule from *@jakezward*: for ~60 days, refresh positions 4–20 before writing new posts.

### 3a. Pages with impressions but no clicks

Rewrite the title and meta, put the exact query in the H1 and first sentence, and answer the query in the first two lines (*@regalstreak* `no_clicks` flag).

| Query | GSC impr (90d) | Pos | CTR | Page | Done |
|---|---|---|---|---|---|
| toolfk | 111,752 | 6.0 | 0.29% | /tool/toolfk | [ ] |
| tiktokio | 68,569 | 8.2 | 0.03% | (find ranking page) | [ ] |
| dolphin radar | 66,508 | 5.2 | 0.51% | /tool/dolphin-radar | [ ] |
| snapwc / snap wc | 45,182 | 4.1 | ~0.9% | /tool/snapwc | [ ] |
| easycomment / easy comment (ai) | ~60k | 4–6 | <0.5% | /tool/instagram-comment-generator-easycomment | [ ] |
| google maps api | 20,520 | 7.1 | 0% | /blog/google-map-api-for-developers-integration-basics | [ ] |
| vidful | 9,564 | 5.9 | 0.08% | /tool/vidfulai-free-ai-video-generator-online | [ ] |
| online gdb / gdb online debugger | 13,115 | 6 | <0.1% | /blog/debug-code-anywhere-with-online-gdb-debuggers | [ ] |
| cuty / cuty ai | 11,324 | 5–8 | ~0.4% | (find ranking page) | [ ] |

### 3b. Keywords close to the top 10

Positions 4–30 with real US volume (Ubersuggest). Add the exact phrase, 2–3 new H2s covering related queries, bump `dateModified`, then request indexing.

| Keyword | US vol | KD | Pos | Page | Done |
|---|---|---|---|---|---|
| easy comment / easy comment ai | 8,100 / 4,400 | 15–16 | 11 / 9 | easycomment tool | [ ] |
| student developer pack github | 8,100 | 39 | 17 | /blog/github-student-pack-getting-started | [ ] |
| tts sam / online microsoft sam tts generator | 6,600 / 1,900 | 19–30 | 21–23 | /tool/sam-tts | [ ] |
| android software development kit | 4,400 | 57 | 18 | /blog/download-the-android-sdk-for-app-development | [ ] |
| facewow face swap | 4,400 | 28 | 22 | /tool/facewow | [ ] |
| developer toolbar chrome | 4,400 | 72 | 25 | /blog/unlock-chromes-built-in-dev-tools-to-boost-productivity | [ ] |
| hackaigc | 3,600 | 13 | 17 | /tool/hackaig | [ ] |
| github student | 2,900 | 35 | 30 | /blog/github-student-tools-for-new-developers | [ ] |
| chat zero | 22,200 | 53 | 29 | /tool/chat-zero | [ ] |
| steam calculator | 1,900 | 34 | 28 | /tool/steam-calculator | [ ] |
| dev tools for safari / safari tools web developer | 1,600 | 48–49 | 16–17 | Safari blog posts (merge, see 3c) | [ ] |
| github education pack | 1,000 | 59 | 11 | /blog/github-student-pack-essentials | [ ] |
| js readfile | 260 | 48 | 11 | /blog/nodejs-readfile-for-beginners | [ ] |

Ubersuggest lists **1,165 "existing content" opportunities**. Work the queue from the top by volume and ignore off-topic ones.

### 3c. Blog cleanup (552 URLs, 0.1% CTR)

- [ ] Export all blog URLs with GSC clicks/impressions/position from SEO Gets.
- [ ] **Delete or 410** posts with 0 clicks and position >50 in the last 16 months (e.g. the "create free online forms" posts at ~pos 73–76 and the "track web traffic / web stats tools" posts at ~pos 70).
- [ ] **Merge duplicates** and 301 each duplicate to one winner:
  - [ ] GitHub Student Pack (`github-student-pack-getting-started`, `-essentials`, `github-student-tools-for-new-developers`). This is the biggest dev-relevant cluster: 8.1k + 2.9k + 1k US volume.
  - [ ] Safari dev tools (`web-developer-tools-safari-an-overview`, `safari-developer-tools-the-comprehensive-guide-...`)
  - [ ] Chrome dev tools (`unlock-chromes-built-in-dev-tools...`, `unlock-chromes-power-with-these-dev-tools`, `discover-dev-tools-for-chrome-on-ios`)
  - [ ] Free online forms (3+ posts)
  - [ ] Website traffic / web stats tools (3+ posts)
  - [ ] No-code / low-code platforms
- [ ] Add a **TL;DR block, question-style H2s, a comparison table and an FAQ** to every kept post (AEO format, *@alexgroberman* / Rankscale).
- [ ] Link from each kept post to the relevant `/tools/{category}` page and 3–5 tool pages.

---

## 4. Phase 3: New pages from existing data (days 31–90)

Build templates in small batches, e.g. 20–50 URLs, then check GSC "Discovered – not indexed" before scaling. *@regalstreak* stalled their indexing by pushing too fast.

- [ ] **`/tool/{slug}/alternatives`**. Traffic is almost all tool-name searches, so each ranking tool gets a companion page listing same-category tools, with a comparison table and FAQ.
  - [ ] Pilot on the top 20 tools by clicks
  - [ ] Scale if >50% are indexed and getting impressions within 3 weeks
- [ ] **`/compare/{a}-vs-{b}`**. Pairs from the same category with strong votes; include a table (pricing, open source, platform, features) and a verdict.
- [ ] **"Best {category} tools ({year})" hubs.** Upgrade `/tools/{slug}` with the content template from the tactics doc: TL;DR, how we ranked, ranked list with pros/cons, FAQ.
- [ ] **Use-case pages**: "free/open-source {category} tools", "{category} tools for {framework}" (only where the SERP confirms intent).
- [ ] **Dev-relevant how-to pages** Ubersuggest flagged with low KD:
  - [ ] "delete a branch in github" cluster: 3 × 8,100 vol, KD 29–33
  - [ ] "ai first code editor": 4,400, KD 25 (ties to AI coding tool listings)
  - [ ] "morse code tools / generate morse code": 5,400 / 14,800, KD 24 (only if a listed tool fits)
  - [ ] "alpha vs beta testing": 1,300, KD 31 (fits the launch audience)
  - [ ] "no code ai agents": 2,400, KD 32
- [ ] **Monthly roundups**: `/best/{year}/{month}` of the top launches. Fresh content plus a natural backlink target for makers.
- [ ] **Chrome / Safari / React devtools guides**. There's a large cluster: "developer tools in chrome" 5.4k (KD 8), "browser developer tools safari" 1.9k (KD 5), "developer tools for mac" 720 (KD 6). The merged posts from 3c should target these.

Ubersuggest's "new content" list (1,317 items) is mostly off-topic (e.g. "app store", "telegram web"). **Don't** build pages for it. Kill a keyword if the SERP serves a different audience (*@regalstreak*).

---

## 5. Phase 4: AI assistants (GEO / AEO)

Current state: **0% visibility** in ChatGPT for the 10 tracked prompts. For "directory builder" and "coding agent" prompts, ChatGPT cites Directorist, HivePress, Claude Code, Cursor and similar.

- [ ] **Fix the prompt set** in Ubersuggest `brand_config`. Track prompts DevHunt should win: "where to launch a developer tool", "Product Hunt alternatives for developers", "best sites to submit a dev tool", "best new developer tools this week", "{category} tools" for the top 5 categories.
- [ ] **Publish pages AI assistants can quote:**
  - [ ] "Product Hunt alternatives for developers": 110 vol, KD 24, but high intent and exactly what DevHunt is. Include a comparison table vs Product Hunt, Uneed, Peerlist, Microlaunch, BetaList, Hacker News (Show HN).
  - [ ] "Where to launch your dev tool: complete list"
  - [ ] "How to launch a developer tool" guide
- [ ] **Answer-first format** on all new pages: TL;DR bullets, question H2s, a direct answer in the first 2 lines, tables, and a visible `dateModified`.
- [ ] **Weekly: track long, conversational GSC queries** (7+ words) and build pages worded the same way (*@regalstreak* `ai_mode` flag).
- [ ] **Be present where AIs look beyond your site** (*@neilpatel* "search everywhere"): answer "where to launch dev tool" threads on Reddit, Stack Exchange and Indie Hackers; keep DevHunt on the "launch platforms" lists published by others.
- [ ] Re-check AI visibility monthly and log it in section 8.

---

## 6. Phase 5: Backlinks and authority

- [ ] **"Launched on DevHunt" / "Featured on DevHunt" badge** for makers to embed. Point it at the tool page, not the homepage, so authority reaches deep pages.
- [ ] **Pass homepage authority inward.** 600 of 1,681 ref domains link to `/`. Link from the homepage and the top tool pages to stuck pages, and rotate those links monthly as each page ranks (*@regalstreak*).
- [ ] **Backlink gap vs uneed.best, peerlist.io, microlaunch.net, betalist.com, saashub.com.** Ubersuggest's report was still building; rerun `backlink_opportunity` and list targets here.
- [ ] Get listed on "Product Hunt alternatives" roundups and "where to launch" lists.
- [ ] Open-source angle: the GitHub repo README, awesome-lists, and dev.to/Hashnode posts that link to specific pages.

---

## 7. Weekly routine

Adapted from *@regalstreak*'s daily GSC check and *@jakezward*'s refresh loop. Run it via SEO Gets.

- [ ] **Almost there:** non-brand queries at positions 3–20 → add the exact phrase / H2s to the ranking page
- [ ] **No clicks:** impressions >500 and CTR <0.5% → rewrite title/meta/H1/first line
- [ ] **Decaying:** clicks down ~30% week-on-week → find the cause and refresh
- [ ] **Untargeted:** a query with no page built for it → new page, linked from the ranking page
- [ ] **Wrong intent:** SERP intent doesn't match page type → change the page type or drop the query
- [ ] **AI mode:** queries of 7+ words → candidate pages
- [ ] **Conversions:** match GSC landing pages to signups and tool submissions. A page with many clicks and zero conversions is a leak.
- [ ] Check indexing: count of "Discovered – not indexed"
- [ ] Check the GSC Generative-AI report for movers

---

## 8. Progress log

| Date | Clicks/day (7d avg) | Avg pos | Ubersuggest KW (US) | DA | Ref domains | AI visibility | Notes |
|---|---|---|---|---|---|---|---|
| 2026-09-26 | ~405 | ~9 | 5,360 | 31 | 1,681 | 0% | Baseline |
| | | | | 2026-09-28 | Plan: added llms.txt, /faq, /about with credentials, fork sync and schema gaps (from an external SEO checklist) | — | AI-citation basics |
| | | | |

## 9. Changelog

| Date | Change | PR / commit | Expected effect |
|---|---|---|---|
| | | | |
