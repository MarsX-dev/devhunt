'use client';

import Link from 'next/link';
import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
import axios from 'axios';
import { useSupabase } from '@/components/supabase/provider';
import { rememberComment } from '@/utils/myComments';

// Grows with the text (one line when empty), up to ~8 lines.
export const autoGrow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
};

// Enter posts, Shift+Enter adds a line (like a terminal prompt).
export const submitOnEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
};

// The new-comment box: a one-line prompt, "> add a comment…".
export default ({
  slug,
  comments,
  setCommentsCollection = () => '',
}: {
  slug: string;
  comments: any;
  setCommentsCollection?: (val: any) => void;
}) => {
  const { session } = useSupabase();
  const user = session && session.user;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [comment, setComment] = useState<string>('');
  const [isLoad, setLoad] = useState(false);
  const [error, setError] = useState('');

  // Posted through /api/comments (spam checks happen there). The list is newest first.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isLoad) return;
    setLoad(true);
    setError('');
    try {
      const { data } = await axios.post('/api/comments', { slug, content: comment.trim() });
      rememberComment(slug, data.comment);
      setCommentsCollection([data.comment, ...comments]);
      setComment('');
      requestAnimationFrame(() => autoGrow(inputRef.current));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not post the comment, please try again.');
    }
    setLoad(false);
  };

  const box = 'flex items-start gap-x-2 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-sm duration-150';
  if (!user) {
    return (
      <Link href="/login" className={`${box} text-slate-500 hover:border-slate-600 hover:text-slate-300`}>
        <span className="leading-5 text-orange-500">&gt;</span>
        <span className="leading-5">log in to comment</span>
      </Link>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className={`${box} focus-within:border-slate-600`}>
      <span className="leading-5 text-orange-500" aria-hidden>
        &gt;
      </span>
      <textarea
        ref={inputRef}
        rows={1}
        value={comment}
        onChange={e => {
          setComment(e.target.value);
          autoGrow(e.target);
        }}
        onKeyDown={submitOnEnter}
        placeholder="add a comment…"
        aria-label="Add a comment"
        className="min-w-0 flex-1 resize-none bg-transparent font-sans leading-5 text-slate-200 outline-none placeholder:font-mono placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={!comment.trim() || isLoad}
        className="flex-none text-xs leading-5 text-orange-400 duration-150 hover:text-orange-300 disabled:text-slate-600"
      >
        {isLoad ? 'posting…' : 'post ⏎'}
      </button>
    </form>
    {error && <p className="mt-1 font-mono text-xs text-red-400">! {error}</p>}
    </>
  );
};
