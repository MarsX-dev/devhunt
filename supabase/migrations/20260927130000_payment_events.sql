-- Append-only log of every step in the paid-launch flow, for monitoring and debugging.
CREATE TABLE IF NOT EXISTS public.payment_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,          -- e.g. checkout_created, webhook_received, activated, payment_failed
  level text NOT NULL DEFAULT 'info',
  stripe_session_id text,
  stripe_event_id text,
  product_id bigint,
  user_id uuid,
  amount_total integer,
  currency text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_session ON public.payment_events (stripe_session_id);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_events FROM anon, authenticated;
