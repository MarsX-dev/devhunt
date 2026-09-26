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
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {counts.map(category => (
          <li key={category.name}>
            <Link
              href={category.href}
              className="group flex items-center justify-between gap-x-2 rounded-xl border border-slate-800 px-3 py-2.5 duration-150 hover:border-slate-600 hover:bg-slate-800/40"
            >
              <span className="truncate text-sm text-slate-300 group-hover:text-slate-50">{category.name}</span>
              <span className="flex-none font-mono text-xs text-slate-500 tabular-nums">{category.count.toLocaleString('en-US')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
