import { describe, expect, it } from 'vitest';
import { testEnv } from '../env';

// Opt-in: runs the real web search + JEV + Groq pipeline (costs a few API credits).
// QA_REAL_AI=1 pnpm vitest run tests/api/enrichment.real.test.ts
const run = process.env.QA_REAL_AI ? describe : describe.skip;

run('rich launch page pipeline (real APIs)', () => {
  for (const key of ['FIRECRAWL_KEY', 'JEV_KEY', 'GROQ_API_KEY']) process.env[key] ??= testEnv(key) ?? '';

  it.each([
    ['Daytona', 'https://www.daytona.io'],
    ['Knecht Works', 'https://knecht.works'],
  ])('%s', async (name, url) => {
    const { enrichTool } = await import('@/utils/server/enrich');
    const { items, stats } = await enrichTool({ name, demo_url: url });
    console.log(name, stats);
    for (const item of items) console.log(`  [${item.kind}] ${item.title.slice(0, 90)} | ${item.source} | ${item.body ?? ''}`);
    expect(Array.isArray(items)).toBe(true);
  }, 120_000);
});
