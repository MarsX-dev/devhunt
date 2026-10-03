-- QA-012 / QA-013 / QA-014: INSERT policies used WITH CHECK (true), letting any
-- logged-in user create rows on behalf of other users.
-- Backward-compatible: the app always inserts with the logged-in user's own id.

DROP POLICY "Enable insert for authenticated users only" ON public.comment;
CREATE POLICY "Enable insert for authenticated users only" ON public.comment
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY "Enable insert for authenticated users only" ON public.comment_vote;
CREATE POLICY "Enable insert for authenticated users only" ON public.comment_vote
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY "Enable insert for authenticated users only" ON public.products;
CREATE POLICY "Enable insert for authenticated users only" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY "Enable insert for authenticated users only" ON public.product_category_product;
CREATE POLICY "Enable insert for authenticated users only" ON public.product_category_product
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT products.owner_id FROM public.products WHERE products.id = product_category_product.product_id LIMIT 1)
  );
