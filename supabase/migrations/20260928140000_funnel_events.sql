-- Submit/launch funnel: one row per step a visitor reaches (see utils/funnel.ts for the steps).
-- Written by the server only (/api/funnel for browser steps, API routes and the Stripe webhook for
-- the rest). visitor_id/session_id are first-party random ids from the dh_vid/dh_sid cookies.
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  step text NOT NULL,
  visitor_id text,
  session_id text,
  user_id uuid,
  product_id bigint,
  country text,
  device text,
  referrer text,
  utm jsonb,
  props jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON public.funnel_events (created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_events_visitor ON public.funnel_events (visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_events_product ON public.funnel_events (product_id) WHERE product_id IS NOT NULL;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.funnel_events FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.funnel_events_id_seq FROM anon, authenticated;

-- Funnel report (server only): per step, unique journeys (visitor, else user, else product) that
-- reached it in the period; by country; and the latest journeys with who they are and how far they got.
CREATE OR REPLACE FUNCTION public.get_funnel(_since timestamptz, _until timestamptz DEFAULT now())
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH ev AS (
    SELECT e.*, coalesce(e.visitor_id, e.user_id::text, 'p' || e.product_id::text, 'e' || e.id::text) AS journey
    FROM funnel_events e
    WHERE e.created_at >= _since AND e.created_at < _until
  ),
  journeys AS (
    SELECT journey,
      min(created_at) AS started_at,
      max(created_at) AS last_at,
      array_agg(DISTINCT step) AS steps,
      (array_agg(country ORDER BY created_at) FILTER (WHERE country IS NOT NULL))[1] AS country,
      (array_agg(device ORDER BY created_at) FILTER (WHERE device IS NOT NULL))[1] AS device,
      (array_agg(referrer ORDER BY created_at) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
      (array_agg(user_id ORDER BY created_at DESC) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id,
      (array_agg(product_id ORDER BY created_at DESC) FILTER (WHERE product_id IS NOT NULL))[1] AS product_id,
      (array_agg(props->>'url' ORDER BY created_at DESC) FILTER (WHERE props ? 'url'))[1] AS url,
      (array_agg(props->>'error' ORDER BY created_at DESC) FILTER (WHERE props ? 'error'))[1] AS error,
      sum(coalesce((props->>'amount')::numeric, 0)) FILTER (WHERE step = 'paid') AS revenue
    FROM ev GROUP BY journey
  )
  SELECT json_build_object(
    'steps', (SELECT coalesce(json_object_agg(step, n), '{}') FROM (SELECT step, count(DISTINCT journey) AS n FROM ev GROUP BY step) s),
    'countries', (SELECT coalesce(json_agg(c ORDER BY c.journeys DESC), '[]') FROM (
      SELECT coalesce(country, 'XX') AS country, count(*) AS journeys,
        count(*) FILTER (WHERE 'tool_created' = ANY(steps)) AS created,
        count(*) FILTER (WHERE 'checkout_started' = ANY(steps)) AS checkout,
        count(*) FILTER (WHERE 'paid' = ANY(steps)) AS paid
      FROM journeys GROUP BY 1 ORDER BY 2 DESC LIMIT 15) c),
    'revenue', (SELECT coalesce(sum(revenue), 0) FROM journeys),
    'journeys', (SELECT coalesce(json_agg(j ORDER BY j.last_at DESC), '[]') FROM (
      SELECT jn.journey, jn.started_at, jn.last_at, jn.steps, jn.country, jn.device, jn.referrer, jn.url, jn.error,
        pr.username, pr.full_name, u.email, p.name AS tool, p.slug AS tool_slug
      FROM journeys jn
      LEFT JOIN profiles pr ON pr.id = jn.user_id
      LEFT JOIN auth.users u ON u.id = jn.user_id
      LEFT JOIN products p ON p.id = jn.product_id
      ORDER BY jn.last_at DESC LIMIT 60) j)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_funnel(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel(timestamptz, timestamptz) TO service_role;

-- Daily funnel counts for the trend chart (server only).
CREATE OR REPLACE FUNCTION public.get_funnel_daily(_days integer)
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT coalesce(json_agg(t ORDER BY t.day, t.step), '[]') FROM (
    SELECT (created_at AT TIME ZONE 'utc')::date AS day, step,
      count(DISTINCT coalesce(visitor_id, user_id::text, 'p' || product_id::text, 'e' || id::text)) AS n
    FROM funnel_events
    WHERE created_at >= (now() AT TIME ZONE 'utc')::date - (_days - 1)
    GROUP BY 1, 2
  ) t
$function$;
REVOKE EXECUTE ON FUNCTION public.get_funnel_daily(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel_daily(integer) TO service_role;
