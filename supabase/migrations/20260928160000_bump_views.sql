-- Impression counting without a site-wide hot row (2026-09-27 outage).
-- updateViews ran once per visible tool card and every call also updated the single
-- site_daily_views row for the day, so concurrent calls queued on that row lock while each held a
-- PostgREST connection; the pool filled up and every other request timed out.

-- 1. The daily counter is spread over 16 rows per day (get_site_stats already sums the day's rows).
ALTER TABLE public.site_daily_views ADD COLUMN IF NOT EXISTS shard smallint NOT NULL DEFAULT 0;
ALTER TABLE public.site_daily_views DROP CONSTRAINT IF EXISTS site_daily_views_pkey;
ALTER TABLE public.site_daily_views ADD CONSTRAINT site_daily_views_pkey PRIMARY KEY (day, shard);

-- 2. One call per page for all the tools seen (at most 50). Rows are locked in id order so
-- concurrent calls can't deadlock, and a call gives up after 2s instead of queueing: a lost
-- impression is better than a held connection.
CREATE OR REPLACE FUNCTION public.bump_views(_ids bigint[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  ids bigint[];
BEGIN
  SET LOCAL lock_timeout = '2s';
  SELECT array_agg(DISTINCT i ORDER BY i) INTO ids FROM unnest(_ids[1:50]) AS i WHERE i IS NOT NULL;
  IF ids IS NULL THEN RETURN; END IF;

  PERFORM 1 FROM public.products WHERE id = ANY(ids) ORDER BY id FOR NO KEY UPDATE;
  UPDATE public.products SET views_count = views_count + 1 WHERE id = ANY(ids);

  INSERT INTO public.site_daily_views (day, shard, views)
  VALUES ((now() AT TIME ZONE 'utc')::date, floor(random() * 16)::smallint, cardinality(ids))
  ON CONFLICT (day, shard) DO UPDATE SET views = site_daily_views.views + EXCLUDED.views;
EXCEPTION WHEN lock_not_available THEN
  RETURN;
END
$function$;
GRANT EXECUTE ON FUNCTION public.bump_views(bigint[]) TO anon, authenticated, service_role;

-- 3. Old browser tabs still call updateViews one card at a time: same path, same guarantees.
CREATE OR REPLACE FUNCTION public."updateViews"(_product_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$BEGIN
  PERFORM public.bump_views(ARRAY[_product_id]);
  RETURN (SELECT views_count FROM public.products WHERE id = _product_id);
END$function$;
