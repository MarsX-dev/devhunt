-- Website health: tools whose website is dead (down, 404, domain expired) or hijacked (the domain
-- now shows something else: parked, for sale, spam, gambling...) are hidden from DevHunt. Only the
-- owner can still see them; everyone else gets a 404. Set by the health check (utils/server/siteHealth.ts),
-- which reports each change to Discord. To restore:
--   UPDATE products SET site_status = 'ok', site_status_reason = NULL WHERE id = ...;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS site_status text NOT NULL DEFAULT 'ok';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_site_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_site_status_check CHECK (site_status IN ('ok', 'dead', 'hijacked'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS site_status_reason text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS site_checked_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_products_site_status ON public.products (site_status) WHERE site_status <> 'ok';

DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Tools are public unless their website is dead or hijacked" ON public.products;
CREATE POLICY "Tools are public unless their website is dead or hijacked" ON public.products
  FOR SELECT USING (site_status = 'ok' OR owner_id = (SELECT auth.uid()));

-- Functions and views that bypass RLS filter hidden tools themselves.
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
    FROM product_votes v JOIN people p ON p.id = v.user_id JOIN products pr ON pr.id = v.product_id AND NOT pr.deleted AND pr.site_status = 'ok' AND pr.launch_start <= now()
    ORDER BY v.created_at DESC LIMIT 12
  ),
  commented AS (
    SELECT 'commented', c.created_at, p.name, p.avatar_url, p.username, pr.name, pr.slug
    FROM comment c JOIN people p ON p.id = c.user_id JOIN products pr ON pr.id = c.product_id AND NOT pr.deleted AND pr.site_status = 'ok' AND pr.launch_start <= now()
    WHERE NOT coalesce(c.deleted, false)
    ORDER BY c.created_at DESC LIMIT 6
  ),
  listed AS (
    SELECT 'listed', pr.created_at, p.name, p.avatar_url, p.username, pr.name, pr.slug
    FROM products pr JOIN people p ON p.id = pr.owner_id
    WHERE NOT pr.deleted AND pr.site_status = 'ok' AND pr.dev_tool_score >= 0.6 AND pr.created_at > now() - interval '14 days'
    ORDER BY pr.created_at DESC LIMIT 8
  ),
  events AS (
    SELECT * FROM joined UNION ALL SELECT * FROM voted UNION ALL SELECT * FROM commented UNION ALL SELECT * FROM listed
  )
  SELECT json_build_object(
    'events', (SELECT coalesce(json_agg(e ORDER BY e.at DESC), '[]'::json) FROM events e),
    'votes_today', (
      SELECT coalesce(json_object_agg(t.product_id, t.n), '{}'::json)
      FROM (
        SELECT v.product_id, count(*) AS n
        FROM product_votes v JOIN products pr ON pr.id = v.product_id
        WHERE v.created_at > now() - interval '24 hours' AND NOT pr.deleted AND pr.site_status = 'ok' AND pr.launch_start <= now() AND pr.launch_end >= now()
        GROUP BY v.product_id
      ) t
    ),
    'latest_comments', (
      SELECT coalesce(json_object_agg(t.product_id, json_build_object('name', t.name, 'avatar', t.avatar_url, 'content', t.content, 'at', t.created_at)), '{}'::json)
      FROM (
        SELECT DISTINCT ON (c.product_id) c.product_id, p.name, p.avatar_url, c.created_at,
          left(trim(regexp_replace(regexp_replace(c.content, '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')), 140) AS content
        FROM comment c JOIN people p ON p.id = c.user_id JOIN products pr ON pr.id = c.product_id
        WHERE c.parent_id IS NULL AND NOT coalesce(c.deleted, false) AND NOT pr.deleted AND pr.site_status = 'ok' AND pr.launch_start <= now() AND pr.launch_end >= now()
        ORDER BY c.product_id, c.created_at DESC
      ) t
      WHERE t.content <> ''
    )
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_category_counts()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT coalesce(json_agg(t ORDER BY t.count DESC, t.name), '[]'::json)
  FROM (
    SELECT c.id, c.name, count(p.id) AS count
    FROM product_categories c
    JOIN product_category_product pcp ON pcp.category_id = c.id
    JOIN products p ON p.id = pcp.product_id AND NOT p.deleted AND p.site_status = 'ok' AND p.launch_start <= now()
    GROUP BY c.id, c.name
  ) t
$function$;

CREATE OR REPLACE VIEW public.weekly_winners AS
 WITH rankedproducts AS (
         SELECT a.id,
            a.week,
            EXTRACT(year FROM a.launch_start) AS year,
            count(b.product_id) AS total_upvotes,
            row_number() OVER (PARTITION BY a.week, (EXTRACT(year FROM a.launch_start)) ORDER BY (count(b.product_id)) DESC, a.views_count DESC) AS rn
           FROM (products a
             JOIN product_votes b ON ((b.product_id = a.id)))
          WHERE a.launch_start <= CURRENT_DATE AND NOT a.deleted AND a.moderation = 'ok' AND a.site_status = 'ok'
          GROUP BY a.id, a.week, (EXTRACT(year FROM a.launch_start))
        ), productdata AS (
         SELECT p.id,
            p.week,
            EXTRACT(year FROM p.launch_start) AS year,
            json_build_object('product', p.*, 'product_pricing_types', ppt.*, 'product_categories', ( SELECT json_agg(pc.*) AS json_agg
                   FROM (product_category_product pcp
                     JOIN product_categories pc ON ((pcp.category_id = pc.id)))
                  WHERE (p.id = pcp.product_id)), 'profile_name', profiles.full_name, 'profile_id', profiles.id) AS product_data
           FROM ((products p
             LEFT JOIN product_pricing_types ppt ON ((p.pricing_type = ppt.id)))
             LEFT JOIN profiles ON ((p.owner_id = profiles.id)))
          WHERE (p.deleted = false)
        )
 SELECT rp.id,
    rp.week,
    rp.year,
    rp.total_upvotes,
    pd.product_data
   FROM (rankedproducts rp
     JOIN productdata pd ON (((rp.id = pd.id) AND (rp.week = pd.week) AND (rp.year = pd.year))))
  WHERE (rp.rn = 1)
  ORDER BY rp.year DESC, rp.week DESC;

CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
       NEW."isPaid" IS DISTINCT FROM OLD."isPaid"
    OR NEW.paid_launch_date IS DISTINCT FROM OLD.paid_launch_date
    OR NEW.launch_date IS DISTINCT FROM OLD.launch_date
    OR NEW.launch_start IS DISTINCT FROM OLD.launch_start
    OR NEW.launch_end IS DISTINCT FROM OLD.launch_end
    OR NEW.week IS DISTINCT FROM OLD.week
    OR NEW.votes_count IS DISTINCT FROM OLD.votes_count
    OR NEW.comments_count IS DISTINCT FROM OLD.comments_count
    OR NEW.views_count IS DISTINCT FROM OLD.views_count
    OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
    OR NEW.dev_tool_score IS DISTINCT FROM OLD.dev_tool_score
    OR NEW.enriched_at IS DISTINCT FROM OLD.enriched_at
    OR NEW.moderation IS DISTINCT FROM OLD.moderation
    OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
    OR NEW.site_status IS DISTINCT FROM OLD.site_status
    OR NEW.site_status_reason IS DISTINCT FROM OLD.site_status_reason
    OR NEW.site_checked_at IS DISTINCT FROM OLD.site_checked_at
    OR (OLD.moderation = 'blocked' AND NEW.deleted IS DISTINCT FROM OLD.deleted)
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;
