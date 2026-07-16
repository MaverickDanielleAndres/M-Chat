-- Create security definer functions to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dev()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin'::public.user_role, 'developer'::public.user_role)
  );
$$;

-- Fix user_profiles policies
DROP POLICY IF EXISTS p_user_profiles_select_admin ON public.user_profiles;
CREATE POLICY p_user_profiles_select_admin ON public.user_profiles
  FOR SELECT USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS p_user_profiles_update_admin ON public.user_profiles;
CREATE POLICY p_user_profiles_update_admin ON public.user_profiles
  FOR UPDATE USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS p_user_profiles_update_own ON public.user_profiles;
CREATE POLICY p_user_profiles_update_own ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = public.get_auth_user_role());
