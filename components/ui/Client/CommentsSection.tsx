import type { Comment as CommentType } from '@/utils/supabase/types';
import CommentSingle from './CommentSingle';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
    username: string;
  };
}

export default ({ comments, productId }: { comments: CommentTypeProp[]; productId: string }) => (
  <ul>
    {comments.map((comment: CommentTypeProp, idx) => (
      <CommentSingle key={comment.id ?? idx} comment={comment as CommentTypeProp} productId={productId} />
    ))}
  </ul>
);
