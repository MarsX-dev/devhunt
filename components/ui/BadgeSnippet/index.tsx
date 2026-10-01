'use client';

import { useState } from 'react';
import CodeBlock from '@/components/CodeBlock';
import { type BadgeTheme, badgeHtml, badgeImageUrl, badgeMarkdown } from '@/utils/badge';

// The "Featured on DevHunt" badge with copyable HTML / Markdown (utils/badge.ts). Unlike the launch banner it
// is a plain link, so it keeps working after the launch week and links search engines to the tool page.
export default function BadgeSnippet({ slug, name, onCopy }: { slug: string; name?: string; onCopy?: () => void }) {
  const [theme, setTheme] = useState<BadgeTheme>('dark');
  const [format, setFormat] = useState<'html' | 'markdown'>('html');
  const label = name?.trim() ? name.trim() : slug;
  const tab = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs ${active ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`;

  return (
    <div>
      <p className="text-sm text-slate-400">
        Add it to your site&apos;s footer or README. It links to your DevHunt page and shows your Dev Tool of the Week rank if you win.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={tab(theme === 'dark')}
          onClick={() => {
            setTheme('dark');
          }}
        >
          Dark
        </button>
        <button
          type="button"
          className={tab(theme === 'light')}
          onClick={() => {
            setTheme('light');
          }}
        >
          Light
        </button>
        <span className="mx-1 h-4 w-px bg-slate-700" aria-hidden />
        <button
          type="button"
          className={tab(format === 'html')}
          onClick={() => {
            setFormat('html');
          }}
        >
          HTML
        </button>
        <button
          type="button"
          className={tab(format === 'markdown')}
          onClick={() => {
            setFormat('markdown');
          }}
        >
          Markdown
        </button>
      </div>
      <div className={`mt-3 inline-block rounded-xl p-3 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-950'}`}>
        <img
          src={badgeImageUrl(slug, theme).replace('https://devhunt.org', '')}
          alt={`${label} - Featured on DevHunt`}
          width={220}
          height={54}
        />
      </div>
      <div className="mt-2">
        <CodeBlock onCopy={onCopy}>{format === 'html' ? badgeHtml(slug, label, theme) : badgeMarkdown(slug, label, theme)}</CodeBlock>
      </div>
    </div>
  );
}
