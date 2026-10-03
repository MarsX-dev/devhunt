-- Per-key request limits for endpoints that cost money (AI, scraping, email) or write rows.
-- One row per key (e.g. 'import:<user id>', 'profile-gen:ip:<ip>'); only the server (service role) calls it.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Counts one request for _key and says whether it's within _max per _window_seconds.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(_key text, _max integer, _window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  n integer;
BEGIN
  INSERT INTO rate_limits AS r (key, window_start, count) VALUES (_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN r.window_start < now() - make_interval(secs => _window_seconds) THEN 1 ELSE r.count + 1 END,
    window_start = CASE WHEN r.window_start < now() - make_interval(secs => _window_seconds) THEN now() ELSE r.window_start END
  RETURNING count INTO n;
  RETURN n <= _max;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- Old windows are just noise: clear them daily.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'clear-rate-limits';
SELECT cron.schedule('clear-rate-limits', '17 3 * * *', $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days'$$);
