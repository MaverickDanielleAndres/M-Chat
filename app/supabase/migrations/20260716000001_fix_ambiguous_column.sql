-- Fix ambiguous column reference in check_user_can_prompt
CREATE OR REPLACE FUNCTION public.check_user_can_prompt(p_user_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  tier TEXT,
  daily_used INTEGER,
  daily_quota INTEGER,
  balance INTEGER
) AS $$
DECLARE
  v_tier subscription_tier;
  v_daily_used INTEGER;
  v_daily_quota INTEGER;
  v_balance INTEGER;
BEGIN
  -- Profile lookup (defaults to free when missing)
  SELECT COALESCE(subscription_tier, 'free'::subscription_tier)
    INTO v_tier
    FROM public.user_profiles
   WHERE id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free'::subscription_tier;
  END IF;

  -- Unlimited tiers bypass quota entirely
  IF v_tier IN ('pro'::subscription_tier, 'premium'::subscription_tier, 'admin'::subscription_tier, 'developer'::subscription_tier) THEN
    RETURN QUERY SELECT TRUE, 'unlimited'::TEXT, v_tier::TEXT, 0, -1, 0;
    RETURN;
  END IF;

  -- Wallet lookup + daily reset
  SELECT cw.daily_used, cw.daily_quota, cw.balance
    INTO v_daily_used, v_daily_quota, v_balance
    FROM public.credit_wallets cw
   WHERE cw.user_id = p_user_id;

  IF v_daily_quota IS NULL THEN
    v_daily_quota := 20;
  END IF;
  IF v_daily_used IS NULL THEN
    v_daily_used := 0;
  END IF;
  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  -- Reset daily counter if expired
  UPDATE public.credit_wallets
     SET daily_used = 0,
         daily_reset_at = NOW() + INTERVAL '1 day'
   WHERE user_id = p_user_id
     AND daily_reset_at < NOW()
  RETURNING public.credit_wallets.daily_used INTO v_daily_used;

  -- Check daily quota
  IF v_daily_quota <> -1 AND v_daily_used >= v_daily_quota THEN
    RETURN QUERY SELECT FALSE, 'quota_exhausted'::TEXT, v_tier::TEXT,
                         v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  -- Free-tier fallback: balance must be positive
  IF v_balance <= 0 THEN
    RETURN QUERY SELECT FALSE, 'no_credits'::TEXT, v_tier::TEXT,
                         v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'ok'::TEXT, v_tier::TEXT,
                       v_daily_used, v_daily_quota, v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
