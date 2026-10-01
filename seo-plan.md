# DevHunt SEO / AEO / GEO Plan

Tracking doc for devhunt.org organic growth across Google, Google's AI features and AI assistants. Tick boxes as work ships, and add the date and commit.

- **Owner:** John Rush
- **Created:** 2026-09-26. **Rewritten:** 2026-10-01 (new data, code audit, three research docs; split into Part A in our control / Part B outside our control).
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
| AI visibility (ChatGPT, 10 prompts) | **0%** | prompts are wrong, see A9 |
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
| Our keywords at positions 4–20 with volume and KD | `site-explorer-organic-keywords` (where position 4–20) | A5 near-page-one list |
| Organic competitors and keyword gap vs producthunt.com, alternativeto.net, saashub.com, uneed.best, peerlist.io | `site-explorer-organic-competitors`, `-organic-keywords` per competitor | A4/A7: which alternatives, compare and category pages have demand |
| Their top pages by traffic | `site-explorer-top-pages` on alternativeto.net and saashub.com | Proven page templates and URL patterns for A7 |
| **Broken backlinks** to devhunt.org (removed tools, old URLs) | `site-explorer-broken-backlinks` | A3: 301 still-valuable dead URLs to the closest live page |
| Referring domains gap (who links to Uneed, Peerlist, Microlaunch but not us) | `site-explorer-referring-domains` per competitor | B2 link targets |
| **AI citations of devhunt.org** per platform | `site-explorer-ai-responses-count` | A9 baseline (Ahrefs Brand Radar, the dataset behind the playbook's studies) |
| Brand Radar share of voice: DevHunt vs Product Hunt, Uneed, Peerlist, BetaList | `brand-radar-sov-overview`, `-mentions-overview`, `-cited-pages` | A9 measurement; replaces Ubersuggest AISV |
| Volume and KD for planned pages ("product hunt alternatives", "where to launch", "mcp servers", "{tool} alternatives") | `keywords-explorer-overview`, `-matching-terms` | A7 priorities |
| GSC data inside Ahrefs (CTR by position, anonymous queries) | `gsc-ctr-by-position`, `gsc-anonymous-queries` | Title test reading (A0) |

### 1.6 DataForSEO research (2026-10-01, US, Google)

**Domain**
- 1,457 ranked keywords, est. ~2,740 organic visits/mo (DataForSEO's model, lower than Ubersuggest's 13.9k). Distribution: 16 in the top 3, 83 at positions 4–10, **295 at 11–20**, 303 at 21–30. Churn: 760 new, 1,296 lost.
- Backlinks: 1,716 referring domains, 52k backlinks, spam score 10 (target 14). **39k of 52k backlinks sit in footers**, mostly site-wide badges, so few links point deep.

**AI visibility**
- **ChatGPT mentions: DevHunt 6, Product Hunt 926.** Product Hunt is cited mainly through its **product pages** (798 times as a search-result domain), the same page type as our `/tool/*`. Tool pages are our GEO asset; making them the best-sourced page about each tool (pricing, alternatives, votes, real comments) is the AI play too.
- **Google AI Overview for "product hunt alternatives" already lists DevHunt** ("a weekly launch platform built explicitly for developer tools"). It cites pinggy.io's listicle, not our site. Proof that off-site mentions drive AI answers. The overview also cites startupa.ge, smollaunch.com and a Reddit r/startups thread; organic results include Reddit, apify, launchvault, peerlist, clickup and producthunt.com. **DevHunt's own site isn't in the top 10.**

**Near page one (positions 4–20, by US volume; 678 keywords in range)**

| Keyword (cluster) | US vol | KD | Pos | Page |
|---|---|---|---|---|
| onlinegdb | 12,100 | 3 | 7 | /blog/debug-code-anywhere-with-online-gdb-debuggers |
| visualgpt | 14,800 | 8 | 20 | /tool/visualgpt |
| image describer | 12,100 | 30 | 11 | /tool/image-describer |
| reddit list / redditlist | 8,100 + 8,100 | 3–14 | 8–11 | /tool/reddit-list |
| GitHub Student Pack cluster (6 variants) | ~25k combined | 22–49 | 15–20 | /blog/github-student-pack-getting-started |
| Safari dev tools cluster (~20 variants, 1,300–1,600 each) | ~30k combined | 10–37 | 8–20 | 3 overlapping Safari posts (merge into one) |
| easy comment (+ ai) | 9,900 + 5,400 | n/a | 8–10 | easycomment tool |
| namso gen | 8,100 | 3–5 | 12–14 | /tool/namso-gen (**check moderation**: a test credit card number generator, close to the fraud rule) |
| android software development kit | 4,400 | 44 | 15 | android SDK post |
| facewow face swap | 4,400 | 9 | 19 | /tool/facewow |

**Demand for planned pages (US monthly volume / KD)**

| Keyword | Vol | KD | Read |
|---|---|---|---|
| mcp servers | 60,500 | 34 | Head term owned by dedicated directories (mcpservers.org lists 9,800+ servers; mcp.so, GitHub). Go after the long tail ("{tool} mcp server", "best mcp servers" 880/KD 14, "awesome mcp servers" 880/KD 8), not the head term. |
| ai coding assistant | 18,100 | 37 | Category hub "AI coding assistants" |
| github student developer pack | 8,100 | 38 | Merged guide (A6) |
| best ai agents | 1,900 | 21 | Category hub |
| dev tools | 1,900 | 27 | Homepage / category hubs |
| notion alternatives | 1,600 | n/a | Alternatives template, if Notion-like tools are listed |
| cursor alternatives | 1,000 | **5** | Alternatives template: **"{well-known dev tool} alternatives" is low-KD and high-intent** |
| supabase alternatives | 880 | n/a | same |
| open source alternatives | 880 | 15 | "Open-source alternatives" hub (A7) |
| postman alternatives | 720 | **2** | same |
| vercel alternatives | 720 | n/a | same |
| best ai coding tools | 720 | 24 | Category hub |
| firebase alternatives | 320 | n/a | same |
| product hunt alternative(s) | 110 | n/a | Small volume, but drives the AI Overview above: get onto the cited listicles first |
| startup / saas directories | 140 each | 14 | Low |
| "how to launch a saas", "submit your startup", "new developer tools" | 10–20 | n/a | **No search demand.** Launch guides serve makers via links and AI answers, not Google volume. |

**Link gap:** 247 domains link to all of Uneed, Microlaunch, Peerlist, BetaList and SaaSHub but not to DevHunt. Top ones by rank:

- Launch lists and directories: clakr.com, shouldiuse.io, robuta.com, vibelaunched.com, launchpointzero.com, growstartup.co, launch-list.org, saaslaunch.site, launching.best, toolfound.com, saascity.io, topsaasdirectories.com, bootstraparena.com, makerhunt.io, agentlaun.ch
- Communities: indiehackers.com, dev.to, beehiiv.com

Many are self-serve "submit your product" lists, so they're the quickest wins. Skip spammy ones (e.g. ainsfwbots.com, link farms).

**What changes in the plan**
1. **New pilot for alternatives pages: well-known dev tools** (Cursor, Postman, Supabase, Vercel, Firebase, Notion...). KD 2–5 and real volume, unlike most of our listed tools. Needs those tools to exist as listings (or a "popular tools" seed list) with real alternatives from DevHunt. See A4.
2. **Product Hunt alternatives: off-site first.** Ask to be added to or upgraded in pinggy.io, startupa.ge, smollaunch.com, launchvault.dev, clickup's list and the Reddit threads (honestly, from John's account). Only then our own comparison page.
3. **MCP:** long tail plus per-tool "{tool} MCP server" pages, not a head-term directory race.
4. **Quick wins (A5):** onlinegdb (KD 3, pos 7), reddit-list (KD 3–14, pos 8–11), visualgpt (KD 8, pos 20), and merging the Safari and GitHub Student Pack clusters.
5. **Moderation check:** namso-gen (credit card number generator) against the fraud rule.

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
- [x] **Decided 2026-10-01 (John):** non-dev tools stay, but dev tools are the primary topic (reference listings, hubs, alternatives and compare pages focus on dev tools). Original question: stay dev-only, or accept "software tools in general"? Today ~18% of query clicks are developer-related; the rest is downloaders and AI media tools. The answer decides which tools get alternatives and compare pages first, and what we pitch sponsors.

---

## How this plan is split

- **Part A: in our control.** Code, content, data, moderation and settings in our own accounts. Do all of Part A first.
- **Part B: outside our control.** Other people's sites, communities, press, links and mentions. Start only after Part A is done.

Owners: **[C]** Claude can do it in this repo or with the connected tools; **[J]** John has to click or decide (accounts, money, policy).

---

# PART A: In our control

## A0. Ship what's built

- [x] Pushed to `origin main` 2026-10-01 after a clean `next build` of the committed tree (ad395ed…9638e41). **[J]** sync the Vercel fork to deploy.
- [x] Title test (11 tools) and server-rendered "Trending launches" committed with the tool-page refactor (2026-10-01).
- [ ] **[C]** After deploy, check live: `/sitemap.xml` index, `/sitemaps/compare.xml` (~689 URLs), noindex on an ungated comparison, IndexNow cron runs (Vercel cron logs).

## A1. Account settings (one-time clicks)

- [ ] **[J]** GSC: resubmit `https://devhunt.org/sitemap.xml` (it's now a sitemap index).
- [ ] **[J]** GSC: confirm the site is **included in Search generative AI features**, and open the **Generative AI performance report**.
- [ ] **[J]** Bing Webmaster Tools: "Import from Google Search Console" (verifies the site and brings the sitemaps). ChatGPT search uses Bing's index.
- [ ] **[J]** Link GA4 in SEO Gets, so conversions (signups, submissions, paid launches) show per landing page.
- [ ] **[J]** Ahrefs: rerun the DevHunt Site Audit after the deploy (the 2026-09-25 crawl scored 0, most likely due to the 504s that week). Budget ~50–100k units/month for DevHunt.
- [ ] **[C, with J's OK]** Ubersuggest: replace the 10 AI-visibility prompts with DevHunt prompts (list in A9) and turn on Gemini / AI Overview tracking.
- [x] www → root redirect (Vercel shows `www.devhunt.org` 301 → `devhunt.org`). The extra `http://www` hop is Vercel's automatic HTTPS upgrade and can't be changed; harmless.

## A2. Decisions and moderation

- [x] **Decided 2026-10-01:** non-dev tools are fine as long as dev tools are the primary topic. Homepage and hubs feature dev tools; non-dev tool pages keep their traffic without being promoted.
- [x] namso-gen stays (2026-10-01): a Luhn test-card generator developers use to test payment forms.
- [ ] **[J]** Borderline listings: nofiltergpt (3581), deepswap (6350), imagetovideo (7224), soulmaite-io (3753).
- [x] SEObot auto-publishing stopped by John (2026-10-01).
- [x] 48 NSFW/undress listings hidden (2026-09-27); new submissions moderated (`utils/moderation.ts`).

## A3. Technical SEO

Done (verified 2026-10-01):
- [x] Self-referencing canonicals on every page type; trailing slash 308s to the clean URL
- [x] robots.txt: disallows `/account/`, `/api/`, `/private/`; allows `/api/og/`; lists both sitemaps
- [x] Sitemap index with per-type files, `lastmod` on tools, gated compare and alternatives (`utils/seoIndex.ts`)
- [x] Daily IndexNow cron (`/api/cron/indexnow`, 06:30 UTC)
- [x] `noindex,follow` on profiles without a live launched or paid tool
- [x] JSON-LD: Organization + WebSite (home), SoftwareApplication + FAQPage (tools), ItemList (alternatives), BlogPosting + BreadcrumbList (blog), FAQPage (/faq), AboutPage + Person (/the-story)
- [x] `/llms.txt`, `/faq`, `/about` → `/the-story`, `/stats`, `/advertise`; branded OG images
- [x] All major crawlers get HTTP 200 (Googlebot, bingbot, GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Ahrefs)

To do:
- [x] BreadcrumbList on tool (DevHunt > category > tool), category and compare pages; ItemList on categories (2026-10-01)
- [x] Blog tag and category pages: description, `Page N` in the title, canonical includes `?page=N` (2026-10-01)
- [x] Footer "Popular categories" row: 12 category hubs linked from every page (2026-10-01)
- [x] Lighthouse on /tool/yt1d (2026-10-01, desktop): Performance 99, SEO 100, Best Practices 100, Accessibility 90; LCP 0.93s, CLS 0, TTFB 12ms. Speed is not a problem on tool pages. Fixed the flagged issues: an unnamed X link in the footer, and the weekly-email button's label mismatch. Left alone: low-contrast small grey labels (a design call). New Lighthouse "Agentic Browsing" score: 67 (llms.txt passes; no WebMCP tools registered; see A7).
- [ ] **[C]** Investigate /tool/bootstrap: 69k impressions in 3 days for "+javascript libraries" at pos 2.0 with 0 clicks. Exclude it from trend readings. (2026-10-01: SEO Gets' MCP no longer accepts the page and query dimensions, and Ahrefs has no GSC data connected, so drilling in needs the GSC UI: Performance → filter page /tool/bootstrap → Search appearance and Device. **[J]**)
- [x] Broken links (DataForSEO, 2026-10-01): 119 dead URLs, but nearly all were DevHunt's own old relative links (profile socials like `devhunt.org/x.com/...` and tool URLs without `https://`). Both are already fixed in today's code: live profile and category pages output only absolute links, and no tool description has scheme-less links. They'll drop out as crawlers revisit. No external backlinks point at dead pages, so no redirects are needed.

## A4. Programmatic pages: gated growth

Risk: Google's *scaled content abuse* policy. 6,235 compare/alternatives URLs went into the sitemap on 2026-09-27; now gated to 689.

- [x] Index gate (pilot of the top 50 tools by GSC clicks, or ≥20 votes for compare / ≥10 for alternatives); the sitemap and page robots use the same rule.
- [ ] **[C] ~2026-10-22:** read the pilot in GSC Page indexing.
  - More than 50% indexed with impressions: add the next tier.
  - Mostly "Crawled – not indexed": improve the template first.
- [ ] **[C]** Weekly for 6 weeks: site-wide clicks and impressions (a slow sitewide drop would point to quality).
- [ ] **[C]** Make each programmatic page unique: votes and comments, a pricing table, a "best for" verdict, an FAQ from real questions; no near-duplicate text across pairs.
- [x] **Reference listings for well-known tools** (decided and built 2026-10-01):
  - Cursor, Claude Code, Codex, Copilot, Supabase, Vercel, Postman and others: 42 in `utils/referenceTools.ts`, seeded by `scripts/seed-reference-tools.ts`.
  - New `products.is_reference` column; only DevHunt can set it (guard triggers).
  - No launch dates, so they never enter the weekly contest, roundups or launch stats. Votes are open any time.
  - The page says "Listed by DevHunt" with a claim link instead of a maker.
  - They appear in categories (as a "Well-known {X} tools" row above the vote ranking), search, the sitemap and as alternatives in other tools' profiles.
- [x] **Alternatives and comparisons for well-known tools** (2026-10-01):
  - All 42 reference listings have profiles, and their alternatives pages are indexable ("Best Cursor Alternatives in 2026" leads with Claude Code, Copilot and Cline).
  - Comparisons are indexed when both tools are reference listings (Cursor vs Windsurf, Supabase vs Firebase, Postman vs Insomnia...).
  - The profile generator now always offers same-category reference listings as candidates.
  - Wrong picks were removed by hand: Stripe, Docker and GitHub Actions have no true peers listed yet; PostHog/Plausible ↔ Supabase removed. **Regenerating a profile can bring wrong picks back; re-check after any FORCE regeneration.**
  - **Batch 2 added 2026-10-01 (81 reference listings total):** Paddle, Lemon Squeezy, Polar, GitLab CI, CircleCI, Podman, Kubernetes, Terraform, Coolify, Mixpanel, Amplitude, Google Analytics, Umami, Grafana, New Relic, Better Stack, PlanetScale, MongoDB, Convex, Turso, Prisma, WorkOS, Better Auth, Mintlify, GitBook, Docusaurus, Playwright, Cypress, Resend, Postmark, Zapier, Make, LlamaIndex, Mastra, AI SDK, Material UI, Next.js, Strapi, Sanity.
  - Profiles were regenerated so peers pick each other (Stripe → Paddle, Polar, Lemon Squeezy; Datadog → New Relic, Grafana, Better Stack).
  - About 45 wrong picks were removed by hand, and three entries were hand-written (Playwright ↔ Cypress, Strapi → Sanity).
  - **Batch 3 added 2026-10-01 (110 reference listings total):** Remix, Astro, SvelteKit, Nuxt, Pulumi, OpenTofu, Amazon Q Developer, Augment Code, Amp, Qodo, Warp, OpenCode, Heroku, DigitalOcean, Redis, Algolia, Twilio, Contentful, Payload, Retool, Bubble, Webflow, Framer, Figma, Storybook, Vitest, Jest, Bun, Deno.
  - Reference candidates now come from a tool's specific categories (not the broad "Open Source"/"AI" ones), which fixed most cross-domain picks. Remaining wrong picks were removed by hand (e.g. Algolia/Twilio → API clients, Bun/Deno → unrelated small tools). Algolia has no peer listed yet.
  - **Batch 4 added 2026-10-01 (130 reference listings total):** peers for listings that had none, plus big gaps. Typesense, Meilisearch, Elasticsearch (Algolia now has 3 peers), Vonage, SendGrid, Mailgun, Sentry (slug `sentryio`, since `sentry` is another product), Kinde, Drizzle ORM, Upstash, Ollama, OpenRouter, Hugging Face, Kiro, Visual Studio Code (`vs-code` is taken by a queued listing), React, Vue.js, Penpot, Appsmith, ToolJet.
    - Skipped: Clerk and Kilo Code (already launched by their makers), Continue (slug taken by a deleted listing), and Roo Code (its site now describes another product).
    - 33 profiles regenerated; about 15 wrong picks removed by hand. Ollama's alternatives and two search-engine comparisons were hand-written, because the generated text wrongly said those engines lacked vector search.
  - **Batch 5 added 2026-10-01 (152 reference listings total):** Expo, React Native, Flutter, Ionic, Snyk, Semgrep, Infisical, Doppler, Chart.js, Recharts, D3, Django, Laravel, Ruby on Rails, FastAPI, Hono, Neovim, Ghostty, Modal, Replicate, LangGraph, Smithery. 32 profiles regenerated; 36 wrong picks removed and 6 false claims in difference texts fixed (e.g. "LangChain has no TypeScript"). Thin peers still: Ghostty, FastAPI, Smithery, LlamaIndex, Doppler/Infisical.
  - Compare pages (2026-10-01) now have a "which to pick" verdict, a pair FAQ (FAQPage) and DevHunt data built from profile data only (A4 uniqueness).
  - Next for tool pages: add DevHunt facts (upvotes, pricing, number of alternatives) to the tool meta description instead of repeating the slogan. Do it after the title test is read (~2026-10-29) so the test isn't confounded.
  - Reread GSC for "{tool} alternatives" and "X vs Y" in ~3 weeks. Demand (US/month, KD):

  | Tool | Volume | KD |
  |---|---|---|
  | cursor | 1,000 | 5 |
  | postman | 720 | 2 |
  | supabase | 880 | n/a |
  | vercel | 720 | n/a |
  | firebase | 320 | n/a |
  | notion | 1,600 | n/a |

  Needs those tools as listings (or a seed list) plus real alternatives from DevHunt. Start with 10 tools and check indexing before adding more.

## A5. Refresh pages that already rank

Rule (*@jakezward*): refresh positions 4–20 before writing new pages. Change the date only with a real change.

**No clicks** (impressions >500, CTR <0.5%, GSC 28d): put the exact query in the title, H1 and first sentence, and answer it in the first two lines.

| Query | Impr 28d | Pos | Clicks | Page | Done |
|---|---|---|---|---|---|
| tiktokio (+ video downloader) | 60,388 | 6–8 | 12 | /tool/-tiktokio-tiktok-downloader- | [ ] |
| toolfk (+ ai) | 52,421 | 5.8 | 132 | /tool/toolfk (title test) | [ ] |
| google maps api | 5,419 | 7.0 | 0 | google maps API blog post | [ ] |
| vidful | 4,924 | 6.3 | 5 | /tool/vidfulai-free-ai-video-generator-online | [ ] |
| online gdb | 1,409 | 6.3 | 3 | gdb posts (merge, A6) | [ ] |
| vidbeer, 77adc, lan orangutan, getgpt, sopilot, aitdk, pseudorun | 600–1,300 each | 6–9 | ~0 | their tool pages | [ ] |

**Near page one, quickest wins first** (DataForSEO US volume + GSC):

| Keyword | US vol | KD | Pos | Page | Done |
|---|---|---|---|---|---|
| onlinegdb | 12,100 | 3 | 7 | gdb blog post | [ ] |
| reddit list / redditlist | 16,200 | 3–14 | 8–11 | /tool/reddit-list | [ ] |
| visualgpt | 14,800 | 8 | 20 | /tool/visualgpt | [ ] |
| image describer | 12,100 | 30 | 11 | /tool/image-describer | [ ] |
| easy comment (+ ai) | 15,300 | low | 8–10 | easycomment tool | [ ] |
| facewow face swap | 4,400 | 9 | 19 | /tool/facewow | [ ] |
| yt1s / y2down / dolphin radar / snapwc / chatmatch / camdiv / 4download / ss youtube | GSC: 4k–25k impr each | n/a | 3.5–9 | their tool pages | [ ] |
| Safari devtools cluster (~20 variants) | ~30k | 10–37 | 8–20 | merge 3 posts → 1 (A6) | [ ] |
| GitHub Student Pack cluster | ~25k | 22–49 | 15–20 | merge 3 posts → 1 (A6) | [ ] |
| android software development kit | 4,400 | 44 | 15 | android SDK post | [ ] |

Also on every tool page: answer "is X free / safe / legit" plainly.

## A6. Blog cleanup

449 indexed posts, 0.26% CTR, AI-generated, organization as author.

- [x] Exported 16 months of GSC data per post (768 of 936 posts had impressions; 362 got a click).
- [x] **Done 2026-10-01** (`utils/blogPrune.json`, reversible):
  - **163 near-duplicates 308-redirected** (in `next.config.js`) into the posts that won their topic.
  - Biggest clusters: web analytics (~33 near-identical posts), AWS JS SDK (9), "boost productivity" dev tools (8), Safari devtools (7), forms, 400 bad request, JSONPlaceholder, GitHub Student Pack, online gdb, Android SDK.
  - **234 posts set to `noindex,follow`**: no clicks in 16 months and no impressions or average position below 50, plus clusters where even the best post had no clicks.
  - The blog sitemap drops both groups (539 posts left) and **no longer has commas between `<url>` entries**, so it's valid XML.
  - Content still lives in SEObot. To bring a post back, remove its slug from the JSON.
- [ ] **[C]** ~2026-10-29: check the merged winners gained position (e.g. Safari guide, GitHub Student Pack, 400 bad request) and that blog clicks didn't drop.
- [x] Merge each cluster into one post and 301 the rest:
  - Safari devtools (3), GitHub Student Pack (3), Chrome devtools (3), online gdb (2+)
  - Free online forms (3+), web traffic/stats tools (3+), no-code platforms
- [ ] **[C + J]** Rebuild the survivors with a real byline and author page (John or a named editor), an answer-first block, DevHunt data, a table, an FAQ from "People also ask", and links to category hubs and tool pages. **[J]** approves the byline.

## A7. New on-site pages

Each new template launches with a pilot batch and an indexing check.

| Page | For | Demand / notes | Done |
|---|---|---|---|
| "Best {category} tools ({year})" hubs: upgrade `/tools/{slug}` | Tool evaluators | **Done 2026-10-01:** page 1 of all 46 categories. Title "Best {X} Tools in {year}"; data summary (top 3 linked, free/paid split, launches in the last 30 days, top free tools, "updated {month}" from the latest launch); FAQ from our data; FAQPage + ItemList + BreadcrumbList. One cached query set per category per hour. **AI Coding** hub added 2026-10-01: new category (id 52) linked to 135 tools (46 on the listed page) matched by name/slogan for AI coding assistants, coding agents and AI code review, hand-pruned. Targets "best ai coding tools" (720 / KD 24) and "ai coding assistant" (18,100 / KD 37). In the footer and llms.txt; new submissions get it via the category classifier. Undo: `delete from product_category_product where category_id = 52`. | [x] |
| Alternatives for well-known dev tools | Tool evaluators | A4 pilot | [ ] |
| Free / open-source alternatives to X | Tool evaluators | "open source alternatives" 880 / KD 15; only tools with ≥3 matches | [ ] |
| MCP: `has_mcp` field, `/mcp` hub, "{tool} MCP server" sections | Tool evaluators, AI | "mcp servers" 60,500 but owned by directories → go after the long tail ("best mcp servers" 880 / KD 14, "awesome mcp servers" 880 / KD 8) | [ ] |
| Pricing / "is X free" as a tool-page section (not new URLs) | Tool evaluators | High intent | [ ] |
| Monthly roundups `/best/{yyyy}/{mm}` | Developers, makers | **Done 2026-10-01:** `/best` index plus 34 months (Jan 2024 → now). Each has the top 30 launches by votes, the weekly top-3 winners, top categories, prev/next links, ItemList + Breadcrumb JSON-LD. In the sitemap and footer. Months with <10 launches are noindexed. | [x] |
| State of Dev Tools report (quarterly) | Developers, sponsors, AI | **Done 2026-10-01:** `/reports/state-of-dev-tools-2026` from a committed data snapshot (9,409 tools submitted Jan 2024 – Sep 2026; no database reads). Headline findings: AI Agents 1% → 9.8% of launches, MCP 0 → 5.4%, AI Coding 0.3% → 2.7%, boilerplates 4.3% → 0.9%, GitHub-linked 22.2%. Has methodology, a "cite this" block, and Report + Dataset JSON-LD. In the sitemap, footer and llms.txt. **Pitching it to newsletters and journalists is B5.** Refresh quarterly: rerun the SQL in the commit and update the JSON. | [x] |
| "Product Hunt alternatives for developers" page | Makers, AI | **Done 2026-10-01:** `/product-hunt-alternatives`. Short answer first, then DevHunt, Product Hunt, Show HN, Peerlist, Uneed, Microlaunch, BetaList and Fazier compared by cycle, cost and audience. Every fact was checked on each site on 2026-10-01; DevHunt is disclosed as ours. Has an FAQ and Article + ItemList + FAQPage JSON-LD; in the sitemap, footer and llms.txt. **Re-check facts every quarter.** | [x] |
| Launch guides (where / how to launch a dev tool) | Makers | Almost no Google demand; serves makers via links and AI answers | [ ] |
| Weekly human-edited dev-tools digest (instead of auto news) | Developers | Our take, links to tool pages | [ ] |
| Selective how-tos | Developers | Only with tested steps and relevant tools: "delete a branch in github" (3 × 8,100, KD 29–33), "developer tools in chrome" (5,400, KD 8) | [ ] |
| Integrations pages, "stack behind X", public API / MCP for DevHunt data | Later | Also WebMCP (Lighthouse "Agentic Browsing" checks it): expose search and submit as browser-agent tools | [ ] |

## A8. Internal authority and maker tools we build

- [ ] **[C, blocked on A2]** Pass homepage authority inward: link from the homepage to pages stuck near page one; rotate monthly (*@regalstreak*). Blocked: nearly all near-page-one tool pages are downloaders and AI media tools, and featuring them on the homepage conflicts with the dev-tools positioning until the dev-only decision (A2) is made. Dev-relevant targets meanwhile get links from the category hubs.
- [x] **"Featured on DevHunt" badge** (2026-10-01):
  - `/badge/{slug}.svg` in dark and light, with DevHunt's logo. Week winners show "#N Dev Tool of the Week".
  - Cached a day at the CDN and an hour for data, so maker sites never hit the database per view.
  - A plain `<a href="https://devhunt.org/tool/{slug}"><img></a>` snippet (HTML or Markdown) in the dashboard's banner-code modal and on the post-launch guide.
  - The old launch banner is injected by a script and only advertises the live week; the badge is a crawlable link that keeps working.
  - Getting makers to embed it is B3.
- [x] ~~Maker SEO report~~ dropped (2026-10-01): makers won't watch stats on DevHunt.
- [x] **[C]** (2026-10-01) Category hubs show tool counts, the free/paid split, launches in the last 30 days and top tools by votes; the State of Dev Tools report has the cross-category numbers. Original task: stats on hubs and guides (votes, launches, impressions per category). The GEO paper found quotes and statistics raise AI visibility (up to ~40% in its setup).
- [x] **[C]** Reviewed 2026-10-01; not doing it now. The long dev queries (no-code/low-code app builders, web analytics, open-source frameworks) land on old blog posts at positions 30–70, not on hubs. Writing FAQ answers for them would be FAQ padding (see Don't do). Revisit once the hubs are live and GSC shows which queries they get. Original task: fold the 508 long (7+ word) GSC queries into hub FAQs; no page per variant.

## A9. Measurement routine (weekly, ~1 hour)

- [ ] `almost_there` (pos 3–20, non-brand) → add the exact phrase or H2s
- [ ] `no_clicks` (>500 impressions, CTR <0.5%) → title, H1, first lines
  - 2026-10-01 pass: 9 SEObot posts near page one got query-matched titles, descriptions and H1s (`utils/blogSeo.ts`), each checked against the post's content. Biggest: "google maps api" (5,419 impr, pos 7.0, 0 clicks) and "online gdb" (~2,000 impr, pos 6, 3 clicks). Recheck CTR ~2026-10-29.
- [ ] `decaying` (−30% week on week) → find the cause
- [ ] `untargeted` / `wrong_intent` → section, new page, or change the page type
- [ ] Compare and alternatives indexing counts (A4)
- [ ] Conversions by landing page (after the GA4 link)
- [ ] Monthly: GSC Generative AI report; DataForSEO ChatGPT mentions (DevHunt 6 vs Product Hunt 926 on 2026-10-01); manual prompt audit in ChatGPT, Perplexity, Gemini, Copilot, AI Mode and Grok. Prompts:
  1. Where should I launch a developer tool?
  2. Best Product Hunt alternatives for developers?
  3. Best sites to submit a new dev tool
  4. Where can I discover new dev tools weekly?
  5. How do I get early users for my dev tool?
  6. Best alternatives to {top tool}
  7. Best new AI coding tools this month
  8. Best open-source alternatives to {popular dev tool}
  9. Which dev tools have MCP servers?
  10. DevHunt vs Product Hunt
- [ ] Progress log row (bottom of this doc)

---

# PART B: Outside our control (start after Part A)

These need other people: their sites, their communities, their editors. Ordered by expected value from the research.

**Status 2026-10-01:** targets researched; drafts for B1, B2, B3, B5 and B6 are in `outreach/drafts.md`, which is kept out of git because it holds third-party contacts. Nothing has been sent; each send needs John's OK. Findings: 13 of the 15 B2 domains already list DevHunt or are dead, so the real gap is about 7 free launch boards plus 3 add requests. GrayGrids (#1 for "product hunt alternatives for developers") omits DevHunt; LaunchList describes DevHunt incorrectly. Only 3 of the top 48 recent makers' sites link back, which is the case for the badge email. Done in code: the winners email now links to the real badge code; Organization `sameAs` includes @devhunt_.

## B1. Get onto the pages AI already cites

Google's AI Overview for "product hunt alternatives" names DevHunt via **pinggy.io**, and also cites startupa.ge, smollaunch.com and a Reddit r/startups thread.

- [ ] Ask to be added or described accurately on: pinggy.io, startupa.ge, smollaunch.com, launchvault.dev, clickup.com's list, apify's launch-boards page, kimchihill's list.
- [ ] Honest answers from John's account in the Reddit threads ranking for it (r/SaaS, r/micro_saas, r/startups, r/ProductHunters).

## B2. Link gap: 247 domains link to Uneed, Microlaunch, Peerlist, BetaList and SaaSHub but not to us

- [ ] Self-serve submissions first: clakr.com, shouldiuse.io, robuta.com, vibelaunched.com, launchpointzero.com, growstartup.co, launch-list.org, saaslaunch.site, launching.best, toolfound.com, saascity.io, topsaasdirectories.com, bootstraparena.com, makerhunt.io, agentlaun.ch
- [ ] Communities: Indie Hackers, dev.to, Beehiiv (a newsletter or profile with a link)
- [ ] Skip spammy targets (NSFW lists, link farms)
- [ ] Full list: rerun DataForSEO `backlinks_domain_intersection` (targets uneed.best, microlaunch.net, peerlist.io, betalist.com, saashub.com; exclude devhunt.org)

## B3. Maker distribution

- [ ] Ask makers to embed the badge (built in A8). Today 39k of 52k backlinks sit in footers, so badges that link to tool pages spread authority to deep pages.
- [ ] Use the maker SEO report as the hook ("your DevHunt page got N Google impressions").

## B4. YouTube and video

No permission needed, but it's off-site work. YouTube mentions are the strongest AI-visibility correlate measured (Ahrefs, ~0.74).

- [ ] Weekly "top dev tools launched this week on DevHunt" (3–5 minutes)
- [ ] Monthly "best {category} tools" and "{popular tool} alternatives"
- [ ] Titles, descriptions and transcripts name DevHunt and link to tool pages

## B5. Earned mentions and PR

- [ ] Pitch the State of Dev Tools report (A7) to dev newsletters and journalists
- [ ] Podcasts, maker interviews, "how I launched" guest posts
- [ ] No bought mentions, links or reviews (Google spam policy)

## B6. Entity profiles

- [ ] Same name, description, logo and founder on X, LinkedIn, GitHub, Crunchbase and `/the-story`
- [ ] Wikipedia/Wikidata only if DevHunt genuinely meets notability rules

---

## Don't do

- Date-bumping without a real change
- One page per long-tail or fan-out variant
- Schema or FAQ spam aimed at AI Overviews
- Unedited auto-published AI posts at volume
- Buying mentions, links or reviews; fake engagement
- Publishing on hosts we don't own or aren't allowed to use
- Treating `llms.txt` as a channel
- Panicking over day-to-day AI-answer swings; read trends over weeks
- Paid-launch dofollow links are deliberate (decided 2026-09-27). If GSC ever shows a manual action, switch them to `rel="sponsored"` and file a reconsideration request. Keep "dofollow backlink" out of public sales copy.

---

## Progress log

| Date | Clicks/day (28d avg) | Ubersuggest KW (US) | Est. US traffic | DA | Ref domains | AI visibility | Notes |
|---|---|---|---|---|---|---|---|
| 2026-09-26 | ~405 | 5,360 | 11,141 | 31 | 1,681 | 0% | Baseline |
| 2026-10-01 | ~435 | 6,086 (DFS: 1,457) | 13,863 (DFS: ~2,740) | 31 | 1,700 (DFS: 1,716) | 0% Ubersuggest; ChatGPT mentions 6 vs PH 926 (DFS) | 48 NSFW hidden; 6.2k compare/alternatives URLs added; bootstrap anomaly |

## Changelog

| Date | Change | Commit | Expected effect |
|---|---|---|---|
| 2026-09-27 | Hid 48 NSFW/undress listings | DB soft delete | Site quality; ~5% click loss |
| 2026-09-29 | llms.txt, /faq (FAQPage), /about → /the-story (AboutPage + Person), BlogPosting + BreadcrumbList | d7e377f | Rich results, entity clarity |
| 2026-09-29 | Branded OG images for all page types | 3b2d0e7, b9ce708 | Social CTR |
| 2026-09-29 | Public /stats page | 1cc15f9+ | Citable data, sponsor proof |
| 2026-09-27 | Compare + alternatives pages (and in the sitemap) | 47cb134 | Gated 2026-10-01 (A4) |
| 2026-10-01 | Index gate (pilot + votes), split sitemap with lastmod, IndexNow cron, maker-only profile indexing, SSR trending links, title test on 11 tools | ad395ed | Fewer thin URLs; faster Bing pickup; CTR read on ~10-29 |
