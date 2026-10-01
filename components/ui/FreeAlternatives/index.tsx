import Link from 'next/link';
import { FREE_KIND_LABEL, type FreeKind, freeAlternativesPath, freeRowsAsAlternative, freeRowsAsPaid } from '@/utils/freeAlternatives';

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

// Links between a tool and the free-alternatives pages: "free alternatives to X" on a paid tool, "a free alternative
// to X, Y" on a free one. Static data only, no query.
export function FreeAltLinks({ slug, name }: { slug: string; name: string }) {
  const asPaid = freeRowsAsPaid(slug);
  const asAlt = freeRowsAsAlternative(slug);
  if (!asPaid.length && !asAlt.length) return null;
  const link = 'text-orange-400 hover:text-orange-300';
  return (
    <div className="mt-4 space-y-1 text-sm text-slate-400">
      {asPaid.length > 0 && (
        <p>
          Looking for something free?{' '}
          <Link href={freeAlternativesPath(slug)} className={link}>
            Free and open-source {name} alternatives →
          </Link>
        </p>
      )}
      {asAlt.length > 0 && (
        <p>
          {name} is a free alternative to{' '}
          {asAlt.map((r, i) => (
            <span key={r.slug}>
              {i > 0 && (i === asAlt.length - 1 ? ' and ' : ', ')}
              <Link href={freeAlternativesPath(r.slug)} className={link}>
                {r.name}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}
