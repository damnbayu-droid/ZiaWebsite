-- FIX INFINITE RECURSION
-- Issue: Policies querying 'profiles' directly triggered the policy again recursively.
-- Fix: Use a SECURITY DEFINER function to bypass RLS for the admin check.

-- 1. Create/Update Secure Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS permissions
SET search_path = public -- Security best practice
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Update Profiles Policy (The Source of Recursion)
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  public.is_admin() -- Use function instead of subquery
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  public.is_admin()
);

-- 3. Update Other Tables to use the safe function too
DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;
CREATE POLICY "identity_read_policy" ON public.student_identity
FOR SELECT USING (
  public.is_admin()
  OR
  user_id = auth.uid()
  OR
  is_active = true
);

DROP POLICY IF EXISTS "identity_write_policy" ON public.student_identity;
CREATE POLICY "identity_write_policy" ON public.student_identity
FOR ALL USING (
  public.is_admin()
);

DROP POLICY IF EXISTS "logs_read_policy" ON public.activity_logs;
CREATE POLICY "logs_read_policy" ON public.activity_logs
FOR SELECT USING (
  public.is_admin()
);
