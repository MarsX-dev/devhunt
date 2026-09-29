-- Public /stats page (open numbers for makers and advertisers): the last 30 days, day by day, plus
-- all-time totals, in one round trip. Server-only; the page caches the result for 10 minutes.
-- *_since say when each counter started, so the page can show earlier days as "not tracked yet".
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH today AS (SELECT (now() AT TIME ZONE 'utc')::date AS d),
  days AS (SELECT generate_series((SELECT d FROM today) - 29, (SELECT d FROM today), interval '1 day')::date AS day),
  visits AS (
    SELECT day, sum(visitors) AS visitors, sum(pageviews) AS pageviews, sum(new_visitors) AS new_visitors
    FROM analytics_daily WHERE day >= (SELECT d FROM today) - 29 GROUP BY day),
  impressions AS (SELECT day, sum(views) AS views FROM site_daily_views WHERE day >= (SELECT d FROM today) - 29 GROUP BY day),
  ads AS (
    SELECT day, sum(impressions) FILTER (WHERE device <> 'email') AS web, sum(impressions) FILTER (WHERE device = 'email') AS email
    FROM ad_stats_daily WHERE day >= (SELECT d FROM today) - 29 GROUP BY day),
  launches AS (
    SELECT (launch_start AT TIME ZONE 'utc')::date AS day, count(*) AS n
    FROM products WHERE NOT deleted AND launch_start >= (SELECT d FROM today) - 29 AND launch_start <= now() GROUP BY 1),
  signups AS (
    SELECT (created_at AT TIME ZONE 'utc')::date AS day, count(*) AS n
    FROM auth.users WHERE created_at >= (SELECT d FROM today) - 29 GROUP BY 1),
  users_before AS (SELECT count(*) AS n FROM auth.users WHERE created_at < (SELECT d FROM today) - 29)
  SELECT json_build_object(
    'daily', (SELECT json_agg(t ORDER BY t.day) FROM (
      SELECT d.day,
        coalesce(v.visitors, 0) AS visitors, coalesce(v.pageviews, 0) AS pageviews, coalesce(v.new_visitors, 0) AS new_visitors,
        coalesce(i.views, 0) AS tool_impressions,
        coalesce(a.web, 0) AS ad_impressions_web, coalesce(a.email, 0) AS ad_impressions_email,
        coalesce(l.n, 0) AS launches, coalesce(s.n, 0) AS signups,
        (SELECT n FROM users_before) + sum(coalesce(s.n, 0)) OVER (ORDER BY d.day) AS users
      FROM days d
      LEFT JOIN visits v USING (day) LEFT JOIN impressions i USING (day) LEFT JOIN ads a USING (day)
      LEFT JOIN launches l USING (day) LEFT JOIN signups s USING (day)) t),
    'countries', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT country, sum(visitors) AS visitors
      FROM analytics_daily WHERE day >= (SELECT d FROM today) - 29 AND country <> 'XX'
      GROUP BY country ORDER BY sum(visitors) DESC LIMIT 12) t),
    'visitors_since', (SELECT min(day) FROM analytics_daily),
    'impressions_since', (SELECT min(day) FROM site_daily_views),
    'ads_since', (SELECT min(day) FROM ad_stats_daily),
    'unique_visitors_all_time', 452356 + (SELECT coalesce(sum(new_visitors), 0) FROM analytics_daily),
    'tool_impressions_all_time', (SELECT coalesce(sum(views_count), 0) FROM products WHERE NOT deleted),
    'tools_launched', (SELECT count(*) FROM products WHERE NOT deleted AND launch_start <= now()),
    'users', (SELECT count(*) FROM auth.users),
    -- What one launch gets: impressions of tools whose launch week ended in the last 90 days.
    'launch_impressions_median', (SELECT coalesce(percentile_cont(0.5) WITHIN GROUP (ORDER BY views_count), 0)::int
      FROM products WHERE NOT deleted AND launch_end < now() AND launch_start > now() - interval '90 days'),
    'first_launch', (SELECT min(launch_start) FROM products WHERE NOT deleted)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO service_role;
