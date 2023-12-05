import {
  CommentUserAvatar,
  Comments,
  Comment,
  CommentUserName,
  CommentDate,
  CommentContext,
  CommentLike,
  CommentActionMenu,
  CommentForm,
  CommentTextarea,
  CommentDeleted,
} from '@/components/ui/Comment';
import type { Comment as CommentType, Profile } from '@/utils/supabase/types';
import moment from 'moment';
import { FormEventHandler, useState } from 'react';
import Button from '../Button/Button';
import CommentService from '@/utils/supabase/services/comments';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useSupabase } from '@/components/supabase/provider';
import Link from 'next/link';

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

export default ({ comment, productId }: Props) => {
  const { session } = useSupabase();
  const user = session && session.user;
  const supabaseService = createBrowserClient();
  const commentService = new CommentService(supabaseService);
  const [newComment, setNewComment] = useState(comment);
  const [isEditorActive, setEditorActive] = useState(false);
  const [isLoad, setLoad] = useState(false);
  const [content, setContent] = useState(comment.content);

  const handleEdit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();

    if (content) {
      setLoad(true);
      commentService
        .update(comment.id as number, {
          content,
        })
        .then(res => {
          setLoad(false);
          setEditorActive(false);
          setNewComment(res as CommentTypeProp);
        });
    }
  };

  const handleCancel = () => {
    setEditorActive(false);
    setContent(comment.content);
  };

  const handleLike = (num: number) => {
    return {
      ...newComment,
      votes_count: num,
    };
  };

  const handleCommentLike = async (comment: CommentTypeProp) => {
    if (user) {
      const isVoted = await commentService.toggleVote(comment.id as number, user.id);
      if (isVoted) {
        setNewComment(handleLike(newComment.votes_count + 1));
      } else {
        setNewComment(handleLike(newComment.votes_count - 1));
      }
    } else {
      window.location.pathname = '/login';
    }
  };

  const handleDelete = () => {
    setEditorActive(false);
    commentService.delete(newComment.id).then(() => {
      setNewComment({
        ...newComment,
        deleted: true,
      });
    });
  };

  return (
    <Comment id={`${newComment.id}`} className="items-start gap-x-2">
      {/*TODO add First Letters Like avatars if there is no avatar */}
      <Link className="flex-none" href={`/@${newComment.profiles.username}`}>
        <CommentUserAvatar alt={newComment.profiles.full_name} src={newComment.profiles.avatar_url} />
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-x-3">
          <Link className="block" href={`/@${newComment.profiles.username}`}>
            <CommentUserName>{newComment.profiles.full_name}</CommentUserName>
          </Link>
          {newComment.user_id == productId ? (
            <div className="text-xs px-2 py-0.5 rounded-full bg-indigo-400 border-indigo-600 text-white font-medium">Maker</div>
          ) : (
            ''
          )}
        </div>
        <CommentDate className="mt-1">{moment(newComment.created_at).fromNow()}</CommentDate>
        {isEditorActive ? (
          <CommentForm onSubmit={handleEdit}>
            <CommentTextarea value={content} onChange={e => setContent((e.target as HTMLTextAreaElement).value)} className="mt-2" />
            <div className="mt-3 flex items-center gap-x-2 justify-end">
              <Button type="button" onClick={handleCancel} className="text-xs bg-slate-800 hover:bg-slate-700">
                Cancel
              </Button>
              <Button
                type="submit"
                isLoad={isLoad}
                className={`text-xs hover:bg-orange-400 ${isLoad ? 'pointer-events-none opacity-60' : ''}`}
              >
                Edit comment
              </Button>
            </div>
          </CommentForm>
        ) : newComment.deleted ? (
          <CommentDeleted />
        ) : (
          <>
            <CommentContext className="mt-3">{newComment.content}</CommentContext>
            <CommentLike onClick={() => handleCommentLike(newComment)} className="mt-2" count={newComment.votes_count} />
          </>
        )}
      </div>
      {user && user.id == newComment.user_id && !comment.deleted ? (
        <CommentActionMenu>
          <li>
            <Button
              onClick={() => setEditorActive(true)}
              className="block w-full py-1 px-3 font-normal text-xs text-slate-300 text-left rounded-none border-t border-slate-700 bg-transparent hover:bg-slate-700"
            >
              Edit
            </Button>
          </li>
          <li>
            <Button
              onClick={handleDelete}
              className="block w-full py-1 px-3 font-normal text-xs text-red-500 text-left rounded-none border-t border-slate-700 bg-transparent hover:text-red-50 hover:bg-red-500"
            >
              Delete
            </Button>
          </li>
        </CommentActionMenu>
      ) : (
        ''
      )}
    </Comment>
  );
};
