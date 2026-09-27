-- Votes and comments change only through the paths the app uses.
-- Votes go through toggleProductVote / toggleCommentVote (SECURITY DEFINER, they check the caller),
-- so direct table writes from the API are not needed.
REVOKE INSERT, UPDATE, DELETE ON public.product_votes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.comment_vote FROM anon, authenticated;

-- Comments are posted through /api/comments. Authors edit their text and soft-delete from the browser,
-- so those two columns stay updatable (the row policy still limits it to their own comments).
REVOKE INSERT, UPDATE ON public.comment FROM anon, authenticated;
GRANT UPDATE (content, deleted) ON public.comment TO authenticated;

-- Like the other ranking views, run with the caller's permissions (row-level security applies).
ALTER VIEW public.weekly_winners SET (security_invoker = true);

-- Avatars: raster images only.
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'] WHERE id = 'avatars';
