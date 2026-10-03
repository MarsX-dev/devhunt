-- Products are created server-side (/api/tools, service role) since the Stripe Checkout release.
-- Users could previously insert products directly (choosing any launch week or isPaid) and update
-- payment/launch/counter fields on their own tools.

-- 1) No direct inserts from the public API.
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;

-- 2) Owners may still edit their tool's content, but not these fields. The service role and
--    SECURITY DEFINER functions (vote/comment counters, view counter, launch-time trigger) run as
--    other roles and are unaffected.
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
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE EXECUTE ON FUNCTION public.guard_product_protected_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS products_guard_protected_fields ON public.products;
CREATE TRIGGER products_guard_protected_fields
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_protected_fields();
