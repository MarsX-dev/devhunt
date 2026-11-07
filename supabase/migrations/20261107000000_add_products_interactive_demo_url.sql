-- Add an optional interactive demo to product listings.
--
-- Stores the share link (or the src from the embed code) the maker pasted for an interactive demo
-- from a supported provider (Arcade, AtriumKit, Navattic, Storylane, Supademo). The app never uses
-- this value as an iframe src directly: utils/demoEmbed.ts checks the host against the supported
-- providers and rebuilds the embed URL every time a tool page renders.
--
-- Nullable with no default, so existing products are unaffected.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS interactive_demo_url text;
