import { headers } from 'next/headers';
import LaunchPlan from './LaunchPlan';
import { countryCode } from '@/utils/analytics';
import { hasRegionalPrice } from '@/utils/launchTiers';
import { getPublicStats, statsSummary } from '@/utils/publicStats';
import { getLaunchShowcase } from '@/utils/launchShowcase';

// Server wrapper so the pitch can quote the live /stats numbers and real launch results (cached, no
// per-visitor query). The visitor's country (Vercel geo header) picks the regional price; the checkout
// route decides the charged amount the same way.
export default async function ActivateLaunchPage({ params }: { params: { slug: string } }) {
  const [stats, showcase] = await Promise.all([getPublicStats().catch(() => null), getLaunchShowcase().catch(() => null)]);
  const country = countryCode(headers().get('x-vercel-ip-country'));
  return (
    <LaunchPlan params={params} stats={stats ? statsSummary(stats) : null} showcase={showcase} regionalCountry={hasRegionalPrice(country) ? country : null} />
  );
}
