-- FORCE ADMIN & FIX DATA (FINAL)
-- Replace 'damnbayu@gmail.com' with the ACTUAL email logged in.

-- 1. Ensure Profile Exists (Upsert)
INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), -- Fallback name
  'admin', -- FORCE ADMIN ROLE
  true,    -- FORCE VERIFIED
  'active' -- FORCE ACTIVE
FROM auth.users 
WHERE email = 'damnbayu@gmail.com' -- TARGET SPECIFIC USER
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified,
  account_status = EXCLUDED.account_status,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- 2. Verify Result
SELECT * FROM public.profiles WHERE email = 'damnbayu@gmail.com';
