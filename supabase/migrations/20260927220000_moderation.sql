-- Submission moderation (set by the server with JEV on submit):
--   ok        normal launch
--   not_a_fit legit, but not a developer tool: no weekly competition and no free queue slot; can pay
--             for a listing with a dofollow backlink in the "Other" category
--   blocked   crypto / gambling / adult / fraud: hidden (deleted = true) until reviewed on Discord.
--             To unblock: UPDATE products SET moderation = 'ok', deleted = false WHERE id = ...
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moderation text NOT NULL DEFAULT 'ok';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_moderation_check;
ALTER TABLE public.products ADD CONSTRAINT products_moderation_check CHECK (moderation IN ('ok', 'not_a_fit', 'blocked'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moderation_reason text;

INSERT INTO public.product_categories (id, name)
SELECT (SELECT max(id) + 1 FROM public.product_categories), 'Other'
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories WHERE name = 'Other');

-- Weekly competition only includes ok tools; deleted tools no longer "win" a week (that week then
-- showed no winner at all).
CREATE OR REPLACE VIEW public.weekly_winners AS
 WITH rankedproducts AS (
         SELECT a.id,
            a.week,
            EXTRACT(year FROM a.launch_start) AS year,
            count(b.product_id) AS total_upvotes,
            row_number() OVER (PARTITION BY a.week, (EXTRACT(year FROM a.launch_start)) ORDER BY (count(b.product_id)) DESC, a.views_count DESC) AS rn
           FROM (products a
             JOIN product_votes b ON ((b.product_id = a.id)))
          WHERE a.launch_start <= CURRENT_DATE AND NOT a.deleted AND a.moderation = 'ok'
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

CREATE OR REPLACE FUNCTION public.get_prev_launch_weeks(_year integer, _start_day integer, _launch_week integer, _limit integer)
 RETURNS TABLE(week integer, start_date timestamp with time zone, end_date timestamp with time zone, products json)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$BEGIN
  RETURN QUERY
    SELECT
        p.week,
        weeks.start_date,
        weeks.end_date,
        json_agg(
          json_build_object(
            'product', p.*,
            'product_pricing_types', ppt.*,
            'product_categories',
              (SELECT json_agg(pc.*) FROM product_category_product pcp
              INNER JOIN product_categories pc ON pcp.category_id = pc.id
              WHERE p.id = pcp.product_id),
            'profile_name', profiles.full_name,
            'profile_id', profiles.id
          ) ORDER BY p.votes_count DESC, p.created_at ASC
        ) as products
      FROM
        products p
        JOIN get_weeks(_year, _start_day) as weeks ON weeks.week_number = p.week AND EXTRACT(YEAR FROM p.launch_start) = _year
        LEFT JOIN product_pricing_types ppt ON p.pricing_type = ppt.id
        LEFT JOIN profiles ON p.owner_id = profiles.id
      WHERE
        p.week <= _launch_week AND p.deleted = false AND p.moderation = 'ok'
      GROUP BY
        EXTRACT(YEAR FROM p.launch_start), p.week, weeks.start_date, weeks.end_date
      ORDER BY
        EXTRACT(YEAR FROM p.launch_start) DESC, p.week DESC
      LIMIT
        _limit;
END;$function$;

CREATE OR REPLACE FUNCTION public.get_next_launch_weeks(_year integer, _start_day integer, _launch_week integer, _limit integer)
 RETURNS TABLE(week integer, start_date timestamp with time zone, end_date timestamp with time zone, products json)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$BEGIN
  RETURN QUERY
    WITH all_weeks AS (
      SELECT _year AS week_year, w.week_number, w.start_date, w.end_date
      FROM get_weeks(_year, _start_day) w
      UNION ALL
      SELECT _year + 1 AS week_year, w.week_number, w.start_date, w.end_date
      FROM get_weeks(_year + 1, _start_day) w
    )
    SELECT
        p.week,
        weeks.start_date,
        weeks.end_date,
        json_agg(
          json_build_object(
            'product', p.*,
            'product_pricing_types', ppt.*,
            'product_categories',
              (SELECT json_agg(pc.*) FROM product_category_product pcp
              INNER JOIN product_categories pc ON pcp.category_id = pc.id
              WHERE p.id = pcp.product_id),
            'profile_name', profiles.full_name,
            'profile_id', profiles.id
          ) ORDER BY p.votes_count DESC, p.created_at ASC
        ) as products
      FROM
        products p
        JOIN all_weeks AS weeks
          ON weeks.week_number = p.week
          AND weeks.week_year = EXTRACT(YEAR FROM p.launch_start)::int
        LEFT JOIN product_pricing_types ppt ON p.pricing_type = ppt.id
        LEFT JOIN profiles ON p.owner_id = profiles.id
      WHERE
        p.deleted = false AND p.moderation = 'ok'
        AND (
          (EXTRACT(YEAR FROM p.launch_start)::int = _year AND p.week > _launch_week)
          OR EXTRACT(YEAR FROM p.launch_start)::int > _year
        )
      GROUP BY
        weeks.week_year, p.week, weeks.start_date, weeks.end_date
      ORDER BY
        weeks.week_year ASC, p.week ASC
      LIMIT
        _limit;
END;$function$;

-- Free-queue capacity only counts tools that compete.
CREATE OR REPLACE FUNCTION public.get_products_count_by_week(start_week integer, end_week integer, year_in integer, start_day integer)
 RETURNS TABLE(week_number integer, start_date timestamp with time zone, end_date timestamp with time zone, product_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    weeks.week_number,
    weeks.start_date,
    weeks.end_date,
    COALESCE(COUNT(products.id), 0)::integer AS product_count
  FROM
    generate_series(start_week, end_week) AS week_series(series)
  JOIN get_weeks(year_in, start_day) AS weeks
    ON weeks.week_number = week_series.series
  LEFT JOIN public.products
    ON  products.launch_start >= weeks.start_date
    AND products.launch_start <= weeks.end_date
    AND products.deleted = false
    AND products.moderation = 'ok'
  GROUP BY
    weeks.week_number,
    weeks.start_date,
    weeks.end_date
  ORDER BY
    weeks.week_number;
END;
$function$;

-- Owners can't change moderation fields or un-delete a blocked tool.
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
    OR (OLD.moderation = 'blocked' AND NEW.deleted IS DISTINCT FROM OLD.deleted)
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;
