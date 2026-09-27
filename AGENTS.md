# DevHunt: notes for coding agents (Claude Code, Codex, ...)

## Database (Supabase, project `xpdhqqwgprlqmqaqmnyx`)

- Two Supabase MCP connectors are usually attached. Use the one whose `execute_sql` runs as `postgres` (the non-plugin connector, the one with `apply_migration` / `list_migrations`) for migrations and writes.
- The `plugin_supabase_supabase` connector runs as `supabase_read_only_user`. It's fine for reads, but every write fails with "permission denied".
- If unsure, run `select current_user` first.
- There is no dev or staging database; everything runs against production. Dry-run destructive changes first (select what would change), and keep them restorable (soft delete, `deleted_records` snapshots).
- Migrations live in `supabase/migrations/`, and filenames must have unique versions (other sessions add files too).
- A migration that removes something the live site still uses (a policy, column or function) is applied only after the code that stops using it is deployed.

## Running locally

- `pnpm` only.
- `dev`: `NEXT_DIST_DIR=.next-dev next dev -p 3125`, with hot reload. It builds into its own folder, so it can run next to prod.
- `prod`: `next start -p 3124` serves the last `pnpm build` in `.next`. Prefetching and loading skeletons only behave for real in a production build.
- Both are defined in `.claude/launch.json`.

## Deploying

- Push to `origin` (MarsX-dev/devhunt) `main`; John syncs it to the Vercel fork. Don't push to `fork`.
- Several sessions may edit this repo at once. Commit only your own files or hunks.
