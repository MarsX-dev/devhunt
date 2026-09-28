-- Sponsor ads in the admin analytics (/admin/analytics).
-- 1. The ad funnel records its steps in funnel_events as 'ad_*' steps; the submit funnel report
--    leaves them out.
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
    WHERE e.created_at >= _since AND e.created_at < _until AND e.step NOT LIKE 'ad\_%'
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

-- 2. Ads report for the period: the ad funnel (journeys joined across sign-in: a visitor's browser
--    steps and their signed-in server steps count as one), where /advertise visitors came from, every
--    ad generated (URL entered, who, outcome), live ads with impressions and clicks, and daily totals.
CREATE OR REPLACE FUNCTION public.get_ad_analytics(_since timestamptz)
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH vu AS (
    SELECT visitor_id, (array_agg(user_id ORDER BY created_at DESC))[1] AS user_id
    FROM funnel_events
    WHERE step LIKE 'ad\_%' AND visitor_id IS NOT NULL AND user_id IS NOT NULL
    GROUP BY visitor_id
  ),
  ev AS (
    SELECT e.*, coalesce(e.user_id::text, vu.user_id::text, e.visitor_id, 'e' || e.id::text) AS journey
    FROM funnel_events e LEFT JOIN vu ON vu.visitor_id = e.visitor_id
    WHERE e.step LIKE 'ad\_%' AND e.created_at >= _since
  ),
  gens AS (
    -- One generation = the rows one advertiser created in one go (one per ad type picked).
    SELECT a.user_id, a.created_at, min(a.url) AS url, min(a.name) AS name,
      array_agg(a.kind ORDER BY a.kind) AS kinds,
      bool_or(a.status = 'blocked') AS blocked,
      bool_or(a.started_at IS NOT NULL) AS paid,
      bool_or(a.status IN ('active', 'canceling')) AS live,
      min(a.moderation->>'topic') FILTER (WHERE a.status = 'blocked') AS topic
    FROM ad_slots a WHERE a.created_at >= _since
    GROUP BY a.user_id, a.created_at
  ),
  stats AS (
    SELECT ad_id, sum(impressions) AS impressions, sum(clicks) AS clicks,
      sum(impressions) FILTER (WHERE day >= (_since AT TIME ZONE 'utc')::date) AS impressions_range,
      sum(clicks) FILTER (WHERE day >= (_since AT TIME ZONE 'utc')::date) AS clicks_range
    FROM ad_stats_daily GROUP BY ad_id
  )
  SELECT json_build_object(
    'steps', (SELECT coalesce(json_object_agg(step, n), '{}') FROM (SELECT step, count(DISTINCT journey) AS n FROM ev GROUP BY step) s),
    'revenue', (SELECT coalesce(sum((props->>'amount')::numeric), 0) FROM ev WHERE step = 'ad_paid'),
    'sources', (SELECT coalesce(json_agg(t ORDER BY t.n DESC), '[]') FROM (
      SELECT coalesce(utm->>'ref', CASE WHEN referrer IS NOT NULL THEN 'site: ' || referrer END, props->>'from', 'direct') AS source,
        count(DISTINCT journey) AS n
      FROM ev WHERE step = 'ad_view' GROUP BY 1 ORDER BY 2 DESC LIMIT 15) t),
    'advertise_pageviews', (SELECT coalesce(sum(pageviews), 0) FROM analytics_pages WHERE path = '/advertise' AND day >= (_since AT TIME ZONE 'utc')::date),
    'generated', (SELECT coalesce(json_agg(t ORDER BY t.created_at DESC), '[]') FROM (
      SELECT g.created_at, g.url, g.name, g.kinds, g.blocked, g.paid, g.live, g.topic, u.email
      FROM gens g LEFT JOIN auth.users u ON u.id = g.user_id
      ORDER BY g.created_at DESC LIMIT 150) t),
    'generated_totals', (SELECT json_build_object(
        'generations', count(*), 'advertisers', count(DISTINCT user_id),
        'blocked', count(*) FILTER (WHERE blocked), 'paid', count(*) FILTER (WHERE paid)) FROM gens),
    'checkouts', (SELECT count(*) FROM payment_events WHERE event = 'ad_checkout_created' AND created_at >= _since),
    'live', (SELECT coalesce(json_agg(t ORDER BY t.kind, t.slot), '[]') FROM (
      SELECT a.id, a.kind, a.slot, a.name, a.tagline, a.url, a.plan, a.status, a.started_at, a.current_period_end, a.editions_left, u.email,
        coalesce(s.impressions, 0) AS impressions, coalesce(s.clicks, 0) AS clicks,
        coalesce(s.impressions_range, 0) AS impressions_range, coalesce(s.clicks_range, 0) AS clicks_range
      FROM ad_slots a
      LEFT JOIN auth.users u ON u.id = a.user_id
      LEFT JOIN stats s ON s.ad_id = a.id
      WHERE a.status IN ('active', 'canceling')) t),
    'daily', (SELECT coalesce(json_agg(t ORDER BY t.day), '[]') FROM (
      SELECT day, sum(impressions) AS impressions, sum(clicks) AS clicks
      FROM ad_stats_daily WHERE day >= (_since AT TIME ZONE 'utc')::date GROUP BY day) t),
    'ended', (SELECT count(*) FROM ad_slots WHERE status = 'ended' AND coalesce(canceled_at, current_period_end, created_at) >= _since),
    'refunded', (SELECT count(*) FROM ad_slots WHERE refunded_at >= _since)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_ad_analytics(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ad_analytics(timestamptz) TO service_role;
