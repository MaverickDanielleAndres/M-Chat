-- ============================================================
-- M-Chat Migration: Admin Features & Secure Credits
-- 20260715000000_admin_features.sql
-- ============================================================

-- 1. Add missing admin policies for credit_wallets and credit_transactions
DROP POLICY IF EXISTS p_credit_wallets_admin_all ON public.credit_wallets;
CREATE POLICY p_credit_wallets_admin_all ON public.credit_wallets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

DROP POLICY IF EXISTS p_credit_txn_admin_all ON public.credit_transactions;
CREATE POLICY p_credit_txn_admin_all ON public.credit_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- 2. Secure existing grant_credits function from public exploitation
REVOKE EXECUTE ON FUNCTION public.grant_credits(UUID, INTEGER, credit_txn_type, TEXT, UUID, JSONB) FROM public, authenticated, anon;

-- 3. Create a secure RPC for admins to grant credits manually
CREATE OR REPLACE FUNCTION public.admin_grant_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_txn_type DEFAULT 'grant',
  p_description TEXT DEFAULT 'Admin granted credits',
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_balance INTEGER;
BEGIN
  -- Security check: strictly require auth.uid() to be admin or developer
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'developer')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only admins can manually grant credits';
  END IF;

  -- Proceed with grant
  INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted, last_grant_at)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.credit_wallets.balance + p_amount,
        lifetime_granted = public.credit_wallets.lifetime_granted + p_amount,
        last_grant_at = NOW(),
        updated_at = NOW()
  RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, metadata)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id, p_metadata);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicitly allow authenticated users to call the wrapper (but the internal check guards it)
GRANT EXECUTE ON FUNCTION public.admin_grant_credits(UUID, INTEGER, credit_txn_type, TEXT, UUID, JSONB) TO authenticated;
