# DevHunt Product-Led Growth Ideas

Brainstorm backlog for growing devhunt.org. Tick boxes as work ships; add the date and commit next to each.

- **Owner:** John Rush
- **Created:** 2026-09-27
- **Goals:** (1) more makers pay to launch, (2) more visitors come to explore tools, (3) more advertisers pay to advertise.
- **Related:** [seo-plan.md](seo-plan.md)

---

## 0. Guiding principles

- **The flywheel:** developers come back when DevHunt tells them something they can't easily find elsewhere → makers pay when a launch brings measurable results → advertisers pay for developer intent.
- **Use data we already collect** (fact sheets, GitHub releases, dead-site checks, first-party analytics, GSC) so features don't depend on writing content by hand.
- **Tie everything to tools and launches.** The aggregator and streaks are daily.dev's core, and forums compete with Reddit/HN. DevHunt's edge is the tool/launch graph: launches, tool pages, votes, makers.
- **Audience quality matters.** ~40% of clicks come from YouTube downloaders and similar non-dev tools (see seo-plan.md). Advertisers pay for developers, so features that attract real developers (MCP category, stack pages, free-tier tracker) also raise what an ad is worth.
- **Never sell leaderboard rank.** Makers pay because winning is earned. Ads and bidding must stay visually separate from the launch ranking and always be labeled "Sponsored".

---

## 1. Already planned (sharpened)

- [ ] **Tech news, built from our own data** rather than generic news that loses to HN and TLDR:
  - [ ] Pricing changes this week (from fact sheets)
  - [ ] Free tiers cut
  - [ ] Tools that shut down (from dead-site checks)
  - [ ] Major releases (from GitHub releases)
- [ ] **Guides** as "how to do X with Y" around listed tools. Each guide is an ad slot the tool's owner might sponsor.
- [ ] **Perks**
  - [ ] Behind signup, to grow the email list
  - [ ] Vendors pay to be listed (JoinSecret model)

---

## 2. More visitors (reasons for developers to come back)

- [ ] **Follow tools + weekly digest** of releases, price changes and outages for your stack. Retention loop plus an email list.
- [ ] **Free-tier tracker.** "X free tier limits" is a big search query and fact sheets already hold pricing. Add alerts when a free tier changes.
- [ ] **Dev tool graveyard.** "Tools that shut down in 2026, and where to migrate", built from dead-site checks. Gets shared, earns backlinks.
- [ ] **MCP servers, agent skills and Cursor rules as launchable items.** Hottest dev category in 2026, no clear home yet.
- [ ] **Stack pages.** Developers and companies post their stack; every stack links to tool pages. StackShare is effectively dead, so the space is open.
- [ ] **"Ask DevHunt"**: AI answer engine over the catalog ("best self-hosted auth under $50/mo").
- [ ] **DevHunt MCP server / API** so AI agents can query dev tools directly. Tackles the 0% AI visibility in seo-plan.md.
- [ ] **Predict the winner.** Visitors pick the weekly winner before voting closes; leaderboard and badges. A reason to come back on launch day.

### 2.1 News aggregator

- [ ] Merge HN, Reddit (r/programming, r/webdev, r/selfhosted), GitHub trending, Lobsters, dev.to and PH dev tools into one feed.
- [ ] **DevHunt layer:** when a story mentions a tool, link it to the DevHunt tool page. Our pages get traffic, makers see where they're mentioned, and daily.dev doesn't have this.
- Low effort, a daily reason to open DevHunt, and it feeds the streak system.

### 2.2 Streaks, badges and leaderboards

- [ ] **Daily/weekly streaks** (like Product Hunt), with badges, prizes and attention.
  - **Don't reward votes.** That brings vote farming and devalues winning a launch, which is what makers pay for.
  - Reward actions that add value: visiting, commenting, trying a tool, correctly predicting the week's winner.
  - **Sponsor-funded prizes**, e.g. "30-day streak → $50 in API credits from X". Advertisers pay for the engagement mechanic.
- [ ] **Voter leaderboard, ranked by taste, not raw votes.** How often a person's early votes picked the eventual top 3 ("Top hunters"). Stops spam voting, makes the badge meaningful, and makers want those people to see their launch.

### 2.3 Job board (both sides: companies hiring and people looking)

- [ ] **Don't start empty:**
  - [ ] Pull jobs automatically from the careers pages of every listed tool (most dev-tool companies use Greenhouse, Lever or Ashby, which have public APIs)
  - [ ] Add HN "Who's Hiring" posts
- [ ] Charge for featured posts and a "hiring" badge on tool pages.
- [ ] Job seeker profile = DevHunt activity + tools they've launched. A real signal LinkedIn doesn't have.

### 2.4 Posts / forum (scoped down)

A general dev forum competes with Reddit, HN and daily.dev squads, and starts empty. Narrow it to formats that fit DevHunt:

- [ ] **Ask:** "What tool do you use for X?" Answers link to tool pages (SEO win).
- [ ] **Show:** build-in-public updates from makers, shown on their tool page.
- [ ] **Feedback:** "Roast my landing page" / "roast my pricing". Makers love it; paid-launch upsell.
- [ ] Seed with launch-day comment threads so it never looks empty. Posts can get likes and comments.

### 2.5 Events and conferences

- [ ] Aggregate from conference lists and Luma; let organizers submit.
- [ ] Organizers pay for a featured slot.
- [ ] Later: "DevHunt launch week at [conf]" tie-ins.

### 2.6 Courses

- [ ] Curate "learn X" pages per tool with affiliate links (Udemy, egghead, Frontend Masters, Scrimba).
- [ ] Tool makers can sponsor official tutorials.
- Don't produce courses ourselves; it's a different business.

### 2.7 Other visitor ideas

- [ ] **New-tab browser extension** showing the aggregated feed plus today's launches. Where streaks happen naturally (daily.dev grew this way).
- [ ] **Launch-day live:** weekly X Space or stream with the top 5 makers. Cheap content that makers share themselves.
- [ ] **Deal weeks** (Black Friday, "Dev Deals Week"), with sponsors paying to be included.

---

## 3. More paid launches (show makers results, not just a listing)

- [ ] **Public launch reports.** Average visitors, clicks and signups for paid launches, from our analytics. The strongest possible sales page.
- [ ] **Leads, not only traffic.** Opt-in "notify me / request early access" button on upcoming tools, so makers leave with emails.
- [ ] **Launch kit.** Auto-generate the badge, OG image, X thread, HN/Reddit copy and a posting schedule. Optional "launch everywhere" syndication add-on.
- [ ] **Maker subscription** instead of a one-off fee:
  - [ ] Monthly report of Google keywords their DevHunt page ranks for (we have GSC data)
  - [ ] Whether ChatGPT and Claude recommend them
  - [ ] Alerts when a competitor launches or appears in an X-vs-Y page
  - [ ] Free relaunch on each major version (triggered by GitHub releases)
- [ ] **Beta-tester marketplace.** Makers pay to get 10 real developers to try the tool and leave structured feedback.
- [ ] **Winner prizes funded by sponsors.** Bigger prizes attract better launches.
- [ ] **Hunters.** Credit people who submit someone else's tool (like Product Hunt). More supply; makers often upgrade to paid once listed.
- [ ] **Bounties.** Makers pay developers to find bugs, write an integration or record a review. DevHunt takes a cut.
- [ ] **Referral credits.** Makers get launch discounts for bringing other makers.
- [ ] **"Ad-free tool page"** add-on (or included in paid launches). See section 4.2.

### 3.1 Startup marketplace (sell startups)

- **Our angle:** DevHunt knows which tools are stalling (dead-site checks, missing GitHub releases, falling traffic). Acquire.com and Microns don't have that.
- [ ] "For sale" badge on tool pages the owner opts into.
- [ ] Email owners of stalled tools: "want to sell?"
- [ ] Buyers browse by category with real DevHunt traffic data attached.
- [ ] Take a success fee.
- **Risk:** trust and fraud checks. Start as a curated "acquisition requests" form, not an open marketplace.

---

## 4. More advertisers (sell intent, not impressions)

### 4.0 Current state (2026-09-27)

- **No on-site ads are showing.** `MonitizorAdCards` returns `null` on the home, tool, category and profile pages because selldigitals is down (`components/ui/MonitizerAdCards/index.tsx:22`).
- `app/the-story/pricing.jsx:29` still sells a "Home page ad" for $497, which currently renders nowhere.
- Sponsor packages are activated by hand. The only live sponsor slot is the launch reminder email (`/email-sponsor-ad`, currently the ListingBott ad).
- **First step:** our own ad slot component with self-serve Stripe checkout, filling the four empty placements.

### 4.1 Advertiser offers

- [ ] **Self-serve sponsored slots on alternatives, compare and category pages.** Monetizes the ~28k tool-page clicks we already get. Probably the fastest revenue on this list.
- [ ] **Media kit** from first-party analytics: countries, visits, top categories.
- [ ] **"Build with X" weekly challenges.** An API company funds prizes; developers build with its API. Easy sell to devrel budgets.
- [ ] **"State of Dev Tools 2026" report** from launch, vote and pricing data. Sponsors pay to be in it; press coverage brings backlinks.
- [ ] **Jobs board** featured posts (section 2.3).
- [ ] **Perks** listings (section 1).
- [ ] **Sponsored streak prizes and badges** (section 2.2).
- [ ] **Sponsored guides and tutorials** (sections 1 and 2.6).

### 4.2 Ad placements, ranked by buyer intent

**Highest intent (developers comparing tools):**
- [ ] **Alternatives and X-vs-Y pages:** a "Sponsored alternative" card.
- [ ] **Pages for dead or hidden tools.** They return 404 now. Instead show "This tool is gone, try these", with one sponsored pick. Turns wasted traffic into the best-converting slot.
- [ ] **Category pages:** a top slot per category ("Top of Auth, October").
- [ ] **Search and command palette:** one sponsored result matching the query.
- [ ] **Competitor tool pages:** an ad on a competitor's page. Pair with the "ad-free page" upsell for paid makers, so we get paid twice.

**Reach (all visitors):**
- [ ] **Home feed:** native "Promoted" card at position 4, clearly labeled.
- [ ] **Live activity strip:** sponsor logo in the ticker.
- [ ] **Winners page and weekly X thread:** "Presented by X".
- [ ] **Day takeover:** one sponsor gets the home hero, ticker and emails for a day, at a premium.
- [ ] **Blog posts, news aggregator and job board:** native slots.

**Reaching makers** (hosting, payments and analytics companies want founders):
- [ ] **Submit flow, maker dashboard and analytics page.**
- [ ] **Transactional emails:** launch reminders, winner congrats, upvote notifications. Open rates far above a newsletter. The sponsor block already exists for the reminder email; add it to the others.
- [ ] **Streak prizes and badges:** "30-day streak powered by X".

### 4.3 Bidding for top slots (outbid.lol idea)

Only for a few prime slots. Two options:

- **A. King of the hill:** pay current price + 10% to take the slot right away. Fun, visible, shareable. B2B advertisers dislike it because they can't plan when their slot flips.
- **B. Monthly open auction (recommended):**
  - [ ] Each prime slot (home #1, top category slots) takes bids for next month
  - [ ] Public live bid board (marketing + FOMO)
  - [ ] Bidding closes on the 25th; anti-sniping extends the close by 10 minutes after a late bid
  - [ ] Starting price = today's fixed price, so we never earn less than now
  - [ ] Losers can take slot #2 or #3 at a fixed "buy now" price
- **Implementation:** don't charge each bid and refund outbid bidders. Stripe keeps its processing fee on refunds (~3% lost per flip). Save the card with a SetupIntent when someone bids; charge only the winners at close.
- **Red line:** bidding never touches launch leaderboard ranking.

### 4.4 Pricing by slot type

| Inventory | Model |
|---|---|
| 3–5 prime slots | Monthly auction |
| Email slots, takeovers | Fixed price, calendar booking |
| Long tail (hundreds of category and alternatives pages) | Self-serve CPC: advertiser sets a budget, picks categories or competitors, pays per click |
| Paid makers | "Ad-free page" add-on, or included in paid launches |

### 4.5 What makes advertisers come back

- [ ] **Self-serve dashboard:** impressions, clicks and CTR per slot from first-party analytics; automatic UTMs; bot clicks filtered out.
- [ ] **Audience breakdown:** countries, top categories, developer vs. non-developer traffic. Be honest about the downloader traffic; quoting "developer-only impressions" makes prices believable.
- [ ] **SEO hygiene:** `rel="sponsored"` on every paid link (Google requires it for paid links).
- [ ] **Caps:** at most 1–2 ads per page.

---

## 5. Priorities

### Top picks overall (impact for the effort)

1. Sponsored slots on alternatives and category pages (direct revenue from existing traffic)
2. Auto-generated news from our data, delivered as the follow-your-stack digest
3. Maker subscription with SEO and AI-visibility reports (recurring revenue on data only we have)
4. DevHunt MCP server + MCP/agents launch category (AI reach; "agents recommend tools listed here")

### Suggested order: community features

1. Aggregator + streaks + predict-the-winner (the daily habit loop)
2. Auto-aggregated jobs, then paid featured slots
3. Ask/Show posts on tool pages, seeded from comments
4. "For sale" opt-in and acquisition requests
5. Events and course affiliates when there's spare capacity (low effort, low impact)

### Suggested order: advertising

1. Own ad slot component filling the four empty selldigitals spots; fixed prices + Stripe checkout
2. Sponsored slots on alternatives and dead-tool pages
3. Sponsor block in all transactional emails
4. Monthly auction for home #1 and top categories
5. Self-serve CPC for the long tail

---

## 6. Progress log

| Date | What shipped | Commit |
|---|---|---|
| | | |
