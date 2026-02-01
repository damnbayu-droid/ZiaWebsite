-- FINAL REPAIR SCRIPT: FIX EVERYTHING
-- 1. Fix "Infinite Recursion" (Policy Loop)
-- 2. Sync "Missing Users" (Auth -> Profiles)
-- 3. Fix "Triggers" (Future Users)

-- STEP 1: SAFE ADMIN CHECK (Prevents Loop)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Bypasses RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- STEP 2: NUKE AND RESET POLICIES
-- We drop everything to ensure no bad logic remains.
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;

-- New Clean Policies
CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  public.is_admin() -- Uses the Safe Function
);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  public.is_admin()
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 3: SYNC MISSING USERS (Fix "Empty Dashboard")
-- This copies any users currently in Authentication but missing from Dashboard
INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Student User'),
  'student',
  false,
  'active'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- STEP 4: REPAIR TRIGGER (For Future Signups)
-- Ensures new signups definitely get copied to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Student'),
    'student',
    false,
    'active'
  );
  RETURN new;
END;
$$;

-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: FORCE ADMIN (Just in case)
UPDATE public.profiles 
SET role = 'admin', is_verified = true 
WHERE email = 'damnbayu@gmail.com';
