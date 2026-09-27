-- One row per thing a scheduled job sends (a campaign, or one personal email), so a job can run several
-- times a day (retries) and still send everything exactly once. key is '' for campaigns, else the recipient.
--   running  claimed by a run that is sending it now (or crashed mid-send: never auto-resent, reported)
--   done     sent
CREATE TABLE IF NOT EXISTS public.cron_sends (
  job text NOT NULL,
  period text NOT NULL,
  key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done')),
  started_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz,
  PRIMARY KEY (job, period, key)
);
-- Server (service role) only.
ALTER TABLE public.cron_sends ENABLE ROW LEVEL SECURITY;
