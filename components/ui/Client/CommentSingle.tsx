import { DELETED_NAME } from '@/utils/deletion';
import type { Comment as CommentType } from '@/utils/supabase/types';
import { type FormEventHandler, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentService from '@/utils/supabase/services/comments';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useSupabase } from '@/components/supabase/provider';
import { timeAgo } from '@/utils/activity';
import { autoGrow, submitOnEnter } from './CommentFormSection';
import { forgetComment, updateRememberedComment } from '@/utils/myComments';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
    username: string;
  };
}

type Props = {
  comment: CommentTypeProp;
  productId: string;
};

// One comment, terminal-log style: a mono line with who, [maker], when and likes, then the text.
export default ({ comment, productId }: Props) => {
  const { session } = useSupabase();
  const user = session && session.user;
  const router = useRouter();
  const commentService = new CommentService(createBrowserClient());
  const [newComment, setNewComment] = useState(comment);
  const [isEditorActive, setEditorActive] = useState(false);
  const [isLoad, setLoad] = useState(false);
  const [content, setContent] = useState(comment.content);

  // Edits, deletes and likes also apply locally when the server has no such comment (a comment only
  // this browser remembers), so they behave exactly like on any other comment.
  const handleEdit: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault();
    if (!content.trim() || isLoad) return;
    setLoad(true);
    const text = content.trim();
    // Saved (and spam-checked) on the server; a comment only this browser knows about just updates locally.
    const res = await fetch(`/api/comments/${newComment.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) })
      .then(async r => (r.ok ? ((await r.json()).comment as { content: string }) : null))
      .catch(() => null);
    updateRememberedComment(newComment.id as number, { content: text });
    setNewComment(c => ({ ...c, ...(res ?? {}), content: text, profiles: c.profiles }));
    setLoad(false);
    setEditorActive(false);
  };

  const handleCancel = () => {
    setEditorActive(false);
    setContent(newComment.content);
  };

  const handleLike = async () => {
    if (!user) return router.push('/login');
    const isVoted = await commentService.toggleVote(newComment.id as number, user.id).catch(() => newComment.votes_count === 0);
    setNewComment(c => ({ ...c, votes_count: Math.max(0, c.votes_count + (isVoted ? 1 : -1)) }));
  };

  const handleDelete = () => {
    setEditorActive(false);
    forgetComment(newComment.id as number);
    commentService
      .delete(newComment.id)
      .catch(() => null)
      .then(() => setNewComment(c => ({ ...c, deleted: true })));
  };

  const authorDeleted = !newComment.profiles?.username || newComment.profiles.username.startsWith('deleted-');
  const isOwn = !!user && user.id == newComment.user_id && !newComment.deleted;
  const avatar = (
    <img
      src={(!authorDeleted && newComment.profiles.avatar_url) || '/user.svg'}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-5 w-5 rounded-full bg-slate-800 object-cover"
    />
  );
  const action = 'duration-150 hover:text-slate-200';
  if (newComment.deleted) return null; // deleted comments aren't listed at all

  return (
    <li id={`${newComment.id}`} className="group flex gap-x-2.5 py-2.5">
      {authorDeleted ? (
        <span className="flex-none">{avatar}</span>
      ) : (
        <Link className="flex-none" href={`/@${newComment.profiles.username}`}>
          {avatar}
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-5 text-slate-500">
          {authorDeleted ? (
            <span>{DELETED_NAME}</span>
          ) : (
            <Link href={`/@${newComment.profiles.username}`} className="text-slate-200 hover:text-white">
              {newComment.profiles.full_name}
            </Link>
          )}
          {newComment.user_id == productId && <span className="text-orange-400">[maker]</span>}
          <span>· {timeAgo(newComment.created_at as string)}</span>
          <button
            onClick={handleLike}
            aria-label={`Like (${newComment.votes_count})`}
            className={`${newComment.votes_count > 0 ? 'text-rose-400/90' : ''} duration-150 hover:text-rose-300`}
          >
            ♥{newComment.votes_count > 0 ? ` ${newComment.votes_count}` : ''}
          </button>
          {isOwn && !isEditorActive && (
            <span className="ml-auto flex gap-x-3 sm:opacity-0 sm:duration-150 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <button onClick={() => setEditorActive(true)} className={action}>
                edit
              </button>
              <button onClick={handleDelete} className="duration-150 hover:text-red-400">
                delete
              </button>
            </span>
          )}
        </div>
        {isEditorActive ? (
          <form onSubmit={handleEdit} className="mt-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 focus-within:border-slate-500">
            <textarea
              ref={el => autoGrow(el)}
              rows={1}
              autoFocus
              value={content}
              onChange={e => {
                setContent(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={e => (e.key === 'Escape' ? handleCancel() : submitOnEnter(e))}
              aria-label="Edit comment"
              className="w-full resize-none bg-transparent text-sm leading-5 text-slate-200 outline-none"
            />
            <div className="flex justify-end gap-x-3 font-mono text-xs text-slate-500">
              <button type="button" onClick={handleCancel} className={action}>
                esc cancel
              </button>
              <button type="submit" disabled={isLoad} className={action}>
                {isLoad ? 'saving…' : 'save ⏎'}
              </button>
            </div>
          </form>
        ) : (
          // Blank lines between paragraphs collapse to a line break: keeps long comments compact.
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-300">{newComment.content.trim().replace(/\n\s*\n+/g, '\n')}</p>
        )}
      </div>
    </li>
  );
};
