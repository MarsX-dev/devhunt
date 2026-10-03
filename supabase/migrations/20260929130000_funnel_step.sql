-- Who reached one step of the submit funnel (click a step on /admin/analytics): journeys (same key as
-- get_funnel) that hit _step in the period, with who they are, their tool and how far they got.
CREATE OR REPLACE FUNCTION public.get_funnel_step(_since timestamptz, _step text)
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH ev AS (
    SELECT e.*, coalesce(e.visitor_id, e.user_id::text, 'p' || e.product_id::text, 'e' || e.id::text) AS journey
    FROM funnel_events e
    WHERE e.created_at >= _since AND e.step NOT LIKE 'ad\_%'
  ),
  hit AS (SELECT DISTINCT journey FROM ev WHERE step = _step),
  journeys AS (
    SELECT ev.journey,
      min(created_at) FILTER (WHERE step = _step) AS step_at,
      max(created_at) AS last_at,
      array_agg(DISTINCT step) AS steps,
      (array_agg(country ORDER BY created_at) FILTER (WHERE country IS NOT NULL))[1] AS country,
      (array_agg(device ORDER BY created_at) FILTER (WHERE device IS NOT NULL))[1] AS device,
      (array_agg(referrer ORDER BY created_at) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
      (array_agg(user_id ORDER BY created_at DESC) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id,
      (array_agg(product_id ORDER BY created_at DESC) FILTER (WHERE product_id IS NOT NULL))[1] AS product_id,
      (array_agg(props->>'url' ORDER BY created_at DESC) FILTER (WHERE props ? 'url'))[1] AS url,
      (array_agg(props->>'error' ORDER BY created_at DESC) FILTER (WHERE props ? 'error'))[1] AS error,
      (array_agg(props->>'week' ORDER BY created_at DESC) FILTER (WHERE props ? 'week'))[1] AS week
    FROM ev JOIN hit USING (journey)
    GROUP BY ev.journey
  )
  SELECT coalesce(json_agg(j ORDER BY j.step_at DESC), '[]') FROM (
    SELECT jn.journey, jn.step_at, jn.last_at, jn.steps, jn.country, jn.device, jn.referrer, jn.url, jn.error, jn.week,
      pr.username, pr.full_name, u.email, p.name AS tool, p.slug AS tool_slug, p.demo_url AS website, p."isPaid" AS tool_paid, p.deleted AS tool_deleted
    FROM journeys jn
    LEFT JOIN profiles pr ON pr.id = jn.user_id
    LEFT JOIN auth.users u ON u.id = jn.user_id
    LEFT JOIN products p ON p.id = jn.product_id
    ORDER BY jn.step_at DESC LIMIT 200) j
$function$;
REVOKE EXECUTE ON FUNCTION public.get_funnel_step(timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel_step(timestamptz, text) TO service_role;
