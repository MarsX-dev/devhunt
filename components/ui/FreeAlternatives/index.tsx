import Link from 'next/link';
import { FREE_KIND_LABEL, type FreeKind } from '@/utils/freeAlternatives';

export const smallLogo = (url: string | null, w = 48) => (url ? url.replace(/w=\d+/g, `w=${w}`) : null);

const KIND_STYLE: Record<FreeKind, string> = {
  oss: 'border-emerald-700/60 text-emerald-300',
  'source-available': 'border-amber-700/60 text-amber-300',
  free: 'border-sky-700/60 text-sky-300',
};

export function KindBadge({ kind, license }: { kind: FreeKind; license?: string }) {
  return (
    <span
      title={license ? `License: ${license}` : undefined}
      className={`inline-flex flex-none items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${KIND_STYLE[kind]}`}
    >
      {FREE_KIND_LABEL[kind]}
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
