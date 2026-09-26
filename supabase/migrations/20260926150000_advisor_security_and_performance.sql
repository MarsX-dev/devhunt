-- Fixes from the Supabase security/performance advisors.

-- get_user_emails_by_ids read auth.users emails and was callable by anyone (anon), while profile
-- ids are public: every user's email could be harvested. Only the cron email routes need it, and
-- they now use the service-role client.
ALTER FUNCTION public.get_user_emails_by_ids(uuid[]) SET search_path = public, auth;
REVOKE EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) TO service_role;

-- Trigger functions are not meant to be called through the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_launch_time() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_votes_count() FROM PUBLIC, anon, authenticated;

-- Views ran with the creator's rights (bypassing RLS). Every table they read is publicly
-- readable, so running them as the caller returns the same rows.
ALTER VIEW public.product_awards SET (security_invoker = true);
ALTER VIEW public.product_votes_view SET (security_invoker = true);
ALTER VIEW public.winner_of_the_month SET (security_invoker = true);
ALTER VIEW public.winner_of_the_week SET (security_invoker = true);
ALTER VIEW public.product_ranks SET (security_invoker = true);
ALTER VIEW public.winner_of_the_day SET (security_invoker = true);
ALTER VIEW public.weekly_winners SET (security_invoker = true);
ALTER VIEW public.weekly_rank SET (security_invoker = true);

-- Unindexed foreign keys.
CREATE INDEX IF NOT EXISTS idx_comment_vote_user_id ON public.comment_vote (user_id);
CREATE INDEX IF NOT EXISTS idx_product_category_product_product_id ON public.product_category_product (product_id);

-- Evaluate auth.uid() once per query instead of once per row (same logic).
ALTER POLICY "Enable delete for owners only" ON public.comment USING (((select auth.uid()) = user_id));
ALTER POLICY "Enable insert for authenticated users only" ON public.comment WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Enable update only for comments belonging to logged in user" ON public.comment USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Enable delete for users based on user_id" ON public.comment_vote USING (((select auth.uid()) = user_id));
ALTER POLICY "Enable insert for authenticated users only" ON public.comment_vote WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Enable delete for users based on user_id" ON public.product_category_product USING (((select auth.uid()) = ( SELECT products.owner_id
   FROM products
  WHERE (products.id = product_category_product.product_id)
 LIMIT 1)));
ALTER POLICY "Enable insert for authenticated users only" ON public.product_category_product WITH CHECK (((select auth.uid()) = ( SELECT products.owner_id
   FROM products
  WHERE (products.id = product_category_product.product_id)
 LIMIT 1)));
ALTER POLICY "Enable delete for users based on user_id" ON public.product_votes USING (((select auth.uid()) = user_id));
ALTER POLICY "Enable insert for authenticated users only for themself" ON public.product_votes WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Enable insert for authenticated users only" ON public.products WITH CHECK (((select auth.uid()) = owner_id));
ALTER POLICY "Enable update only for owners" ON public.products USING (((select auth.uid()) = owner_id)) WITH CHECK (((select auth.uid()) = owner_id));
ALTER POLICY "Users can insert their own profile." ON public.profiles WITH CHECK (((select auth.uid()) = id));
ALTER POLICY "Users can update own profile." ON public.profiles USING (((select auth.uid()) = id));
