# DevHunt SEO / AEO / GEO Plan

Tracking doc for devhunt.org organic growth across Google, Google's AI features and AI assistants. Tick boxes as work ships, and add the date and commit.

- **Owner:** John Rush
- **Created:** 2026-09-26. **Rewritten:** 2026-10-01 (new data, code audit, three research docs).
- **Sources:**
  - **Data:** SEO Gets (GSC through 2026-09-29), Ubersuggest (project `devhunt.org`, US/en), a live check of devhunt.org, and a code audit of this repo.
  - **Research:** *SEO-AEO-GEO-Agent-Instructions* (viral X tactics, cited by handle), *SEO-AEO-GEO-Playbook* and its raw notes (Google Search Central, Ahrefs, SparkToro, the GEO paper).
- **Rule for tactics:** Google's own docs win over practitioner tweets. Study figures carry their date. Practitioner claims are "their result", not a forecast.

---

## 0. What the research changes

The playbook's main point: **for Google, AEO/GEO is still SEO.** Google's AI features use the same index and ranking. For ChatGPT, Perplexity and similar assistants, classic SEO is needed but not enough: brand mentions, YouTube and original data matter more there. In practice that means:

| Before | Now | Why |
|---|---|---|
| Treated `llms.txt` and schema as AI-citation levers | Keep them (cheap, done), but **don't expect citations from them**. Schema is for rich results. | Google: neither is used for AI features. Ahrefs: 97% of valid llms.txt files got zero requests, and adding JSON-LD gave no measurable citation lift. |
| "Bump `dateModified` on refresh" | Change the date **only with a substantive update**, and add a visible "what changed" note | Google lists date-bumping as a search-engine-first warning sign |
| Ship pSEO templates at scale | **Quality gates before indexing.** Small batches, measure, then grow. | Google's *scaled content abuse* policy (AI, human or hybrid). *@regalstreak* stalled indexing by publishing too fast. |
| GEO = on-site formatting | GEO is mostly **off-site**: YouTube mentions (~0.74 correlation, strongest), branded web mentions (~0.66–0.71), original stats and quotes | Ahrefs study of 75k brands (Dec 2025); GEO paper (KDD 2024) |
| Treat traffic as the goal | Measure **influence + conversions** (citations, branded search, submissions and paid launches per landing page) | SparkToro: ~68% of US Google searches end without a click (Jan–Apr 2026) |

---

## 1. Baseline

### 1.1 Snapshot 2026-10-01 (GSC: 2026-09-02 → 09-29, 28 days)

| Metric | Value | Change vs 2026-09-26 snapshot |
|---|---|---|
| Clicks | **12,187** (~435/day) | ~405/day before |
| Impressions | 843,748 | spike Sep 27–29, see 1.3 |
| Clicks by section | tools 10,671 (88%), homepage 1,144, blog 301, profiles 48, categories 6 | same pattern |
| Blog | 449 URLs with impressions, 116k impressions, **301 clicks (0.26% CTR)** | still the biggest leak |
| Pages with impressions | 4,198; **3,456 got 0 clicks** | |
| Branded clicks ("devhunt", "dev hunt") | 971 / 28d | flat |
| Queries with dev words (api/sdk/code/github/agent/...) | ~1.7k of ~9.6k query-attributed clicks (~18%) | first measurement |
| **Ubersuggest US organic keywords** | **6,086** (Aug 5,360) | up |
| **Ubersuggest est. US traffic** | **13,863/mo**, the highest month in its 2-year series | up from 11,141 |
| Keywords in top 3 (US) | 33 (Aug 15) | up |
| Domain Authority / ref domains | 31 / 1,700 | flat |
| AI visibility (ChatGPT, 10 prompts) | **0%** | prompts are wrong, see 6.1 |
| `/compare/*` | **4,912 URLs in the sitemap**, 59 with any impressions (71 total) | new |
| `/tool/*/alternatives` | **1,323 URLs in the sitemap**, 13 with impressions (23 total) | new |
| Sitemap size | 17,618 URLs (tools 6,792 + compare 4,912 + alternatives 1,323 + profiles, categories) | |

### 1.2 Top earners (28 days)

| Page | Clicks | Impressions | Pos |
|---|---|---|---|
| /tool/yt1d | 3,495 | 145,620 | 3.5 |
| / | 1,144 | 8,604 | 6.2 |
| /tool/camdiv | 762 | 13,146 | 5.1 |
| /tool/yt1s-youtube-downloader | 568 | 47,303 | 8.2 |
| /tool/y2down | 543 | 31,725 | 7.2 |
| /tool/chatmatch | 458 | 8,628 | 8.6 |

The listings hidden on 2026-09-27 (spicygen, offrobe, hifun, hackaig, crano and others) made ~670 clicks in this window. **Expect a ~5% click drop** as Google removes them. That's the intended trade.

### 1.3 Anomaly to check

- [ ] **/tool/bootstrap got 69,084 impressions in 3 days (Sep 27–29) at position 2.0 with 0 clicks, for the query "+javascript libraries".** The "+" points at an automated or bot-style query, or a SERP feature. That one page drives the jump in impressions and the drop in average position on Sep 28–29. Exclude it from trend readings, and check it in GSC (by search appearance and device).

### 1.4 Data gaps

- [ ] **GA4 isn't linked in SEO Gets** (it returns `sources=gsc` only). Link it so we can see signups, submissions and paid launches per landing page. That's *@regalstreak*'s "most important step".
- [ ] SEO Gets' `get_gsc_performance` returns HTTP 400 ("unknown tool") as of 2026-10-01; `get_site_performance` works.
- [ ] Indexing data needs SEO Gets "super site" status, which devhunt.org doesn't have. Use GSC's Page indexing report directly.

---

### 1.5 Ahrefs (connected 2026-10-01)

- **API units ran out:** 799,991 of 800,000 used this cycle; it resets **2026-10-03**. Only free endpoints answered (projects, Site Audit summary). Ahrefs project for DevHunt: `5254791`.
- **Site Audit health score 0** (crawl of 2026-09-25: 2,032 of 2,042 URLs with errors, 2,035 with warnings). On 2026-10-01, every crawler gets HTTP 200: Googlebot, bingbot, GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, AhrefsBot and AhrefsSiteAudit. The Vercel project has no custom firewall rules. Likely cause: the database slowdowns that week (504s), not a permanent block. **Rerun the crawl** after the deploy and read the issue list (`site-audit-issues`, costs units).
- **Unit budget:** something else is using up 800k units a month (other sites or tools). Agree a monthly budget for DevHunt, roughly 50–100k units for the queries below.

**Queries to run after the reset** (each feeds a section of this plan):

| Query | Ahrefs tool | Feeds |
|---|---|---|
| DR, organic keywords and traffic, history | `site-explorer-metrics`, `-metrics-history`, `-domain-rating-history` | Baseline 1.1, progress log |
| Our keywords at positions 4–20 with volume and KD | `site-explorer-organic-keywords` (where position 4–20) | 5.2 near-page-one list (replaces the Ubersuggest volumes) |
| Organic competitors and keyword gap vs producthunt.com, alternativeto.net, saashub.com, uneed.best, peerlist.io | `site-explorer-organic-competitors`, `-organic-keywords` per competitor | Section 7: which alternatives, compare and category pages have demand |
| Their top pages by traffic | `site-explorer-top-pages` on alternativeto.net and saashub.com | Proven page templates and URL patterns for 7 |
| **Broken backlinks** to devhunt.org (removed tools, old URLs) | `site-explorer-broken-backlinks` | Phase D: 301 still-valuable dead URLs to the closest live page |
| Referring domains gap (who links to Uneed, Peerlist, Microlaunch but not us) | `site-explorer-referring-domains` per competitor | Phase D link targets |
| **AI citations of devhunt.org** per platform | `site-explorer-ai-responses-count` | 6.1 baseline (Ahrefs Brand Radar, the dataset behind the playbook's studies) |
| Brand Radar share of voice: DevHunt vs Product Hunt, Uneed, Peerlist, BetaList | `brand-radar-sov-overview`, `-mentions-overview`, `-cited-pages` | 6.1 measurement; replaces Ubersuggest AISV (its prompts don't fit) |
| Volume and KD for planned pages ("product hunt alternatives", "where to launch", "mcp servers", "{tool} alternatives") | `keywords-explorer-overview`, `-matching-terms` | 6.2 and 7 priorities |
| GSC data inside Ahrefs (CTR by position, anonymous queries) | `gsc-ctr-by-position`, `gsc-anonymous-queries` | Title test reading (5.4, gap #8) |

## 2. Audiences

SEO mostly serves A. C pays. D buys proof of A–C. E is the channel that grows.

| | Audience | They want | Pages that serve them | Share of SEO effort |
|---|---|---|---|---|
| A | **Tool evaluators**: search a tool's name or "X alternative" | Is it legit, what it costs, what's better or free | Tool, alternatives, compare and pricing pages; category hubs | ~70% |
| B | **Developers keeping up** | What's new and what's good | Home, newsletter, monthly roundups, `/stats` research | ~10% |
| C | **Makers** (founders, devrel, marketers) | Visibility, a backlink, a second page-one result for their brand name | `/launch`, "where to launch", launch guides, badge, maker reports | ~20% |
| D | **Sponsors** | Proof of reach and audience quality | `/advertise`, `/stats` | indirect |
| E | **AI assistants and agents** | Quotable facts and structured tool data | Everything above, plus YouTube and off-site mentions | cross-cutting |

**We often outrank the tool's own site, and that's an asset.** It's the main pitch to group C ("launch and own a second page-one result for your name"). To keep it:
- Visit button above the fold (done: `ToolHero`).
- Give what the tool's own site won't: alternatives, comparisons, votes, pricing summary, "updated" data.
- Avoid thin copies of the tool's own marketing text. Those look like doorway pages.

**Open decision (John):**
- [ ] Stay dev-only, or accept "software tools in general"? Today ~18% of query clicks are developer-related; the rest is downloaders and AI media tools. The answer decides which tools get alternatives and compare pages first, and what we pitch sponsors.

---

## 3. Status: what's live (verified 2026-10-01)

**Done**
- [x] www → root redirect (`https://www` 301 → `https://devhunt.org`). Minor: `http://www` takes two hops (308 → https://www → 301). Make it one hop in Vercel.
- [x] Trailing slash 308s to the clean URL.
- [x] Self-referencing canonicals on every page type.
- [x] Hidden NSFW listings (48, 2026-09-27). New submissions are moderated (`utils/moderation.ts`: adult ≥0.6 is blocked and saved as `deleted=true`).
- [x] robots.txt: disallows `/account/`, `/api/` and `/private/`; allows `/api/og/`.
- [x] JSON-LD:
  - Organization + WebSite on the homepage
  - SoftwareApplication (+ FAQPage when the tool has a profile) on tool pages
  - ItemList on alternatives pages
  - BlogPosting + BreadcrumbList on blog posts
  - FAQPage on `/faq`
  - AboutPage + Person on `/the-story`
- [x] `/llms.txt`, `/faq`, `/about` → `/the-story`, `/stats`, `/advertise`.
- [x] Branded OG images for tools, makers, categories, comparisons, alternatives and the homepage.
- [x] Alternatives pages are noindexed unless the tool has ≥2 picked alternatives or ≥5 category peers.
- [x] Tool meta description is slogan + description, cut to 160 chars (no longer the slogan alone).

**Gaps found in the code audit**

Ordered by impact (P1 highest).

| # | Gap | Where | Priority |
|---|---|---|---|
| 1 | **6,235 compare + alternatives URLs entered the sitemap at once.** See section 4. | `app/sitemap.xml/route.tsx:39-40` | P1 |
| 2 | Sitemap may list alternatives pages that are noindexed. Sitemap and noindex must agree. | sitemap route vs `alternatives/page.tsx:38` | P1 |
| 3 | No `lastmod` in the main sitemap; one 17.6k-URL file | `utils/sitemap.ts` | P2 |
| 4 | Blog sitemap (`/blog/sitemap.xml`) isn't in robots.txt | `app/robots.txt` | P2 |
| 5 | IndexNow key file exists, but nothing submits URLs | `public/6f2e…602.txt` | P2 |
| 6 | No Bing Webmaster verification (ChatGPT search uses Bing's index) | layout | P2 |
| 7 | Empty profiles aren't noindexed (only left out of the sitemap); 745 profile URLs got impressions | `app/[user]/page.tsx` | P2 |
| 8 | Tool title `{name} - {slogan}` has no brand and no intent words | `app/tool/[slug]/page.tsx:58` | P2 |
| 9 | Categories, compare and profiles have no JSON-LD; no breadcrumbs except on blog posts | | P3 (rich results only) |
| 10 | Blog tag and category pages have no description, and the canonical ignores `?page` | `app/blog/tag`, `category` | P3 |
| 11 | "Trending launches" on tool pages is `ssr:false`, so its internal links aren't in the HTML | `app/tool/[slug]/page.tsx:17` | P2 |
| 12 | Footer has no category links; deep pages rely on in-content links | `Footer.tsx` | P3 |
| 13 | `/advertise` isn't in the sitemap | `utils/sitemap.ts:4` | P3 |
| 14 | Paid-launch dofollow links, deliberate (decided 2026-09-27, don't re-argue). Google's link spam policy wants `rel="sponsored"` on paid links. If GSC ever shows a manual action, switch to `sponsored` and file a reconsideration request. Keep "dofollow backlink" out of public sales copy. | `utils/links.ts:74-79` | watch |

---

## 4. Main risk now: scaled programmatic pages

Google's spam policy defines **scaled content abuse** as many pages generated mainly to rank, with little value, whether made by AI, humans or both. Their AI-optimization guide also warns against making pages for every fan-out variant. We just published **4,912 compare and 1,323 alternatives URLs**. So far only 59 and 13 of them have any impressions.

The template is sound (*@alexgroberman* / Rankscale: "alternatives" and "vs" pages from vendors get cited by AI Overviews and ChatGPT). Volume is the risk. Steps:

- [x] **Quality gate for indexing compare pages** (2026-10-01, `utils/seoIndex.ts`). Shipped rule: index when either tool is in the 50-tool pilot or both tools have ≥20 votes; alternatives pages need ≥2 picked alternatives plus the pilot or ≥10 votes. Result: 426 compare + 263 alternatives URLs in the sitemap (was 4,912 + 1,323). Original idea: `index` only when both tools are live, both have a profile (features and pricing), the pair has a real `difference` text, and either pair gets search demand or both tools have votes above a threshold. Otherwise `noindex,follow` and leave the page out of the sitemap. Target the first wave at a few hundred pairs, not 4,912.
- [x] Make the sitemap match the noindex rules exactly (gap #2). Both use the same functions in `utils/seoIndex.ts`.
- [ ] **Pilot (live 2026-10-01; read on ~10-22):** top 50 tools by GSC clicks (`SEO_PILOT_SLUGS`), plus their alternatives pages and 1–3 compare pairs each. Check in GSC Page indexing after 3 weeks:
  - If more than 50% are indexed and getting impressions, add the next tier.
  - If most sit in "Crawled – currently not indexed", improve the template before growing.
- [ ] Watch **site-wide** clicks and impressions weekly for 6 weeks. A slow sitewide drop after a big URL push points to quality, not the pages themselves.
- [ ] Every programmatic page needs something no other page has: our votes and comments, a pricing table, a "best for" verdict, an FAQ written from real questions. No near-duplicate text across pairs.

---

## 5. Phase A: Fix and refresh what already ranks (now → 60 days)

Rule (*@jakezward*): spend ~60 days refreshing positions 4–20 before defaulting to new pages. Google: no preferred word count, and change the date only with a real change.

### 5.1 Pages with impressions but no clicks (`no_clicks` flag: impressions >500, CTR <0.5%, last 28 days)

Fix: put the exact query in the title, H1 and first sentence, answer it in the first two lines, and match the page type to the intent (*@regalstreak*).

| Query | Impr 28d | Pos | Clicks | Page | Done |
|---|---|---|---|---|---|
| tiktokio / tiktokio video downloader | 60,388 | 6–8 | 12 | /tool/-tiktokio-tiktok-downloader- | [ ] |
| toolfk / toolfk ai | 52,421 | 5.8 | 132 | /tool/toolfk | [ ] |
| google maps api | 5,419 | 7.0 | 0 | /blog/google-map-api-for-developers-integration-basics | [ ] |
| vidful | 4,924 | 6.3 | 5 | /tool/vidfulai-free-ai-video-generator-online | [ ] |
| online gdb | 1,409 | 6.3 | 3 | gdb blog posts (merge, 5.3) | [ ] |
| vidbeer, 77adc, lan orangutan, getgpt, sopilot, aitdk, pseudorun | 600–1,300 each | 6–9 | ~0 | their tool pages | [ ] |

Also check: **does each tool page answer "is X safe/legit/free"?** These tool-name searchers often want a verdict, not a description.

### 5.2 Near page one (`almost_there`: positions 3–20, non-brand)

| Query | Impr 28d | Pos | Clicks | Done |
|---|---|---|---|---|
| yt1s | 25,455 | 8.9 | 200 | [ ] |
| y2down (+ app) | 23,556 | 7.5 | 265 | [ ] |
| dolphin radar | 18,830 | 3.8 | 164 | [ ] |
| snapwc / snap wc | 14,980 | 3.5–4.6 | 128 | [ ] |
| easycomment (+ ai) | 12,655 | 4.6–5.0 | 88 | [ ] |
| chatmatch | 7,783 | 8.6 | 417 | [ ] |
| camdiv | 7,720 | 5.7 | 401 | [ ] |
| 4download | 7,678 | 5.2 | 139 | [ ] |
| ss youtube | 4,474 | 7.7 | 24 | [ ] |

US-volume targets (Ubersuggest) that are still open:

| Keyword | US volume | KD | Pos | Done |
|---|---|---|---|---|
| easy comment (+ ai) | 8.1k + 4.4k | 15–16 | 9–11 | [ ] |
| student developer pack github | 8.1k | 39 | 17 | [ ] |
| tts sam | 6.6k | 30 | 23 | [ ] |
| android software development kit | 4.4k | 57 | 18 | [ ] |
| github student | 2.9k | 35 | 30 | [ ] |
| steam calculator | 1.9k | 34 | 28 | [ ] |
| dev tools for safari | 1.6k | 48 | 16 | [ ] |

### 5.3 Blog: the biggest leak

The blog has 449 indexed URLs and 0.26% CTR. The posts are AI-generated (SEObot) with the organization as author. That fits the "scaled, commodity, no who/how/why" pattern Google's helpful-content guidance warns about.

- [ ] Export every blog URL with 16 months of clicks, impressions and position.
- [ ] **Prune:**
  - No clicks in 16 months and position >50: 410 or noindex.
  - Overlapping posts: merge into one and 301 the rest. Clusters: GitHub Student Pack (3 posts), Safari devtools (2), Chrome devtools (3), online gdb (2+), free online forms (3+), web traffic/stats tools (3+), no-code platforms.
- [ ] **Rebuild the survivors** as non-commodity pages:
  - A real author byline (John or a named editor) with an author page. Who/How/Why per Google.
  - An answer-first block.
  - Original proof: DevHunt data (votes, launches, categories), screenshots, tested steps.
  - A table and an FAQ from real "People also ask" questions.
  - Links to category hubs and 3–5 tool pages.
- [ ] Decide on SEObot: keep it only for drafts a human edits and signs, or stop auto-publishing. Unedited auto-publishing at volume is exactly the scaled-content risk.

### 5.4 Technical fixes (from section 3)

- [x] Gap #1–2: compare/alternatives gating and sitemap agreement (section 4)
- [x] Gap #3: `/sitemap.xml` is now an index of `/sitemaps/pages.xml` (static, categories, makers), `/sitemaps/tools.xml` (with `lastmod`), `/sitemaps/compare.xml` (gated compare + alternatives) and `/blog/sitemap.xml`. **Resubmit `/sitemap.xml` in GSC** so it picks up the index.
- [x] Gap #4: blog sitemap listed in robots.txt
- [x] Gap #5: daily IndexNow cron (`/api/cron/indexnow`, 06:30 UTC) for tools edited, launched or removed in the last 26h
- [ ] Gap #6 (John): Bing Webmaster Tools. Easiest is "Import from Google Search Console", which verifies and brings sitemaps in one step.
- [x] Gap #7: `noindex,follow` on profiles with no live launched or paid tool (same rule as the sitemap)
- [ ] Gap #8 (test live 2026-10-01, read on ~10-29): 11 tools in `TITLE_TEST_SLUGS` use `{Name}: Features, Pricing & Alternatives ({year})`; only tools whose page shows pricing and picked alternatives. Original idea: tool title template, e.g. `{Name}: {short value prop} | DevHunt` (≤60 chars). Then **test it on the top 20 tools by impressions** before rolling out everywhere, comparing CTR 28 days before and after.
- [x] Gap #11: "Trending launches" is server-rendered on tool pages from cached home data. Original idea: render "Trending launches" on the server (or a static list of related tools) so tool pages link to each other in the HTML
- [ ] Gap #9: BreadcrumbList on tool, category and compare pages; ItemList on categories. This is for rich results, not AI citations.
- [ ] One-hop `http://www` redirect (John, Vercel domain settings: point `http://www` straight at `https://devhunt.org`)
- [ ] Mobile performance: rerun PageSpeed (the 2026-10-01 audit was still pending). Earlier: mobile LCP 3.3s and time to interactive 8.9s. Target LCP <2.5s on tool pages.
- [ ] In GSC: confirm the site is **included in Search generative AI features**, and review the **Generative AI performance report** monthly.

---

## 6. Phase B: AI assistants (GEO / AEO)

### 6.1 Measure first

- [ ] **Replace the 10 Ubersuggest prompts.** The current ones ("best directory builder", "AI blog generator", "marketing tools for e-commerce") are about John's other products, not DevHunt, so 0% means nothing yet. New set:
  1. Where should I launch a developer tool?
  2. What are the best Product Hunt alternatives for developers?
  3. Best sites to submit a new dev tool or SaaS
  4. Where can I discover new developer tools every week?
  5. How do I get early users for my developer tool?
  6. Best alternatives to {top tool in our traffic, e.g. yt1d}
  7. Best new AI coding tools this month
  8. Best open-source alternatives to {popular dev tool}
  9. Which dev tools have MCP servers?
  10. Is DevHunt legit / DevHunt vs Product Hunt
- [ ] Turn on Gemini and Google AI Overviews tracking in Ubersuggest (`aisv_gemini_answers_tracked` is false).
- [ ] **Monthly manual audit** of the same prompts in ChatGPT, Perplexity, Gemini, Copilot, Google AI Mode and **Grok** (no public citation study exists for Grok). Log who is cited and whether facts about DevHunt are correct.

### 6.2 On-site: pages worth quoting

- [ ] **"Product Hunt alternatives for developers"**: a table vs Product Hunt, Uneed, Peerlist, Microlaunch, BetaList, Show HN, with honest pros and cons and our own numbers. Wording differs, but intent matches prompts 1–3.
- [ ] **"Where to launch your dev tool (2026)"** plus a **"How to launch a dev tool"** playbook. Original advice from actual DevHunt launch data, not a commodity listicle.
- [ ] **Original stats on every key page.** The GEO paper (KDD 2024): quotes, statistics and cited sources raised visibility by up to ~40% in its setup; keyword stuffing hurt. We own unique data (launches, votes, impressions per category, `/stats`). Put real numbers on hubs and guides.
- [ ] **Long conversational queries** (`ai_mode` flag, 7+ words): 508 such queries with impressions in the last 28 days (2,949 impressions). Examples: "best mobile app debugging platforms for ios developers testing without context switching", "is there a platform that generates social graphics from github releases without manual design work?". Fold them into category hubs and FAQs. **Don't** make one page per variant (Google mythbust).
- [ ] Visible "updated {date}: what changed" notes on hubs, only when they actually change. ChatGPT favors fresher citations (Ahrefs: ~958 days vs ~1,416 for organic results).

### 6.3 Off-site: the strongest AI-visibility correlates

- [ ] **YouTube program.** Ahrefs (75k brands): YouTube mentions correlate ~0.74 with AI visibility, the strongest signal measured. YouTube was 5.6% of all AI Overview citations and 18.2% of citations from outside the top 100 (Mar 2026).
  - Weekly: "Top dev tools launched this week on DevHunt" (3–5 minutes, screen recordings).
  - Monthly: "Best {category} tools" and "{popular tool} alternatives" for the top categories.
  - Titles, descriptions and transcripts name DevHunt and the tools, and link to DevHunt pages.
- [ ] **Earn real brand mentions** (branded web mentions ~0.66–0.71): podcasts, maker interviews, "how I launched" guest posts, being included in "where to launch" lists. **No bought mentions** (Google spam policy).
- [ ] **Reddit, Indie Hackers, Hacker News:** honest answers in "where to launch" threads from John's account. No spam, no rings of accounts.
- [ ] **Entity consistency:** the same name, description, logo and founder on X, LinkedIn, GitHub, Crunchbase and `/the-story`. A Wikipedia/Wikidata entry only if DevHunt genuinely meets notability rules.
- [ ] Maker badge (Phase D): every embed is a branded mention plus a link.

---

## 7. Phase C: New pages (60–120 days, gated by Phase A results)

Order follows audience A first, then C, then E. Each new template launches with a pilot batch and an indexing check.

| Idea | Audience | Verdict | Notes |
|---|---|---|---|
| Alternatives pages (built) | A | **Gate, then grow** | Section 4 |
| Compare pages (built) | A | **Gate, then grow** | Only pairs with demand or real differences |
| **Free / open-source alternatives to X** | A | Build | Variant of alternatives, filtered by pricing and license. Only for tools with ≥3 qualifying matches. |
| **Pricing / "is X free" pages** | A | Build as a section of the tool page, not new URLs | High intent; avoids thin URLs |
| **Tools with MCP servers** hub (`/mcp`) | A, E | Build | MCP exists only as a category today. Add a `has_mcp` field, a hub with setup snippets, and update it monthly. |
| **"Best {category} tools ({year})" hubs** | A | Upgrade `/tools/{slug}` | Intro, our ranking method, table, FAQ, our stats. Content goes below or above the grid (*@SEOKeval*). |
| **Monthly roundups** `/best/{yyyy}/{mm}` | B, C | Build | Real winners, our vote data, links to tool pages. A natural link target for makers. |
| **State of Dev Tools report** (quarterly, plus an annual big one) | B, D, E | Build | Original data from launches, categories and votes. Gives journalists and AIs something to cite, and is the link engine. Pitch to newsletters. |
| **Launch guides** (how to launch / promote a dev tool, launch-day checklist) | C | Build | Written from DevHunt's own launch data. Ties to `/launch`. |
| **Educational how-tos** (Chrome extension, AI agent, monetizing open source) | B | **Selective** | Big volume, strong incumbents (MDN, Google docs). Only where we add tested steps plus relevant tools. Low-KD Ubersuggest picks: "delete a branch in github" (3 × 8.1k, KD 29–33), "ai first code editor" (4.4k, KD 25), "developer tools in chrome" (5.4k, KD 8). |
| **Daily auto-generated news posts** | B | **Don't**, as automated rewrites | Matches the scaled-content and commodity patterns. Instead: a weekly human-edited digest with our take, linking to tool pages. |
| **Top Hacker News discussions** | B | **Reframe** | Not rehosted threads. "Dev tools HN talked about this week", with our links and data. |
| **Integrations pages** ("tools that work with Supabase / Vercel / Stripe") | A | Later | Needs integration data; generate only where ≥5 tools qualify. |
| **"Stack behind {product}"** | B | Later | Shareable, editorial, not programmatic. |
| **Public read API / MCP server for DevHunt data** | E | Later | Lets agents query and cite DevHunt. Promote it on the MCP hub. |

---

## 8. Phase D: Authority and links

- [ ] **"Launched on DevHunt" badge** linking to the maker's tool page (not the homepage).
- [ ] **Maker SEO report:** email each maker their tool page's Google impressions (we rank for their brand name). It proves the launch value and gets them to embed the badge.
- [ ] **Pass homepage authority inward.** ~600 of 1,700 referring domains point at `/`. Link from the homepage and top tool pages to pages stuck near page one, and rotate monthly (*@regalstreak*).
- [ ] **Backlink gap vs uneed.best, peerlist.io, microlaunch.net, betalist.com, saashub.com.** Ubersuggest's report never finished; rerun `backlink_opportunity`.
- [ ] Link-worthy assets: the State of Dev Tools report, `/stats`, the MCP hub, awesome-lists, and the open-source repo README.

---

## 9. Weekly routine (~1 hour, via SEO Gets)

Based on *@regalstreak*'s six flags and *@jakezward*'s refresh loop.

- [ ] `almost_there`: non-brand queries at positions 3–20 → add the exact phrase or 2–3 H2s on the ranking page
- [ ] `no_clicks`: impressions >500 and CTR <0.5% → title, H1, first lines, page type
- [ ] `decaying`: clicks down ≥30% week on week → find the cause
- [ ] `untargeted`: a query with no matching page → section on an existing page first, new page only if the search results show a different intent
- [ ] `wrong_intent`: search results want a tool or comparison and we show an essay (or the reverse) → change the format
- [ ] `ai_mode`: 7+ word queries → fold into hub FAQs
- [ ] Indexing: count of "Crawled/Discovered – not indexed" for compare and alternatives (section 4)
- [ ] Conversions by landing page, once GA4 is linked
- [ ] Monthly: GSC Generative AI report, Ubersuggest AI visibility, manual prompt audit, progress log row

---

## 10. Don't do

From Google's docs plus the playbook's anti-patterns.

- Date-bumping without a real change
- One page per long-tail or fan-out variant
- Schema spam or FAQ spam aimed at AI Overviews
- Unedited auto-published AI posts at volume
- Buying mentions, links or reviews; fake engagement
- Parasite/off-site publishing on hosts we don't own or aren't allowed to publish on
- Treating `llms.txt` as a channel
- Panicking over day-to-day AI-answer swings. Brand lists reshuffle often (~70k-response study via @ViperChill/@iannuttall), so read trends over weeks.

---

## 11. Progress log

| Date | Clicks/day (28d avg) | Ubersuggest KW (US) | Est. US traffic | DA | Ref domains | AI visibility | Notes |
|---|---|---|---|---|---|---|---|
| 2026-09-26 | ~405 | 5,360 | 11,141 | 31 | 1,681 | 0% | Baseline |
| 2026-10-01 | ~435 | 6,086 | 13,863 | 31 | 1,700 | 0% (wrong prompts) | 48 NSFW hidden; 6.2k compare/alternatives URLs added; bootstrap anomaly |

## 12. Changelog

| Date | Change | Commit | Expected effect |
|---|---|---|---|
| 2026-09-27 | Hid 48 NSFW/undress listings | DB soft delete | Site quality; ~5% click loss |
| 2026-09-29 | llms.txt, /faq (FAQPage), /about → /the-story (AboutPage + Person), BlogPosting + BreadcrumbList | d7e377f | Rich results, entity clarity |
| 2026-09-29 | Branded OG images for all page types | 3b2d0e7, b9ce708 | Social CTR |
| 2026-09-29 | Public /stats page | 1cc15f9+ | Citable data, sponsor proof |
| 2026-09-27 | Compare + alternatives pages (and in the sitemap) | 47cb134 | Needs gating per section 4 |
| 2026-10-01 | Index gate (pilot + votes), split sitemap with lastmod, IndexNow cron, maker-only profile indexing, SSR trending links, title test on 11 tools | (this commit) | Fewer thin URLs; faster Bing pickup; CTR read on ~10-29 |
