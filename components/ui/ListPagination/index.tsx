import Link from 'next/link';

// Crawlable pagination: plain links (?page=N; page 1 is the bare path), prev/next and a window of
// page numbers around the current one.
export default function ListPagination({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);
  const numbers = Array.from(new Set([1, page - 1, page, page + 1, totalPages])).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const item = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm duration-150';
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${item} border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-slate-50`}>
          ← Prev
        </Link>
      ) : null}
      {numbers.map((n, idx) => (
        <span key={n} className="flex items-center gap-1.5">
          {idx > 0 && n - numbers[idx - 1] > 1 && <span className="px-1 text-slate-600">…</span>}
          {n === page ? (
            <span aria-current="page" className={`${item} bg-slate-50 font-medium text-slate-900`}>
              {n}
            </span>
          ) : (
            <Link href={href(n)} className={`${item} text-slate-400 hover:bg-slate-800 hover:text-slate-50`}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${item} border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-slate-50`}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
