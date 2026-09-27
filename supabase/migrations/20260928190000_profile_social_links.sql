-- Profile links as handles ({"x":"johnrush","github":"johnrushx","linkedin":"in/johnrush","other":["https://…"]}),
-- parsed from whatever people typed by utils/socialLinks.ts. URLs are built when rendering, so there is one format.
-- social_url stays: it holds the first link and gates the "complete your profile" modal. Nullable, so old rows are
-- untouched until the backfill (scripts/normalize-social-links.mjs) or their next save.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb;

-- Users can update their own row directly (RLS), so keep the shape and size sane; the page re-validates every value.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_social_links_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_social_links_check
  CHECK (social_links IS NULL OR (jsonb_typeof(social_links) = 'object' AND octet_length(social_links::text) < 4000));
