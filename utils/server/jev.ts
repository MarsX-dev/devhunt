// TypeSafe JEV (https://docs.typesafe.ai/api): fast, cheap typed decisions (choice / score / yes-no
// "noul") about a piece of text. Server-only; JEV_KEY (or JEV_API_KEY) enables it.
const JEV_KEY = () => process.env.JEV_KEY || process.env.JEV_API_KEY;
const JEV_URL = () => process.env.JEV_API_URL || 'https://api.typesafe.ai/v1/systemone';

export const jevEnabled = () => !!JEV_KEY();

// Asks JEV the given questions about `state`; returns the answers map, or null if unavailable.
export async function jevAsk(state: string, questions: Record<string, unknown>, timeoutMs = 15000): Promise<Record<string, any> | null> {
  if (!jevEnabled()) return null;
  try {
    const res = await fetch(JEV_URL(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${JEV_KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jev-latest', state, questions }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`status ${res.status}: ${JSON.stringify(body)?.slice(0, 200)}`);
    return body?.answers ?? null;
  } catch (err) {
    console.error('jev failed:', (err as Error).message);
    return null;
  }
}

// Loose on purpose: anything a developer or a builder (e.g. a solo founder) would use at work is in,
// startup SaaS (billing, SEO, marketing, sales) included. Only consumer products score low.
const DEV_TOOL_QUESTION = {
  type: 'noul',
  instructions:
    'Could a software developer or a builder (for example a solo founder or indie hacker building a startup or SaaS) use this product in their work: to build, ship, launch, market, sell or run their software product or business?',
  criteria: {
    true: 'Useful to developers or builders at work: developer tools, APIs, SDKs, infrastructure, AI and no-code builders, design/UI resources, and SaaS tools a startup founder would use for marketing, SEO, sales, analytics, payments, billing, support, content or operations',
    false:
      'Not for building or running a software business: consumer apps and games, personal finance or everyday calculators, dating, fortune telling, school homework help, local businesses and service companies, news or content sites, shops and marketplaces for consumers',
  },
};

const TOPIC_QUESTION = {
  type: 'choice',
  // "Is", not "about": an anti-scam tool talks about scammers all the time (NumBan was blocked as fraud 0.85).
  instructions:
    'Which of these best describes what the product itself does? Judge what the product is, not the topics it deals with: a tool that detects, blocks or reports scams, fraud, spam or abuse is a normal product.',
  criteria: {
    none: 'A normal legitimate product, including security, anti-fraud, anti-scam, anti-spam and trust & safety tools, developer tooling for blockchains, payments or security, and legitimate crypto businesses: wallets, exchanges, web3 SDKs and platforms (e.g. thirdweb, Coinbase, Alchemy), block explorers, market data, price trackers, portfolio and tax tools',
    crypto: 'A crypto scam or likely scam: promoting or selling a specific token, coin, memecoin, presale, ICO or NFT drop, airdrop or giveaway farming, pump signals, guaranteed or high-yield returns, crypto investment or trading bots promising profits, mining or staking schemes, wallet drainers or seed-phrase collectors',
    gambling: 'Gambling, betting, casinos, lotteries or sweepstakes',
    adult: 'Adult or sexual content, dating for sex, NSFW generators',
    fraud: 'The product itself deceives or harms people: scams, selling fake reviews or followers, spam services, phishing, account or document selling, get-rich-quick schemes',
  },
};

// Genuine listing, or a test/placeholder, or a fake (calibrated 2026-09-29 on real and junk listings).
const LISTING_QUESTION = {
  type: 'choice',
  instructions: 'Someone submitted this product to DevHunt, a directory where makers list their own tools. Is it a genuine, complete listing?',
  criteria: {
    real: 'A genuine listing of a real product by its maker: a real name, a real website, and a description that says what the product does (short or plain is fine)',
    placeholder:
      'A test or unfinished submission: placeholder or template text (e.g. "Tool name", "Quick Description", "Catchy slogan"), lorem ipsum, keyboard mashing or gibberish, or no real description of what the product is',
    fake: 'Not a genuine listing: impersonates a well-known company or product the submitter clearly does not own (e.g. listing Shopify, Google or DevHunt itself), a fake or non-existent product, or a website unrelated to the described product',
  },
};

const toolState = (tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) =>
  [`Name: ${tool.name}`, `Tagline: ${tool.slogan ?? ''}`, `Website: ${tool.website ?? ''}`, `Description: ${(tool.description ?? '').slice(0, 1500)}`].join('\n');

// One JEV call per submission: is it a dev tool (0..1) and is it about a banned topic.
export async function moderateSubmission(tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) {
  const answers = await jevAsk(toolState(tool), { dev_tool: DEV_TOOL_QUESTION, topic: TOPIC_QUESTION, listing: LISTING_QUESTION }, 6000);
  const listing = typeof answers?.listing?.choice === 'string' ? (answers.listing.choice as string) : null;
  const listingProbability = listing ? Number(answers?.listing?.probabilities?.[listing] ?? answers?.listing?.confidence) : NaN;
  const devToolScore = Number(answers?.dev_tool?.noul);
  const topic = typeof answers?.topic?.choice === 'string' ? (answers.topic.choice as string) : null;
  const topicProbability = topic ? Number(answers?.topic?.probabilities?.[topic] ?? answers?.topic?.confidence) : NaN;
  return {
    devToolScore: Number.isFinite(devToolScore) ? devToolScore : null,
    topic,
    topicProbability: Number.isFinite(topicProbability) ? topicProbability : null,
    listing,
    listingProbability: Number.isFinite(listingProbability) ? listingProbability : null,
  };
}

// 0..1: how likely a submission is a software/developer tool (moderation signal; null if JEV is off).
export async function scoreDevTool(tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) {
  const answers = await jevAsk(toolState(tool), { dev_tool: DEV_TOOL_QUESTION }, 6000);
  const score = Number(answers?.dev_tool?.noul);
  return Number.isFinite(score) ? score : null;
}

// Comment spam (calibrated on the 2026-09-28 cleanup: known spam vs live comments).
const COMMENT_QUESTION = {
  type: 'choice',
  instructions:
    'A comment posted under a developer tool launched on DevHunt (a Product Hunt for dev tools). Classify the comment. Most comments are genuine; only pick spam or scam when the comment clearly is one.',
  criteria: {
    genuine:
      'A real reaction to this tool: praise, congratulations, questions, feedback, criticism, bug reports, warnings, a maker replying, or someone mentioning their own related project in context. Short or low-effort comments are still genuine.',
    spam: 'Unsolicited promotion or solicitation not about this tool: ads for other products or sites, link drops with no real comment, selling services (SEO, backlinks, domains, copywriting, development), "contact me on WhatsApp/Telegram/email for feedback" pitches, templated copy-paste text, asking people to upvote something else.',
    scam: 'Scams or illegal offers: fake documents or money, stolen accounts, crypto or investment schemes, phishing.',
  },
};

// Spam + scam probability of a comment (null if JEV is off or slow: comments are never held up by it).
export async function moderateComment(input: { toolName: string; toolSlogan?: string | null; content: string }) {
  const state = [`Tool: ${input.toolName} - ${input.toolSlogan ?? ''}`, "Commenter is the tool's maker: no", `Comment: ${input.content.slice(0, 1500)}`].join('\n');
  const answers = await jevAsk(state, { comment: COMMENT_QUESTION }, 5000);
  const p = answers?.comment?.probabilities;
  const spamProbability = p ? Number(p.spam ?? 0) + Number(p.scam ?? 0) : NaN;
  return {
    choice: typeof answers?.comment?.choice === 'string' ? (answers.comment.choice as string) : null,
    spamProbability: Number.isFinite(spamProbability) ? spamProbability : null,
  };
}
