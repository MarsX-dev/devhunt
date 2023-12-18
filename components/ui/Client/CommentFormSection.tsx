'use client';

import { CommentForm, CommentTextarea, CommentUserAvatar, CommentFormWrapper } from '@/components/ui/Comment';
import { useSupabase } from '@/components/supabase/provider';
import Button from '@/components/ui/Button/Button';
import { type FormEvent, useState } from 'react';
import LabelError from '../LabelError';
import LinkShiny from '../LinkShiny/LinkShiny';
import ProductsService from '@/utils/supabase/services/products';
import CommentService from '@/utils/supabase/services/comments';
import { createBrowserClient } from '@/utils/supabase/browser';

export default ({
  slug,
  userAvatar,
  comments,
  setCommentsCollection = () => '',
}: {
  slug: string;
  userAvatar: string;
  comments: any;
  setCommentsCollection?: (val: any) => void;
}) => {
  const { session } = useSupabase();
  const user = session && session.user;
  const supabase = createBrowserClient();
  const productsService = new ProductsService(supabase);

  const [comment, setComment] = useState<string>('');
  const [fieldError, setFieldError] = useState<string>('');
  const [isLoad, setLoad] = useState(false);

  const formValidator = (value: string) => {
    if (value) return true;
    else return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError('');
    if (formValidator(comment)) {
      setLoad(true);
      const product = await productsService.getBySlug(slug);
      const commentService = new CommentService(supabase);
      const res = await commentService.insert({
        content: comment,
        user_id: user?.id as string,
        product_id: product?.id as number,
      });
      commentService.getById(res?.id as number).then(newComment => {
        setCommentsCollection([...comments, newComment]);
        setComment('');
        setLoad(false);
      });
    } else setFieldError('Please write a comment');
  };

  return (
    <CommentForm onSubmit={handleSubmit} className="mt-12">
      <CommentFormWrapper>
        {user ? <CommentUserAvatar src={userAvatar} /> : <CommentUserAvatar src="/user.svg" />}
        <CommentTextarea
          value={comment}
          onChange={e => {
            setComment((e.target as HTMLTextAreaElement).value);
          }}
          placeholder="Type here..."
        />
      </CommentFormWrapper>
      <div className="mt-3 flex justify-end">
        {user ? (
          <Button isLoad={isLoad} className={`text-sm bg-slate-800 hover:bg-slate-700 ${isLoad ? 'pointer-events-none opacity-60' : ''}`}>
            Comment
          </Button>
        ) : (
          <LinkShiny href="/login" className="text-sm bg-slate-800 hover:bg-slate-700">
            Login to comment
          </LinkShiny>
        )}
      </div>
      <LabelError>{fieldError}</LabelError>
    </CommentForm>
  );
};
