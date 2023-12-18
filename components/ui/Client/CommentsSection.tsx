import type { Comment as CommentType } from '@/utils/supabase/types';
import CommentSingle from './CommentSingle';
import { Comments } from '../Comment';

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string;
    full_name: string;
    username: string;
  };
}

export default ({ comments, productId }: { comments: CommentTypeProp[]; productId: string }) => {
  return (
    <Comments>
      {comments.map((comment: CommentTypeProp, idx) => (
        <CommentSingle key={idx} comment={comment as CommentTypeProp} productId={productId} />
      ))}
    </Comments>
  );
};
