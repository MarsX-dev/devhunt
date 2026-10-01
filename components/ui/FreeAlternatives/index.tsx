import Link from 'next/link';
import { FREE_KIND_LABEL, type FreeKind } from '@/utils/freeAlternatives';

export const smallLogo = (url: string | null, w = 48) => (url ? url.replace(/w=\d+/g, `w=${w}`) : null);

// Open source is the default and gets no badge; only the exceptions are marked, quietly.
export function KindBadge({ kind, license }: { kind: FreeKind; license?: string }) {
  if (kind === 'oss') return null;
  return (
    <span title={license ? `License: ${license}` : undefined} className="flex-none text-[11px] text-amber-400/80">
      {kind === 'source-available' ? '*' : FREE_KIND_LABEL[kind]}
    </span>
  );
}

export function ToolChip({ slug, name, logo, href }: { slug: string; name: string; logo: string | null; href?: string }) {
  const src = smallLogo(logo);
  return (
    <Link
      href={href ?? `/tool/${slug}`}
      className="inline-flex items-center gap-x-2 rounded-full border border-slate-800 py-1 pl-1 pr-3 text-sm text-slate-200 hover:border-slate-600 hover:text-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="h-6 w-6 rounded-full bg-slate-800 object-cover" /> : <span className="h-6 w-6 rounded-full bg-slate-800" />}
      {name}
    </Link>
  );
}
