-- Paid launches come in two tiers: $19 (1) and $49 boost (2); free launches are 0. Lists of a launch
-- week stay ordered by votes; the tier only breaks ties (so at the start of a week, when every tool
-- has its maker's vote, boosted tools come first, then $19, then free). The weekly email uses the same order.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS launch_tier smallint NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.products.launch_tier IS '0 free, 1 paid ($19, no boost), 2 boosted ($49). Set by the server after Stripe confirms.';

-- Every paid launch so far was the $49 launch.
UPDATE public.products SET launch_tier = 2 WHERE "isPaid" = true AND launch_tier = 0;

CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
       NEW."isPaid" IS DISTINCT FROM OLD."isPaid"
    OR NEW.launch_tier IS DISTINCT FROM OLD.launch_tier
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
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

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
          ) ORDER BY p.votes_count DESC, p.launch_tier DESC, p.created_at ASC
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
          ) ORDER BY p.votes_count DESC, p.launch_tier DESC, p.created_at ASC
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
