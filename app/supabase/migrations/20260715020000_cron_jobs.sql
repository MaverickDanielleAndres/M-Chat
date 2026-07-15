-- Enable pg_cron extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule if it exists to be safe
SELECT cron.unschedule('nightly_quota_reset');

-- Schedule the job to run every day at midnight (00:00 UTC)
SELECT cron.schedule(
  'nightly_quota_reset',
  '0 0 * * *',
  $$
  UPDATE public.credit_wallets AS cw
  SET daily_used = 0,
      daily_reset_at = NOW() + INTERVAL '1 day',
      balance = CASE 
                  WHEN up.subscription_tier IN ('pro', 'premium', 'admin', 'developer') THEN cw.balance 
                  ELSE cw.daily_quota 
                END,
      updated_at = NOW()
  FROM public.user_profiles AS up
  WHERE cw.user_id = up.id;
  $$
);
