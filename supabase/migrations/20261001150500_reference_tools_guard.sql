-- Only DevHunt (service role) marks a tool as a reference listing: guarded on update, refused on client insert.
CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
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
    OR NEW.is_reference IS DISTINCT FROM OLD.is_reference
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.guard_product_reference_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NEW.is_reference THEN
    RAISE EXCEPTION 'Only DevHunt can add reference listings' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS products_guard_reference_insert ON public.products;
CREATE TRIGGER products_guard_reference_insert BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_reference_insert();
REVOKE EXECUTE ON FUNCTION public.guard_product_reference_insert() FROM PUBLIC, anon, authenticated;
