-- ============================================================
-- M-Chat Migration: Fix daily quota enforcement
-- 20260714010000_fix_quota_enforcement.sql
-- ============================================================

-- Fix spend_credits with proper daily quota enforcement
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id      UUID,
  p_amount       INTEGER,
  p_description  TEXT    DEFAULT NULL,
  p_reference_id UUID    DEFAULT NULL,
  p_metadata     JSONB   DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  v_balance      INTEGER;
  v_daily_used   INTEGER;
  v_daily_quota  INTEGER;
  v_tier         TEXT;
  v_is_unlimited BOOLEAN;
BEGIN
  IF p_amount <= 0 THEN
    RETURN (SELECT balance FROM public.credit_wallets WHERE user_id = p_user_id);
  END IF;

  SELECT COALESCE(subscription_tier::text, 'free')
    INTO v_tier
    FROM public.user_profiles
   WHERE id = p_user_id;

  v_is_unlimited := v_tier IN ('pro','premium','admin','developer');

  -- Reset daily quota if expired; refill balance for free users
  UPDATE public.credit_wallets
     SET daily_used     = 0,
         daily_reset_at = NOW() + INTERVAL '1 day',
         balance        = CASE
           WHEN NOT v_is_unlimited THEN daily_quota
           ELSE balance
         END,
         updated_at = NOW()
   WHERE user_id = p_user_id
     AND daily_reset_at < NOW();

  SELECT balance, daily_used, daily_quota
    INTO v_balance, v_daily_used, v_daily_quota
    FROM public.credit_wallets
   WHERE user_id = p_user_id;

  -- Unlimited tiers: skip all checks
  IF v_is_unlimited THEN
    UPDATE public.credit_wallets
       SET daily_used     = daily_used + p_amount,
           lifetime_spent = lifetime_spent + p_amount,
           updated_at     = NOW()
     WHERE user_id = p_user_id
    RETURNING balance INTO v_balance;
    INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, metadata)
    VALUES (p_user_id, -p_amount, 'spend', p_description, p_reference_id, p_metadata);
    RETURN v_balance;
  END IF;

  -- Free/registered: enforce daily quota
  IF v_daily_quota <> -1 AND v_daily_used + p_amount > v_daily_quota THEN
    RAISE EXCEPTION 'DAILY_QUOTA_EXCEEDED';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  UPDATE public.credit_wallets
     SET balance        = balance - p_amount,
         daily_used     = daily_used + p_amount,
         lifetime_spent = lifetime_spent + p_amount,
         updated_at     = NOW()
   WHERE user_id = p_user_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, metadata)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_reference_id, p_metadata);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix handle_new_user: free users get balance=20, daily_quota=20
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
  VALUES (NEW.id, 20, 20, 20, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.app_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing wallets: daily_quota=50 -> 20 for free/registered users
UPDATE public.credit_wallets w
   SET daily_quota = 20,
       balance     = 20,
       updated_at  = NOW()
  FROM public.user_profiles up
 WHERE w.user_id = up.id
   AND up.subscription_tier IN ('free', 'registered')
   AND w.daily_quota > 20;

-- Upsert subscription_plans with correct free-tier limit of 20
INSERT INTO public.subscription_plans (
  slug, name, description, tagline, price_monthly, price_yearly, currency, features,
  max_prompts_daily, max_storage_mb, max_file_size_mb, max_conversations, monthly_credits,
  includes_image_gen, includes_voice, includes_api, includes_web_search, includes_custom_gpts,
  priority_level, highlight, is_active, sort_order
) VALUES
  ('free','Free','Try M-Chat at no cost','Get started in seconds',0,0,'USD',
   '["20 prompts per day","Basic AI chat","Local chat history","Text & code support","Community support"]'::jsonb,
   20,0,5,-1,0,false,false,false,false,false,0,false,true,0),
  ('pro','Pro','For power users and creators','Unlimited AI at your fingertips',19,190,'USD',
   '["Unlimited prompts","Priority responses","Longer context window","Image generation","Voice conversations","Larger uploads (50MB)","Cloud storage (10GB)","Custom GPTs","Priority support"]'::jsonb,
   -1,10240,50,-1,2000,true,true,false,true,true,1,true,true,1),
  ('premium','Premium','For teams and businesses','Everything you need to ship faster',49,490,'USD',
   '["Everything in Pro","Early access features","Advanced AI models","Unlimited storage","Projects & folders","Team workspace","API access","White-label options","Dedicated support"]'::jsonb,
   -1,-1,100,-1,10000,true,true,true,true,true,2,false,true,2)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  tagline           = EXCLUDED.tagline,
  price_monthly     = EXCLUDED.price_monthly,
  price_yearly      = EXCLUDED.price_yearly,
  features          = EXCLUDED.features,
  max_prompts_daily = EXCLUDED.max_prompts_daily,
  monthly_credits   = EXCLUDED.monthly_credits,
  includes_image_gen = EXCLUDED.includes_image_gen,
  includes_voice    = EXCLUDED.includes_voice,
  includes_api      = EXCLUDED.includes_api,
  highlight         = EXCLUDED.highlight,
  sort_order        = EXCLUDED.sort_order,
  updated_at        = NOW();
