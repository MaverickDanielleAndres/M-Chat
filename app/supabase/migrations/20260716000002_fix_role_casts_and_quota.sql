-- 1. Force the function to be VOLATILE
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
  v_role user_role;
  v_daily_used INTEGER;
  v_daily_quota INTEGER;
  v_balance INTEGER;
BEGIN
  SELECT 
    COALESCE(subscription_tier, 'free'::subscription_tier),
    COALESCE(role, 'user'::user_role)
    INTO v_tier, v_role
    FROM public.user_profiles
   WHERE id = p_user_id;

  IF v_tier IS NULL THEN v_tier := 'free'::subscription_tier; END IF;
  IF v_role IS NULL THEN v_role := 'user'::user_role; END IF;

  IF v_tier IN ('pro', 'premium') OR v_role IN ('admin', 'developer') THEN
    RETURN QUERY SELECT TRUE, 'unlimited'::TEXT, 
                 CASE WHEN v_role IN ('admin', 'developer') THEN v_role::TEXT ELSE v_tier::TEXT END, 
                 0, -1, 0;
    RETURN;
  END IF;

  SELECT cw.daily_used, cw.daily_quota, cw.balance
    INTO v_daily_used, v_daily_quota, v_balance
    FROM public.credit_wallets cw
   WHERE cw.user_id = p_user_id;

  IF v_daily_quota IS NULL THEN v_daily_quota := 20; END IF;
  IF v_daily_used IS NULL THEN v_daily_used := 0; END IF;
  IF v_balance IS NULL THEN v_balance := 0; END IF;

  UPDATE public.credit_wallets
     SET daily_used = 0,
         daily_reset_at = NOW() + INTERVAL '1 day'
   WHERE user_id = p_user_id
     AND daily_reset_at < NOW()
  RETURNING public.credit_wallets.daily_used INTO v_daily_used;

  IF v_daily_quota <> -1 AND v_daily_used >= v_daily_quota THEN
    RETURN QUERY SELECT FALSE, 'quota_exhausted'::TEXT, v_tier::TEXT, v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  IF v_balance <= 0 THEN
    RETURN QUERY SELECT FALSE, 'no_credits'::TEXT, v_tier::TEXT, v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'ok'::TEXT, v_tier::TEXT, v_daily_used, v_daily_quota, v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;


-- 2. Force record_prompt_usage to be VOLATILE
CREATE OR REPLACE FUNCTION public.record_prompt_usage(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (new_daily_used INTEGER, new_balance INTEGER) AS $$
DECLARE
  v_can BOOLEAN;
  v_reason TEXT;
  v_tier TEXT;
  v_daily_used INTEGER;
  v_daily_quota INTEGER;
  v_balance INTEGER;
BEGIN
  SELECT * INTO v_can, v_reason, v_tier, v_daily_used, v_daily_quota, v_balance
    FROM public.check_user_can_prompt(p_user_id)
   LIMIT 1;

  IF NOT v_can THEN
    IF v_reason = 'quota_exhausted' THEN
      RAISE EXCEPTION 'QUOTA_EXHAUSTED';
    ELSE
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;
  END IF;

  UPDATE public.credit_wallets
     SET daily_used = daily_used + 1,
         lifetime_spent = lifetime_spent + GREATEST(p_amount, 0),
         balance = CASE
           WHEN v_tier IN ('pro', 'premium', 'admin', 'developer')
             THEN GREATEST(0, balance - GREATEST(p_amount, 0))
           ELSE GREATEST(0, balance - 0)
         END,
         updated_at = NOW()
   WHERE user_id = p_user_id
  RETURNING public.credit_wallets.daily_used, public.credit_wallets.balance INTO v_daily_used, v_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
  VALUES (p_user_id, -GREATEST(p_amount, 0), 'spend', 'Chat prompt', p_metadata);

  RETURN QUERY SELECT v_daily_used, v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- 3. Fix the trigger to grant 20 daily prompts instead of 50
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, username, role, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 8),
    'user',
    'registered'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted, daily_quota, daily_used)
  VALUES (NEW.id, 50, 50, 20, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.app_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- 4. Retroactively fix existing wallets that were granted 50 instead of 20
UPDATE public.credit_wallets SET daily_quota = 20 WHERE daily_quota = 50;

-- 5. IMPORTANT: Create wallets for users whose wallets failed to create during the original bug!
INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted, daily_quota, daily_used)
SELECT id, 50, 50, 20, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.credit_wallets);

-- 6. Fix usage_logs RLS to allow inserts from the frontend
DROP POLICY IF EXISTS p_usage_logs_insert_own ON public.usage_logs;
CREATE POLICY p_usage_logs_insert_own ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
