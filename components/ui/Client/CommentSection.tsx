'use client';

import { useEffect, useState } from 'react';
import CommentFormSection from './CommentFormSection';
import CommentsSection from './CommentsSection';
import type { Comment as CommentType, Product } from '@/utils/supabase/types';
import { useSupabase } from '@/components/supabase/provider';
import { myComments } from '@/utils/myComments';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
  };
}

const visible = (list: CommentTypeProp[]) => (list ?? []).filter(c => !c.deleted);

// loadingCount: comments are still loading (preview modal); that many placeholder rows keep the space.
export default ({ comments, slug, productId, loadingCount }: { comments: CommentTypeProp[]; slug: string; productId: string; loadingCount?: number }) => {
  const { session } = useSupabase();
  const userId = session?.user.id;
  const [commentsCollection, setCommentsCollection] = useState<CommentTypeProp[]>(() => visible(comments));
  // Deleted comments are hidden; the viewer's own comments remembered in this browser are merged in
  // (newest first), so an author always sees what they posted.
  useEffect(() => {
    const list = visible(comments);
    const mine = userId ? (myComments(slug, userId) as unknown as CommentTypeProp[]).filter(m => !list.some(c => c.id === m.id)) : [];
    setCommentsCollection([...mine, ...list].sort((a, b) => Date.parse(b.created_at as string) - Date.parse(a.created_at as string)));
  }, [comments, slug, userId]);

  return (
    <div className="container-custom-screen scroll-mt-32" id="comments">
      {/* No visible heading: the "Comments" tab above carries the title and the count. */}
      <h2 className="sr-only">Comments</h2>
      <CommentFormSection comments={commentsCollection} setCommentsCollection={setCommentsCollection} slug={slug} />
      <div className="mt-2">
        {loadingCount !== undefined ? (
          // Same height as a one-line comment (meta line + text line), so nothing moves when they arrive.
          <ul aria-busy="true" aria-label="Loading comments">
            {Array.from({ length: Math.min(loadingCount, 10) }, (_, i) => (
              <li key={i} className="flex gap-x-2.5 py-2.5">
                <span className="h-5 w-5 flex-none animate-pulse rounded-full bg-slate-800" />
                <span className="flex-1">
                  <span className="flex h-5 items-center">
                    <span className="block h-3 w-40 animate-pulse rounded bg-slate-800" />
                  </span>
                  <span className="flex h-5 items-center">
                    <span className="block h-3 w-full max-w-lg animate-pulse rounded bg-slate-800" />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <CommentsSection productId={productId} comments={commentsCollection as any} />
        )}
      </div>
    </div>
  );
};
