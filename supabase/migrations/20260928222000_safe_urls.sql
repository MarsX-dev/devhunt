-- Links stored for tools and profiles are opened by visitors, so they may never carry a script scheme.
-- Browsers ignore whitespace and control characters inside a URL scheme, so those are stripped first.
CREATE OR REPLACE FUNCTION public.is_safe_url(u text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
  SELECT u IS NULL OR regexp_replace(lower(u), '[[:space:][:cntrl:]]', '', 'g') !~ '^(javascript|data|vbscript|file|blob):'
$function$;

CREATE OR REPLACE FUNCTION public.are_safe_urls(us text[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT us IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(us) AS u WHERE NOT public.is_safe_url(u))
$function$;

ALTER TABLE public.products
  ADD CONSTRAINT products_demo_url_safe CHECK (public.is_safe_url(demo_url)),
  ADD CONSTRAINT products_github_url_safe CHECK (public.is_safe_url(github_url)),
  ADD CONSTRAINT products_demo_video_url_safe CHECK (public.is_safe_url(demo_video_url)),
  ADD CONSTRAINT products_logo_url_safe CHECK (public.is_safe_url(logo_url)),
  ADD CONSTRAINT products_asset_urls_safe CHECK (public.are_safe_urls(asset_urls));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_website_url_safe CHECK (public.is_safe_url(website_url)),
  ADD CONSTRAINT profiles_social_url_safe CHECK (public.is_safe_url(social_url)),
  ADD CONSTRAINT profiles_avatar_url_safe CHECK (public.is_safe_url(avatar_url));
