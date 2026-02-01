-- EMERGENCY ADMIN RESTORE
-- Replace with your email
UPDATE public.profiles 
SET 
  role = 'admin', 
  is_verified = true,
  account_status = 'active'
WHERE email = 'damnbayu@gmail.com'; 

-- OPTIONAL: Create profile if missing (rare case where trigger failed)
INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
  'admin', 
  true, 
  'active'
FROM auth.users 
WHERE email = 'damnbayu@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Fix "Users View Own Profile" Policy (Ensure it works)
DROP POLICY IF EXISTS "View Profiles" ON public.profiles;
CREATE POLICY "View Profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = id -- User sees self
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Admin sees all
);
