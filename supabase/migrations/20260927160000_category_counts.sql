-- Launched tools per category, for the home page's "browse by category" grid.
-- Server-only (service role), cached by the app for an hour.
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
    JOIN products p ON p.id = pcp.product_id AND NOT p.deleted AND p.launch_start <= now()
    GROUP BY c.id, c.name
  ) t
$function$;
REVOKE EXECUTE ON FUNCTION public.get_category_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO service_role;
