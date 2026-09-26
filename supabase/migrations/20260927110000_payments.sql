-- One row per Stripe Checkout Session that activated a paid launch. The unique session id makes
-- activation idempotent (Stripe retries webhooks; the success page may also confirm).
CREATE TABLE IF NOT EXISTS public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_payment_intent text,
  product_id bigint NOT NULL REFERENCES public.products (id),
  user_id uuid NOT NULL,
  amount_total integer NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  launch_week_start timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_product_id ON public.payments (product_id);

-- Server-only (service role bypasses RLS); no policies, so the public API can't read or write it.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM anon, authenticated;
