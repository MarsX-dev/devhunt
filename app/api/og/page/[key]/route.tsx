import { C, Frame, MONO, ogImage } from '@/utils/og';
import report from '@/utils/reports/stateOfDevTools2026.json';

export const revalidate = 86400;

const total = report.submissionsByYear.reduce((n, y) => n + y.submitted, 0);
const share = (category: string, year: '2024' | '2026') => report.categoryShare.find(c => c.category === category)?.[year] ?? 0;

// Share cards for standalone pages. Fixed keys only, so the route can't render arbitrary text under DevHunt's name.
const CARDS: Record<string, { kicker: string; title: string; lines: string[] }> = {
  'state-of-dev-tools-2026': {
    kicker: 'REPORT · DATA',
    title: 'State of Dev Tools 2026',
    lines: [
      `${total.toLocaleString('en-US')} dev tool launches, Jan 2024 – Sep 2026`,
      `AI agents: ${share('AI Agents', '2024')}% → ${share('AI Agents', '2026')}% of launches`,
      `MCP: ${share('MCP', '2024')}% → ${share('MCP', '2026')}%`,
    ],
  },
  'free-alternatives': {
    kicker: 'FREE · OPEN SOURCE',
    title: 'Free alternatives to popular dev tools',
    lines: ['Postman → Bruno, Hoppscotch', 'Auth0 → Keycloak, SuperTokens', 'Zapier → n8n, Activepieces · Heroku → Coolify'],
  },
  'product-hunt-alternatives': {
    kicker: 'GUIDE',
    title: 'Product Hunt alternatives for developer tools',
    lines: ['8 launch platforms compared', 'Launch cycle · cost · audience'],
  },
};

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const card = CARDS[params.key];
  if (!card) return new Response('Not found', { status: 404 });
  return ogImage(
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: 22, color: C.orange, fontFamily: MONO, letterSpacing: 3 }}>{card.kicker}</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: card.title.length > 30 ? 62 : 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          {card.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28, gap: 10 }}>
          {card.lines.map(l => (
            <span key={l} style={{ display: 'flex', fontSize: 28, color: C.muted, fontFamily: MONO }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </Frame>,
    86400,
  );
}
