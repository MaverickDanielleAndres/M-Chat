-- ============================================================
-- M-Chat Migration: Business Features & Global Config
-- 20260715010000_business_features.sql
-- ============================================================

-- 1. Global System Configuration Table
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read system_config (for global banners, maintenance mode)
DROP POLICY IF EXISTS p_system_config_select_all ON public.system_config;
CREATE POLICY p_system_config_select_all ON public.system_config
  FOR SELECT USING (true);

-- Only admins/developers can update system_config
DROP POLICY IF EXISTS p_system_config_admin_all ON public.system_config;
CREATE POLICY p_system_config_admin_all ON public.system_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- Insert default configurations
INSERT INTO public.system_config (key, value, description) VALUES
('announcement', '{"enabled": false, "message": "Welcome to M-Chat!", "type": "info"}'::jsonb, 'Global announcement banner'),
('maintenance', '{"enabled": false, "message": "System is under maintenance."}'::jsonb, 'Maintenance mode toggle')
ON CONFLICT (key) DO NOTHING;


-- 2. Allow admins to manage subscription_plans
DROP POLICY IF EXISTS p_plans_admin_all ON public.subscription_plans;
CREATE POLICY p_plans_admin_all ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- 3. Allow admins to manage feature_flags
DROP POLICY IF EXISTS p_flags_admin_all ON public.feature_flags;
CREATE POLICY p_flags_admin_all ON public.feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- 4. Allow admins to read audit_events
DROP POLICY IF EXISTS p_audit_admin_select ON public.audit_events;
CREATE POLICY p_audit_admin_select ON public.audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );
