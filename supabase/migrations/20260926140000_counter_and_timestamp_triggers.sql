-- Keep denormalized counters in sync with their source tables, and backfill them.

-- products.comments_count = number of non-deleted comments (it was never maintained).
CREATE OR REPLACE FUNCTION public.sync_product_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  _ids bigint[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    _ids := ARRAY[NEW.product_id];
  ELSIF TG_OP = 'DELETE' THEN
    _ids := ARRAY[OLD.product_id];
  ELSE
    _ids := ARRAY[OLD.product_id, NEW.product_id];
  END IF;

  UPDATE public.products p
  SET comments_count = (SELECT count(*) FROM public.comment c WHERE c.product_id = p.id AND NOT coalesce(c.deleted, false))
  WHERE p.id = ANY (_ids);
  RETURN NULL;
END
$function$;

DROP TRIGGER IF EXISTS comment_sync_product_comments_count ON public.comment;
CREATE TRIGGER comment_sync_product_comments_count
  AFTER INSERT OR DELETE OR UPDATE OF deleted, product_id ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_comments_count();

-- products.votes_count: toggleProductVote recounts, but votes inserted directly (allowed by RLS
-- for the voter themselves) never updated the counter.
CREATE OR REPLACE FUNCTION public.sync_product_votes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  _product_id bigint := CASE WHEN TG_OP = 'DELETE' THEN OLD.product_id ELSE NEW.product_id END;
BEGIN
  UPDATE public.products
  SET votes_count = (SELECT count(*) FROM public.product_votes v WHERE v.product_id = _product_id)
  WHERE id = _product_id;
  RETURN NULL;
END
$function$;

DROP TRIGGER IF EXISTS product_votes_sync_votes_count ON public.product_votes;
CREATE TRIGGER product_votes_sync_votes_count
  AFTER INSERT OR DELETE ON public.product_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_votes_count();

-- profiles.updated_at was never bumped on edits.
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- Backfill (only rows that are actually wrong).
UPDATE public.products p
SET comments_count = x.n
FROM (
  SELECT p2.id, (SELECT count(*) FROM public.comment c WHERE c.product_id = p2.id AND NOT coalesce(c.deleted, false)) AS n
  FROM public.products p2
) x
WHERE x.id = p.id AND p.comments_count IS DISTINCT FROM x.n;

UPDATE public.products p
SET votes_count = x.n
FROM (
  SELECT p2.id, (SELECT count(*) FROM public.product_votes v WHERE v.product_id = p2.id) AS n
  FROM public.products p2
) x
WHERE x.id = p.id AND p.votes_count IS DISTINCT FROM x.n;
