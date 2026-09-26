-- QA-025: vote RPCs are SECURITY DEFINER and trusted the caller-supplied _user_id,
-- so anyone (even anon) could add/remove votes for any user.
-- Require the caller to be that user, and stop granting EXECUTE to anon/PUBLIC.
-- Backward-compatible: the app always passes the logged-in user's own id.

CREATE OR REPLACE FUNCTION public."toggleProductVote"(_product_id bigint, _user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  -- Check if product.launch_date is in the future.
  IF (SELECT launch_date > NOW() FROM public.products WHERE id = _product_id) THEN
    RETURN (SELECT votes_count FROM public.products WHERE id = _product_id);
  END IF;

  -- If a vote by this user on this product exists, delete it; otherwise, add it.
  IF (SELECT EXISTS (SELECT 1 FROM public.product_votes WHERE product_id = _product_id AND user_id = _user_id)) THEN
    DELETE FROM public.product_votes WHERE product_id = _product_id AND user_id = _user_id;
  ELSE
    INSERT INTO public.product_votes(product_id, user_id) VALUES (_product_id, _user_id);
  END IF;

  -- Update the vote count for this product.
  UPDATE public.products SET votes_count = (SELECT COUNT(*) FROM public.product_votes WHERE product_id = _product_id) WHERE id = _product_id;

  -- Return the updated votes_count value.
  RETURN (SELECT votes_count FROM public.products WHERE id = _product_id);
END$function$;

CREATE OR REPLACE FUNCTION public."toggleCommentVote"(_comment_id bigint, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  IF (SELECT EXISTS (SELECT 1 FROM public.comment_vote WHERE comment_id = _comment_id AND user_id = _user_id)) THEN
      DELETE FROM public.comment_vote WHERE comment_id = _comment_id AND user_id = _user_id;
      UPDATE public.comment SET votes_count = votes_count - 1 WHERE id = _comment_id;

      RETURN false;
  ELSE
      INSERT INTO public.comment_vote(comment_id, user_id) VALUES (_comment_id, _user_id);
      UPDATE public.comment SET votes_count = votes_count + 1 WHERE id = _comment_id;

      RETURN true;
  END IF;
END$function$;

REVOKE EXECUTE ON FUNCTION public."toggleProductVote"(bigint, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public."toggleCommentVote"(bigint, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public."toggleProductVote"(bigint, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public."toggleCommentVote"(bigint, uuid) TO authenticated, service_role;
