'use client';

import { useEffect, useState } from 'react';
import CommentFormSection from './CommentFormSection';
import CommentsSection from './CommentsSection';
import type { Comment as CommentType, Product } from '@/utils/supabase/types';
import { useSupabase } from '@/components/supabase/provider';
import SectionLabel from '@/components/ui/SectionLabel';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
  };
}

// loadingCount: comments are still loading (preview modal); that many placeholder rows keep the space.
export default ({ comments, slug, productId, loadingCount }: { comments: CommentTypeProp[]; slug: string; productId: string; loadingCount?: number }) => {
  const { user } = useSupabase();
  const [commentsCollection, setCommentsCollection] = useState<CommentTypeProp[]>(comments);
  useEffect(() => {
    setCommentsCollection(comments);
  }, [comments]);

  return (
    <div className="container-custom-screen" id="comments">
      <SectionLabel
        title="Comments"
        hint={commentsCollection?.length ? `${commentsCollection.length} ${commentsCollection.length === 1 ? 'comment' : 'comments'}` : 'Support and feedback'}
      />
      <CommentFormSection
        comments={commentsCollection}
        setCommentsCollection={setCommentsCollection}
        userAvatar={user?.avatar_url as string}
        slug={slug}
      />
      {/*TODO move comments in a separate component to make them laze loaded */}
      <div className="mt-6">
        {loadingCount !== undefined ? (
          <ul className="space-y-6" aria-busy="true" aria-label="Loading comments">
            {Array.from({ length: Math.min(loadingCount, 10) }, (_, i) => (
              <li key={i} className="flex gap-x-3">
                <span className="h-10 w-10 flex-none animate-pulse rounded-full bg-slate-800" />
                <span className="flex-1 space-y-2 pt-1">
                  <span className="block h-3.5 w-32 animate-pulse rounded bg-slate-800" />
                  <span className="block h-3.5 w-full max-w-lg animate-pulse rounded bg-slate-800" />
                  <span className="block h-3.5 w-2/3 max-w-sm animate-pulse rounded bg-slate-800" />
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
