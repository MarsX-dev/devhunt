-- Tool descriptions are HTML rendered on the site (sanitized there too): refuse script tags, inline event
-- handlers and script URLs in links on write. Plain text like "JavaScript: easy to learn" still passes.
-- NOT VALID: checks every new write; existing rows (one deleted test tool) are left alone.
ALTER TABLE public.products ADD CONSTRAINT products_description_no_scripts CHECK (
  description IS NULL OR description !~* '<\s*script|<[^>]*\son[a-z]+\s*=|(href|src|action|formaction)\s*=\s*["'']?\s*(javascript|data|vbscript):'
) NOT VALID;
