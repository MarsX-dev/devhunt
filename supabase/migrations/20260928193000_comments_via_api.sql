-- Comments are posted through /api/comments (service role), which runs the spam checks and
-- shadow-blocks spam. Without this, anyone signed in could insert straight into the table and skip them.
-- Apply AFTER the app version that posts through /api/comments is live (the old one inserts directly).
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.comment;
