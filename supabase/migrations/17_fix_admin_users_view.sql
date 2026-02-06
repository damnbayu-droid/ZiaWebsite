-- Phase 22: Fix User Management Empty State
-- Ensure Admins can definitely view all profiles and identities without recursion

-- 1. Ensure is_admin is SECURITY DEFINER (bypasses RLS) to prevent recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix PROFILES Policies
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "View Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id -- User sees self
  OR 
  public.is_admin() -- Admin sees all (secure)
);

-- 3. Fix IDENTITY Policies (ensure admin access matches)
DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;

CREATE POLICY "identity_read_policy" ON public.student_identity
FOR SELECT USING (
  public.is_admin() -- Admin
  OR
  user_id = auth.uid() -- Student Own
  OR
  is_active = true -- Public Verify
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_identity ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;
