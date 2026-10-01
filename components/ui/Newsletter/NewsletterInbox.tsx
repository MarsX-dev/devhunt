'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Mail } from 'lucide-react';
import useOnclickOutside from 'react-cool-onclickoutside';
import NewsletterForm, { isSubscribed } from './NewsletterForm';
import type { InboxEmail } from '@/utils/newsletterInbox';

const SEEN_KEY = 'newsletterInboxSeen';
const WEEK = 7 * 86400000;

const cleanName = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, '').trim();
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Header bell: a preview of the weekly emails the visitor missed, with a subscribe form.
export default function NewsletterInbox() {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  const [emails, setEmails] = useState<InboxEmail[] | null>(null);
  const ref = useOnclickOutside(() => setOpen(false));

  // Random "unread" count, set after mount (no hydration mismatch); hidden once opened this week.
  useEffect(() => {
    try {
      const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
      if (isSubscribed() || Date.now() - seen < WEEK) return;
    } catch {}
    setBadge(3 + Math.floor(Math.random() * 7));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setBadge(0);
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {}
    if (!emails)
      fetch('/api/newsletter/inbox')
        .then(r => r.json())
        .then(d => setEmails(d.emails ?? []))
        .catch(() => setEmails([]));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-expanded={open}
        title="Weekly email"
        className={`relative flex items-center gap-x-2 hover:text-slate-200 lg:rounded-full lg:p-1.5 lg:hover:bg-slate-800 ${open ? 'lg:bg-slate-800 lg:text-slate-200' : ''}`}
      >
        <span className="relative">
          <Bell className="h-[18px] w-[18px]" />
          {badge ? (
            <span aria-hidden className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-slate-900">
              {badge}
            </span>
          ) : null}
        </span>
        {/* The accessible name comes from this text (the badge is hidden from it), so name and visible label match. */}
        <span className="lg:sr-only">Weekly email</span>
      </button>
      {open ? (
        <div className="mt-3 w-full overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800 text-sm shadow-2xl shadow-black/40 lg:absolute lg:right-0 lg:top-9 lg:mt-0 lg:w-[380px]">
          <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-3">
            <div>
              <p className="font-medium text-slate-100">Your weekly email</p>
              <p className="text-xs text-slate-400">What you'd have received if you were subscribed</p>
            </div>
            <Mail className="h-4 w-4 text-slate-500" />
          </div>
          <ul className="max-h-[50vh] divide-y divide-slate-700/60 overflow-y-auto">
            {emails === null
              ? [0, 1, 2].map(i => (
                  <li key={i} className="space-y-2 px-4 py-3">
                    <div className="h-3 w-40 animate-pulse rounded bg-slate-700" />
                    <div className="h-3 w-56 animate-pulse rounded bg-slate-700/70" />
                  </li>
                ))
              : emails.map(email => (
                  <li key={email.week} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-x-2">
                      <p className="flex items-center gap-x-2 font-medium text-slate-200">
                        <span className="h-1.5 w-1.5 flex-none rounded-full bg-orange-500" />
                        🏆 Top 3 dev tools of week {email.week}
                      </p>
                      <span className="flex-none text-xs text-slate-500">{fmtDate(email.sentAt)}</span>
                    </div>
                    <ol className="mt-2 space-y-1.5 pl-3.5">
                      {email.tools.map((tool, idx) => (
                        <li key={tool.slug}>
                          <Link
                            href={`/tool/${tool.slug}`}
                            onClick={() => setOpen(false)}
                            className="group flex items-center gap-x-2 text-[13px]"
                          >
                            <span className="w-3 flex-none font-mono text-[11px] text-slate-500">{idx + 1}</span>
                            <img
                              src={(tool.logo_url || '').replace(/w=\d+/g, 'w=40')}
                              alt=""
                              loading="lazy"
                              className="h-5 w-5 flex-none rounded bg-slate-700 object-cover"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              <span className="text-slate-200 group-hover:text-white">{cleanName(tool.name)}</span>
                              {tool.slogan ? <span className="text-slate-500"> — {tool.slogan}</span> : null}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
            {emails?.length === 0 ? <li className="px-4 py-6 text-center text-slate-400">No emails yet.</li> : null}
          </ul>
          <div className="border-t border-slate-700/70 bg-slate-900/40 px-4 py-3">
            <p className="mb-2 text-xs text-slate-400">Get the best new dev tools every Tuesday. Unsubscribe anytime.</p>
            <NewsletterForm source="header_inbox" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
