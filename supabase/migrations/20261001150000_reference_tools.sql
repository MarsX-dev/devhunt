-- Reference listings: well-known tools DevHunt lists itself (Cursor, Claude Code, Codex...) so category pages
-- aren't missing the tools everyone expects. They never launch (no weekly contest, no launch dates), are open
-- for votes any time, and their page says "Listed by DevHunt" instead of showing a maker.
alter table public.products add column if not exists is_reference boolean not null default false;

create index if not exists products_is_reference_idx on public.products (is_reference) where is_reference;
