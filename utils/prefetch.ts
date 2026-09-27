import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Prefetch a route the way <Link> does: dynamic pages only down to their loading.tsx (quick), static
// pages fully. router.prefetch() alone defaults to a FULL prefetch, which renders the whole page on
// the server; a click that lands while it's still running waits for it (no skeleton, a frozen second).
export const prefetchRoute = (router: AppRouterInstance, href: string) => router.prefetch(href, { kind: PrefetchKind.AUTO });
