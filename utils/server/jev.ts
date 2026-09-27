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

const DEV_TOOL_QUESTION = {
  type: 'noul',
  instructions: 'Is this a product for software developers or technical builders (developer tools, APIs, SDKs, infrastructure, AI/devops/data tooling, no-code builders)?',
  criteria: {
    true: 'A tool, library, service or platform that developers or technical builders use to build, ship or run software',
    false: 'A consumer app, local business, service company, content site, marketplace or anything not aimed at building software',
  },
};

const TOPIC_QUESTION = {
  type: 'choice',
  instructions: 'Which of these best describes what the product is mainly about?',
  criteria: {
    none: 'A normal legitimate product (including developer tooling for blockchains, payments or security)',
    crypto: 'Cryptocurrency trading, tokens, coins, NFT or airdrop promotion, crypto investing or yield schemes',
    gambling: 'Gambling, betting, casinos, lotteries or sweepstakes',
    adult: 'Adult or sexual content, dating for sex, NSFW generators',
    fraud: 'Scams, fake reviews or followers, spam, phishing, account selling, get-rich-quick or deceptive products',
  },
};

const toolState = (tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) =>
  [`Name: ${tool.name}`, `Tagline: ${tool.slogan ?? ''}`, `Website: ${tool.website ?? ''}`, `Description: ${(tool.description ?? '').slice(0, 1500)}`].join('\n');

// One JEV call per submission: is it a dev tool (0..1) and is it about a banned topic.
export async function moderateSubmission(tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) {
  const answers = await jevAsk(toolState(tool), { dev_tool: DEV_TOOL_QUESTION, topic: TOPIC_QUESTION }, 6000);
  const devToolScore = Number(answers?.dev_tool?.noul);
  const topic = typeof answers?.topic?.choice === 'string' ? (answers.topic.choice as string) : null;
  const topicProbability = topic ? Number(answers?.topic?.probabilities?.[topic] ?? answers?.topic?.confidence) : NaN;
  return {
    devToolScore: Number.isFinite(devToolScore) ? devToolScore : null,
    topic,
    topicProbability: Number.isFinite(topicProbability) ? topicProbability : null,
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
