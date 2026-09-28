-- One log of every moderation decision that stopped or downgraded something (refused or blocked tool
-- submissions and edits, "not a dev tool", shadow-blocked comments, refused sponsor ads and ad edits).
-- Written by server code only (utils/server/moderationLog.ts); shown on /admin/analytics. Each entry
-- also goes to Discord.
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL, -- tool_submission | tool_edit | comment | comment_edit | ad | ad_edit
  action text NOT NULL, -- refused (nothing saved) | blocked (saved, hidden) | not_a_fit | shadow
  reason text,
  subject text, -- tool / ad name, or the comment's tool
  url text,
  user_id uuid,
  product_id bigint,
  score numeric,
  details jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS moderation_log_created ON public.moderation_log (created_at DESC);
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.moderation_log FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.moderation_log_id_seq FROM anon, authenticated;

-- Backfill what's already known: blocked and "not a dev tool" submissions, refused ads.
INSERT INTO public.moderation_log (created_at, kind, action, reason, subject, url, user_id, product_id, score)
SELECT created_at, 'tool_submission', CASE WHEN moderation = 'blocked' THEN 'blocked' ELSE 'not_a_fit' END,
  moderation_reason, name, demo_url, owner_id, id, dev_tool_score
FROM public.products
WHERE moderation IN ('blocked', 'not_a_fit')
  AND NOT EXISTS (SELECT 1 FROM public.moderation_log);
INSERT INTO public.moderation_log (created_at, kind, action, reason, subject, url, user_id, score)
SELECT min(created_at), 'ad', 'refused', min(moderation->>'topic'), min(name), min(url), user_id, max((moderation->>'probability')::numeric)
FROM public.ad_slots
WHERE status = 'blocked'
  AND NOT EXISTS (SELECT 1 FROM public.moderation_log WHERE kind = 'ad')
GROUP BY user_id, created_at;

-- Report for /admin/analytics: counts per kind/action and the latest entries with who did it.
CREATE OR REPLACE FUNCTION public.get_moderation_log(_since timestamptz)
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT json_build_object(
    'counts', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT kind, action, count(*) AS n FROM moderation_log WHERE created_at >= _since GROUP BY 1, 2 ORDER BY 3 DESC) t),
    'entries', (SELECT coalesce(json_agg(t ORDER BY t.created_at DESC), '[]') FROM (
      SELECT m.id, m.created_at, m.kind, m.action, m.reason, m.subject, m.url, m.score, m.details, u.email, p.slug
      FROM moderation_log m
      LEFT JOIN auth.users u ON u.id = m.user_id
      LEFT JOIN products p ON p.id = m.product_id AND NOT p.deleted
      WHERE m.created_at >= _since
      ORDER BY m.created_at DESC LIMIT 150) t)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_moderation_log(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_log(timestamptz) TO service_role;
