-- Week ranks, precomputed. The product_ranks view ranks every product ever launched on each call
-- (~100ms); tool pages called it once per tool, so crawlers walking old tools ran it ~20x a minute
-- to re-derive ranks that never change. The whole table is recomputed in ~150ms every 10 minutes
-- and tool pages read one row by primary key.
CREATE TABLE IF NOT EXISTS public.product_week_ranks (
  product_id bigint PRIMARY KEY,
  rank integer NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_week_ranks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Week ranks are public" ON public.product_week_ranks;
CREATE POLICY "Week ranks are public" ON public.product_week_ranks FOR SELECT USING (true);
GRANT SELECT ON public.product_week_ranks TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_product_week_ranks()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH ranks AS (
    SELECT DISTINCT ON (product_id) product_id, rank
    FROM product_ranks
    WHERE award_type = 'week' AND product_id IS NOT NULL
    ORDER BY product_id, launch_date DESC
  ),
  upserted AS (
    INSERT INTO product_week_ranks AS w (product_id, rank)
    SELECT product_id, rank FROM ranks
    ON CONFLICT (product_id) DO UPDATE SET rank = EXCLUDED.rank, refreshed_at = now()
    WHERE w.rank IS DISTINCT FROM EXCLUDED.rank
    RETURNING 1
  )
  DELETE FROM product_week_ranks w WHERE NOT EXISTS (SELECT 1 FROM ranks r WHERE r.product_id = w.product_id);
$function$;
REVOKE EXECUTE ON FUNCTION public.refresh_product_week_ranks() FROM PUBLIC, anon, authenticated;

SELECT public.refresh_product_week_ranks();

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'refresh-product-week-ranks';
SELECT cron.schedule('refresh-product-week-ranks', '*/10 * * * *', 'SELECT public.refresh_product_week_ranks()');
