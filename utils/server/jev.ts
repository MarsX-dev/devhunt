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

// 0..1: how likely a submission is a software/developer tool (moderation signal; null if JEV is off).
export async function scoreDevTool(tool: { name: string; slogan?: string | null; description?: string | null; website?: string | null }) {
  const state = [`Name: ${tool.name}`, `Tagline: ${tool.slogan ?? ''}`, `Website: ${tool.website ?? ''}`, `Description: ${(tool.description ?? '').slice(0, 1500)}`].join('\n');
  const answers = await jevAsk(
    state,
    {
      dev_tool: {
        type: 'noul',
        instructions: 'Is this a product for software developers or technical builders (developer tools, APIs, SDKs, infrastructure, AI/devops/data tooling, no-code builders)?',
        criteria: {
          true: 'A tool, library, service or platform that developers or technical builders use to build, ship or run software',
          false: 'A consumer app, local business, service company, content site, marketplace or anything not aimed at building software',
        },
      },
    },
    6000,
  );
  const score = Number(answers?.dev_tool?.noul);
  return Number.isFinite(score) ? score : null;
}
