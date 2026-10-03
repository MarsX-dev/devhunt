-- Table privileges for the public API roles, down to what the app's browser code uses. Row-level security
-- already blocks the rest; this keeps a future policy mistake from opening a table to writes.
-- Browser writes that remain: own tool edit (products UPDATE, its categories INSERT/DELETE), own profile
-- (profiles INSERT/UPDATE), own comment text and soft delete (granted per column earlier).
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE INSERT, DELETE ON public.products FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE DELETE ON public.profiles FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.product_category_product FROM anon;
REVOKE UPDATE ON public.product_category_product FROM authenticated;

REVOKE DELETE ON public.comment FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.product_categories, public.product_pricing_types, public.product_week_ranks FROM anon, authenticated;

-- Server-only tables.
REVOKE ALL ON public.logs, public.cron_comment_logs, public.cron_sends, public.cron_upvote_logs FROM anon, authenticated;

-- Views are read-only.
REVOKE INSERT, UPDATE, DELETE ON public.product_awards, public.product_ranks, public.product_votes_view, public.weekly_rank,
  public.weekly_winners, public.winner_of_the_day, public.winner_of_the_month, public.winner_of_the_week FROM anon, authenticated;
