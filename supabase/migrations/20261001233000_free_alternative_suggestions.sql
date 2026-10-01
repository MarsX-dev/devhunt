-- Suggestions for the /free-alternatives matrix. Written only by the server (service role, after checking the
-- signed-in user); reviewed by hand. The browser has no access.
create table if not exists public.free_alternative_suggestions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paid_tool text not null check (char_length(paid_tool) between 1 and 80),
  alternative text not null check (char_length(alternative) between 1 and 80),
  url text check (url is null or char_length(url) <= 300),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'new' check (status in ('new', 'added', 'rejected'))
);
create index if not exists free_alternative_suggestions_user_created on public.free_alternative_suggestions (user_id, created_at desc);
alter table public.free_alternative_suggestions enable row level security;
revoke all on public.free_alternative_suggestions from anon, authenticated;
