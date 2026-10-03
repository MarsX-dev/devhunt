-- Search for the command palette: ranked (exact name, name prefix, name contains, tagline contains;
-- ties by votes) and only the columns the palette shows. Public data, runs as the caller.
CREATE OR REPLACE FUNCTION public.search_tools(q text, max_results integer DEFAULT 8)
 RETURNS TABLE (id bigint, slug text, name varchar, slogan varchar, logo_url varchar, votes_count bigint, launch_start timestamptz)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH term AS (SELECT lower(trim(q)) AS t)
  SELECT p.id, p.slug, p.name, p.slogan, p.logo_url, p.votes_count, p.launch_start
  FROM products p, term
  WHERE NOT p.deleted
    AND length(term.t) >= 1
    AND (p.name ILIKE '%' || term.t || '%' OR p.slogan ILIKE '%' || term.t || '%')
  ORDER BY
    CASE
      WHEN lower(p.name) = term.t THEN 0
      WHEN lower(p.name) LIKE term.t || '%' THEN 1
      WHEN lower(p.name) LIKE '%' || term.t || '%' THEN 2
      ELSE 3
    END,
    p.votes_count DESC NULLS LAST
  LIMIT least(greatest(max_results, 1), 20)
$function$;
GRANT EXECUTE ON FUNCTION public.search_tools(text, integer) TO anon, authenticated;

-- Trigram indexes so '%term%' matches on name and tagline use an index (38ms -> <1ms).
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_slogan_trgm ON public.products USING gin (slogan extensions.gin_trgm_ops);
