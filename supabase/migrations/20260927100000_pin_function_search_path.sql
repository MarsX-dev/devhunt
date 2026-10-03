-- Supabase advisor: pin search_path on functions (none of these reference other schemas).
ALTER FUNCTION public.get_next_launch_days(date, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_next_launch_weeks(integer, integer, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_prev_launch_days(date, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_prev_launch_weeks(integer, integer, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_products_count_by_date(date, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_products_count_by_week(date, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_products_count_by_week(integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_products_count_by_week(integer, integer, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_similar_products(bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_week_number(date, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_weeks(integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public."updateViews"(bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_launch_time() SET search_path = public, pg_temp;

-- Supabase advisor: ix_username duplicates the unique constraint profiles_username_key.
-- (comments_id_key also duplicates comments_pkey but backs two foreign keys, so it stays.)
DROP INDEX IF EXISTS public.ix_username;
