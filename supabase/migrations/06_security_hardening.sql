-- 1. Fix "Function Search Path Mutable"
-- Security Best Practice: Always set search_path to 'public' to prevent malicious path injection
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 2. Fix "RLS Policy Always True"
-- Instead of checking "true" (which linter hates), typically we restrict Service Role explicitly.
DROP POLICY IF EXISTS "Service Role Insert" ON public.profiles;

CREATE POLICY "Service Role Insert" ON public.profiles
FOR INSERT WITH CHECK (
  -- Only allow Supabase Service Role (used by Triggers/Admin API) to insert arbitrarily
  auth.role() = 'service_role' 
  OR 
  -- Or allow the trigger context (which behaves like service role often, but let's be explicit)
  (SELECT current_setting('role') = 'service_role')
);

-- 3. Additional Security Hardening
-- Ensure the schema for logs is set too (if function existed, but we usually insert directly)
-- No function for logs yet, but good practice for future.

-- 4. Ensure Admin can definitely verify
-- This re-affirms the update policy just in case the previous migration missed edge cases.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
