import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/utils/server/admin';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { loadToolPageData } from '@/utils/toolPageData';
import ToolPageView from '@/app/tool/[slug]/ToolPageView';
import BlockedBanner from './BlockedBanner';

export const dynamic = 'force-dynamic';

// A blocked tool's page for the DevHunt team (everyone else gets a 404 on /tool/[slug]), with a banner
// saying why it was blocked and a button to unblock it.
export default async function AdminToolPage({ params: { slug } }: { params: { slug: string } }) {
  if (!(await isAdmin())) notFound();
  const name = decodeURIComponent(slug);
  const data = await loadToolPageData(serviceClient, name, true);
  if (!data) notFound();
  const product = data.product as typeof data.product & { moderation?: string; moderation_reason?: string | null; site_status?: string };
  if (product.moderation !== 'blocked') {
    // Unblocked since (e.g. an old Discord link): the public page. Hidden for another reason: a 404.
    if (!product.deleted && product.site_status === 'ok') redirect(`/tool/${name}`);
    notFound();
  }
  return <ToolPageView data={data} slug={name} banner={<BlockedBanner id={product.id} slug={name} reason={product.moderation_reason ?? null} />} />;
}
