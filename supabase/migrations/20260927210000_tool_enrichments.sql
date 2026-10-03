-- "Rich launch page" for paid tools: awards on other launchpads, review quotes, mentions around the
-- web and highlights, found by the server (Firecrawl search + JEV relevance + Groq extraction).
-- Everything starts as 'pending'; the tool owner approves or hides each item. Only approved items
-- are public.
CREATE TABLE IF NOT EXISTS public.tool_enrichments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('award', 'review', 'mention', 'highlight')),
  title text NOT NULL,
  body text,
  url text,
  source text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, kind, title)
);
CREATE INDEX IF NOT EXISTS idx_tool_enrichments_product ON public.tool_enrichments (product_id, status);

ALTER TABLE public.tool_enrichments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tool_enrichments FROM anon, authenticated;
GRANT SELECT ON public.tool_enrichments TO anon, authenticated;
GRANT UPDATE (status) ON public.tool_enrichments TO authenticated;

DROP POLICY IF EXISTS "Approved items are public" ON public.tool_enrichments;
CREATE POLICY "Approved items are public" ON public.tool_enrichments FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Owners see their items" ON public.tool_enrichments;
CREATE POLICY "Owners see their items" ON public.tool_enrichments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Owners approve or hide their items" ON public.tool_enrichments;
CREATE POLICY "Owners approve or hide their items" ON public.tool_enrichments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.owner_id = (SELECT auth.uid())))
  WITH CHECK (status IN ('pending', 'approved', 'hidden'));

CREATE OR REPLACE FUNCTION public.touch_tool_enrichment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.touch_tool_enrichment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS tool_enrichments_touch ON public.tool_enrichments;
CREATE TRIGGER tool_enrichments_touch BEFORE UPDATE ON public.tool_enrichments FOR EACH ROW EXECUTE FUNCTION public.touch_tool_enrichment();

-- When the last web search ran for a tool (rate limit); set by the server only.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

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
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;
