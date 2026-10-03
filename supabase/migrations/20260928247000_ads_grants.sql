-- Ad tables are read and written by the server (service role) only; the owner-read policy on ad_slots
-- stays usable for signed-in advertisers. Tables created after 20260928224000_tighten_grants came with
-- Supabase's default full grants.
REVOKE ALL ON public.ad_slots, public.ad_stats_daily FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.ad_slots FROM authenticated;
REVOKE ALL ON public.ad_stats_daily FROM authenticated;
REVOKE ALL ON SEQUENCE public.ad_slots_id_seq FROM anon, authenticated;
