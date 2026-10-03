-- Tool profiles: an AI-written, fact-checked fact sheet per tool (features, use cases, pricing,
-- FAQ, alternatives), generated once from the tool's website. Public read; written by the server.
CREATE TABLE IF NOT EXISTS public.tool_profiles (
  product_id bigint PRIMARY KEY REFERENCES public.products (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed', 'hidden')),
  data jsonb,
  sources text[] NOT NULL DEFAULT '{}',
  error text,
  attempts integer NOT NULL DEFAULT 0,
  generated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tool_profiles_status ON public.tool_profiles (status);

ALTER TABLE public.tool_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tool_profiles FROM anon, authenticated;
GRANT SELECT ON public.tool_profiles TO anon, authenticated;
DROP POLICY IF EXISTS "ready tool profiles are public" ON public.tool_profiles;
CREATE POLICY "ready tool profiles are public" ON public.tool_profiles FOR SELECT USING (status = 'ready');

-- Claims a tool for generation (server only): true when there's no profile yet, or the last try
-- failed more than a week ago, or a 'pending' claim is stale (the run died). Prevents duplicate runs.
CREATE OR REPLACE FUNCTION public.claim_tool_profile(_product_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE claimed boolean;
BEGIN
  INSERT INTO tool_profiles AS t (product_id, status, attempts, updated_at)
  VALUES (_product_id, 'pending', 1, now())
  ON CONFLICT (product_id) DO UPDATE SET status = 'pending', attempts = t.attempts + 1, updated_at = now()
  WHERE (t.status = 'failed' AND t.updated_at < now() - interval '7 days' AND t.attempts < 3)
     OR (t.status = 'pending' AND t.updated_at < now() - interval '10 minutes')
  RETURNING true INTO claimed;
  RETURN coalesce(claimed, false);
END
$function$;
REVOKE EXECUTE ON FUNCTION public.claim_tool_profile(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_tool_profile(bigint) TO service_role;
