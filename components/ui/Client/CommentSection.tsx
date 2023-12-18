'use client';

import { useEffect, useState } from 'react';
import CommentFormSection from './CommentFormSection';
import CommentsSection from './CommentsSection';
import type { Comment as CommentType, Product } from '@/utils/supabase/types';
import { useSupabase } from '@/components/supabase/provider';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
  };
}

export default ({ comments, slug, productId }: { comments: CommentTypeProp[]; slug: string; productId: string }) => {
  const { user } = useSupabase();
  const [commentsCollection, setCommentsCollection] = useState<CommentTypeProp[]>(comments);
  useEffect(() => {
    setCommentsCollection(comments);
  }, [comments]);

  return (
    <div className="container-custom-screen" id="comments">
      <h3 className="text-slate-50 font-medium">Comments, support and feedback</h3>
      <CommentFormSection
        comments={commentsCollection}
        setCommentsCollection={setCommentsCollection}
        userAvatar={user?.avatar_url as string}
        slug={slug}
      />
      {/*TODO move comments in a separate component to make them laze loaded */}
      <div className="mt-6">
        <CommentsSection productId={productId} comments={commentsCollection as any} />
      </div>
    </div>
  );
};
