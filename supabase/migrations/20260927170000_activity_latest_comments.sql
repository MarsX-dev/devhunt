-- Adds each current contestant's latest top-level comment (first name, avatar, text without HTML,
-- max 140 characters) to get_recent_activity(), for the arriving-comment bubbles on the home page.
-- Comments are already public on the tool pages.
CREATE OR REPLACE FUNCTION public.get_recent_activity()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH people AS (
    SELECT id, username, avatar_url, split_part(trim(coalesce(nullif(trim(full_name), ''), username)), ' ', 1) AS name
    FROM profiles
    WHERE avatar_url IS NOT NULL AND coalesce(nullif(trim(full_name), ''), username) IS NOT NULL
  ),
  joined AS (
    SELECT 'joined'::text AS type, u.created_at AS at, p.name, p.avatar_url AS avatar, p.username, NULL::text AS tool, NULL::text AS slug
    FROM auth.users u JOIN people p ON p.id = u.id
    ORDER BY u.created_at DESC LIMIT 12
  ),
  voted AS (
    SELECT 'upvoted', v.created_at, p.name, p.avatar_url, p.username, pr.name, pr.slug
    FROM product_votes v JOIN people p ON p.id = v.user_id JOIN products pr ON pr.id = v.product_id AND NOT pr.deleted AND pr.launch_start <= now()
    ORDER BY v.created_at DESC LIMIT 12
  ),
  commented AS (
    SELECT 'commented', c.created_at, p.name, p.avatar_url, p.username, pr.name, pr.slug
    FROM comment c JOIN people p ON p.id = c.user_id JOIN products pr ON pr.id = c.product_id AND NOT pr.deleted AND pr.launch_start <= now()
    WHERE NOT coalesce(c.deleted, false)
    ORDER BY c.created_at DESC LIMIT 6
  ),
  events AS (
    SELECT * FROM joined UNION ALL SELECT * FROM voted UNION ALL SELECT * FROM commented
  )
  SELECT json_build_object(
    'events', (SELECT coalesce(json_agg(e ORDER BY e.at DESC), '[]'::json) FROM events e),
    'votes_today', (
      SELECT coalesce(json_object_agg(t.product_id, t.n), '{}'::json)
      FROM (
        SELECT v.product_id, count(*) AS n
        FROM product_votes v JOIN products pr ON pr.id = v.product_id
        WHERE v.created_at > now() - interval '24 hours' AND NOT pr.deleted AND pr.launch_start <= now() AND pr.launch_end >= now()
        GROUP BY v.product_id
      ) t
    ),
    'latest_comments', (
      SELECT coalesce(json_object_agg(t.product_id, json_build_object('name', t.name, 'avatar', t.avatar_url, 'content', t.content, 'at', t.created_at)), '{}'::json)
      FROM (
        SELECT DISTINCT ON (c.product_id) c.product_id, p.name, p.avatar_url, c.created_at,
          left(trim(regexp_replace(regexp_replace(c.content, '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')), 140) AS content
        FROM comment c JOIN people p ON p.id = c.user_id JOIN products pr ON pr.id = c.product_id
        WHERE c.parent_id IS NULL AND NOT coalesce(c.deleted, false) AND NOT pr.deleted AND pr.launch_start <= now() AND pr.launch_end >= now()
        ORDER BY c.product_id, c.created_at DESC
      ) t
      WHERE t.content <> ''
    )
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_recent_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activity() TO service_role;
