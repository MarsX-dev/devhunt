-- Well-known past winners, shown shuffled in "Featured winners" on the home page.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured) WHERE is_featured;

UPDATE public.products SET is_featured = true
WHERE NOT deleted AND slug IN (
  'daytona', 'gitbutler-', 'dokploy', 'huly', 'shuttle', 'pieces-copilot', 'toddle', 'livecodes', 'devzero',
  'neurelo', 'voice-calling-sdk-by-dyte', 'tailus-react', 'float-ui-v2', 'staticapp', 'pulsetic', 'fluent-ci',
  'deployhq', 'bunkerweb', 'indie-kit-nextjs', 'openobserve', 'octomind', 'edgeone-makers', 'kombai-research-preview',
  'servbay', 'cyclops', 'releem', 'codehooksio', 'metatype'
);

-- Owners must not be able to feature their own tool.
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
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;
