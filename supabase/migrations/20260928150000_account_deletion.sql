-- Deleting tools and accounts (done by /api/tools/[id]/delete and /api/account/delete, service role).
--   Tools: soft-deleted (products.deleted), rows kept so votes, comments and winners stay consistent.
--   Accounts: the profile is anonymized ("Deleted user") and marked deleted_at, the auth user is
--   banned (no sign-in, no sign-up with the same identity), their tools are soft-deleted.
-- A full snapshot of every deleted tool/profile goes to deleted_records first, so an admin can restore.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON public.profiles (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.deleted_records (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('product', 'profile')),
  record_id text NOT NULL, -- products.id or profiles.id
  owner_id uuid,
  deleted_by uuid, -- who did it (the owner, or an admin)
  reason text,
  data jsonb NOT NULL, -- the full row(s) before deletion
  restored_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_deleted_records_record ON public.deleted_records (kind, record_id);
CREATE INDEX IF NOT EXISTS idx_deleted_records_owner ON public.deleted_records (owner_id);
ALTER TABLE public.deleted_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deleted_records FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.deleted_records_id_seq FROM anon, authenticated;

-- Owners can no longer flip products.deleted themselves: deleting goes through the API, which
-- snapshots the tool first (and un-deleting is an admin restore).
CREATE OR REPLACE FUNCTION public.guard_product_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
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
    OR NEW.moderation IS DISTINCT FROM OLD.moderation
    OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
    OR NEW.site_status IS DISTINCT FROM OLD.site_status
    OR NEW.site_status_reason IS DISTINCT FROM OLD.site_status_reason
    OR NEW.site_checked_at IS DISTINCT FROM OLD.site_checked_at
    OR NEW.deleted IS DISTINCT FROM OLD.deleted
    OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
  ) THEN
    RAISE EXCEPTION 'These fields can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

-- Users can't mark their own profile deleted (that happens with the ban, server-side), and a
-- deleted profile can't be edited back.
CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at OR OLD.deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'This profile can only be changed by DevHunt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;
DROP TRIGGER IF EXISTS guard_profile_protected_fields ON public.profiles;
CREATE TRIGGER guard_profile_protected_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_protected_fields();
