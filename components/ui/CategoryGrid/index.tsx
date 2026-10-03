import Link from 'next/link';
import SectionLabel from '@/components/ui/SectionLabel';
import { getCategoryCounts } from '@/utils/categoryCounts';

// "Browse by category" grid at the bottom of the home page.
export default async function CategoryGrid() {
  const counts = await getCategoryCounts();
  if (!counts.length) return null;
  return (
    <div id="categories" className="mt-14">
      <SectionLabel title="Browse by category" hint={`${counts.length} categories`} />
      <ul className="mt-2 grid gap-x-8 sm:grid-cols-2 md:grid-cols-3">
        {counts.map(category => (
          <li key={category.name}>
            <Link href={category.href} className="group flex items-baseline gap-x-2 py-1.5 text-sm">
              <span className="truncate text-slate-300 group-hover:text-slate-50">{category.name}</span>
              <span aria-hidden className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-slate-700" />
              <span className="flex-none font-mono text-xs text-slate-500 tabular-nums group-hover:text-slate-300">{category.count.toLocaleString('en-US')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
