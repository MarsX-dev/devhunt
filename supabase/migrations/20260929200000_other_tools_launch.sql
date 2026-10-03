-- "Other" tools (moderation = 'not_a_fit': legit, but not for developers or builders) now launch too,
-- without competing: they get a week in a compact "Also launching this week" list on the home page,
-- their own free queue (10 a week, so they don't take the dev tools' free slots) and no voting.

-- 1. They never rank: winner_of_the_day feeds the week and month winners, badges and winner emails.
CREATE OR REPLACE VIEW public.winner_of_the_day AS
 WITH ranked_products AS (
         SELECT p.id AS product_id,
            p.launch_date AS day,
            count(product_votes.user_id) AS votes_count,
            row_number() OVER (PARTITION BY p.launch_date ORDER BY (count(product_votes.user_id)) DESC) AS rank
           FROM products p
             LEFT JOIN product_votes ON p.id = product_votes.product_id AND product_votes.created_at >= p.launch_start AND product_votes.created_at <= p.launch_end
          WHERE p.deleted = false AND p.moderation <> 'not_a_fit'
          GROUP BY p.id, p.launch_date
        )
 SELECT ranked_products.product_id,
    ranked_products.day,
    COALESCE(ranked_products.votes_count, 0::bigint) AS launch_votes_count,
    ranked_products.rank,
    products.name,
    products.slug,
    products.description,
    products.votes_count,
    products.logo_url,
    products.launch_date,
    products.launch_start,
    products.launch_end,
    products.launch_description,
    products.slogan,
    ( SELECT array_agg(product_categories.name) AS array_agg
           FROM product_categories
             JOIN product_category_product ON ranked_products.product_id = product_category_product.product_id AND product_category_product.category_id = product_categories.id) AS product_categories,
    ( SELECT product_pricing_types.title
           FROM product_pricing_types
          WHERE products.pricing_type = product_pricing_types.id) AS product_pricing
   FROM ranked_products
     JOIN products ON ranked_products.product_id = products.id
  ORDER BY ranked_products.day DESC, ranked_products.rank;

-- 2. No votes on them (the maker's own starting vote is inserted server-side on submit).
CREATE OR REPLACE FUNCTION public."toggleProductVote"(_product_id bigint, _user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  -- Not launched yet, or an "other" tool (they don't compete): nothing to toggle.
  IF (SELECT launch_date > NOW() OR moderation = 'not_a_fit' FROM public.products WHERE id = _product_id) THEN
    RETURN (SELECT votes_count FROM public.products WHERE id = _product_id);
  END IF;

  IF (SELECT EXISTS (SELECT 1 FROM public.product_votes WHERE product_id = _product_id AND user_id = _user_id)) THEN
    DELETE FROM public.product_votes WHERE product_id = _product_id AND user_id = _user_id;
  ELSE
    INSERT INTO public.product_votes(product_id, user_id) VALUES (_product_id, _user_id);
  END IF;

  UPDATE public.products SET votes_count = (SELECT COUNT(*) FROM public.product_votes WHERE product_id = _product_id) WHERE id = _product_id;

  RETURN (SELECT votes_count FROM public.products WHERE id = _product_id);
END$function$;

-- 3. Week counts for one moderation class, so each queue has its own capacity. Server only.
CREATE OR REPLACE FUNCTION public.get_launch_week_counts(start_week integer, end_week integer, year_in integer, start_day integer, _moderation text)
 RETURNS TABLE(week_number integer, start_date timestamp with time zone, end_date timestamp with time zone, product_count integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT weeks.week_number, weeks.start_date, weeks.end_date, COUNT(products.id)::integer
  FROM generate_series(start_week, end_week) AS week_series(series)
  JOIN get_weeks(year_in, start_day) AS weeks ON weeks.week_number = week_series.series
  LEFT JOIN public.products
    ON products.launch_start >= weeks.start_date
   AND products.launch_start <= weeks.end_date
   AND products.deleted = false
   AND products.moderation = _moderation
  GROUP BY weeks.week_number, weeks.start_date, weeks.end_date
  ORDER BY weeks.week_number;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_launch_week_counts(integer, integer, integer, integer, text) FROM PUBLIC, anon, authenticated;

-- 4. The "other" tools already waiting (parked in 2027-2029) move into their own queue: 10 a week
-- from the week of Oct 6, oldest submission first. Old dates are kept in a backup table.
CREATE TABLE IF NOT EXISTS public.other_tools_requeue_backup AS
SELECT id, launch_date, launch_start, launch_end, week, now() AS backed_up_at
FROM public.products
WHERE moderation = 'not_a_fit' AND deleted = false AND NOT "isPaid" AND launch_start > '2026-10-06';
ALTER TABLE public.other_tools_requeue_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.other_tools_requeue_backup FROM anon, authenticated;

WITH queued AS (
  SELECT b.id, (row_number() OVER (ORDER BY p.created_at, p.id) - 1) / 10 AS offset_weeks
  FROM public.other_tools_requeue_backup b JOIN public.products p ON p.id = b.id
),
target AS (
  SELECT q.id, w.week_number, w.start_date, w.end_date
  FROM queued q
  JOIN get_weeks(2026, 2) w ON w.start_date = ('2026-10-06'::date + (q.offset_weeks * 7)::int)::timestamp AT TIME ZONE 'UTC'
)
UPDATE public.products p
SET launch_date = t.start_date, launch_start = t.start_date, launch_end = t.end_date, week = t.week_number
FROM target t
WHERE p.id = t.id;
