-- Home page stats bar. products.views_count is a lifetime counter, so impressions per day are
-- recorded from now on to be able to show "+N today".
CREATE TABLE IF NOT EXISTS public.site_daily_views (
  day date PRIMARY KEY,
  views bigint NOT NULL DEFAULT 0
);
ALTER TABLE public.site_daily_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_daily_views FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public."updateViews"(_product_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = _product_id;

  INSERT INTO public.site_daily_views (day, views) VALUES ((now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (day) DO UPDATE SET views = site_daily_views.views + 1;

  RETURN (SELECT views_count FROM public.products WHERE id = _product_id);
END$function$;

-- Server-only (called with the service role from the home page, cached for 10 minutes).
-- All-time totals plus how much each grew recently, to show the numbers are live.
CREATE OR REPLACE FUNCTION public.get_site_stats()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT json_build_object(
    'total_views', (SELECT coalesce(sum(views_count), 0) FROM products WHERE NOT deleted),
    'views_today', (SELECT coalesce(sum(views), 0) FROM site_daily_views WHERE day = (now() AT TIME ZONE 'utc')::date),
    'tools_launched', (SELECT count(*) FROM products WHERE NOT deleted AND launch_start <= now()),
    'tools_this_week', (SELECT count(*) FROM products WHERE NOT deleted AND launch_start <= now() AND launch_end >= now()),
    'users', (SELECT count(*) FROM auth.users),
    'users_today', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '24 hours')
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_site_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_site_stats() TO service_role;
