-- Tool and comment edits go through /api/tools/[id] and /api/comments/[id] (validated and moderated),
-- so the browser no longer needs to write these directly.
-- Apply AFTER the app version that edits through those routes is live (the old one writes directly).
REVOKE UPDATE ON public.products FROM authenticated;
REVOKE INSERT, DELETE ON public.product_category_product FROM authenticated;
REVOKE UPDATE (content) ON public.comment FROM authenticated;
