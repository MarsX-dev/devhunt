'use client';

import { useEffect, useState } from 'react';

// Floating table of contents on the left (wide screens): jumps to a section and marks the one in view.
export default function SectionMenu({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <nav className="fixed left-6 top-28 z-20 hidden w-44 font-mono text-xs xl:block" aria-label="Sections">
      <ul className="space-y-0.5 border-l border-slate-800">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={e => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `${location.search}#${id}`);
              }}
              className={`-ml-px block border-l py-1 pl-3 ${active === id ? 'border-orange-400 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
