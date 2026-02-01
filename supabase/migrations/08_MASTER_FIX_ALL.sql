-- MASTER FIX SCRIPT (Run this ONCE to fix everything)

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.student_identity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id),
  public_token TEXT NOT NULL UNIQUE,
  activated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_active_identity_per_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT, 
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RESET RLS (disable and re-enable to clear old policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_identity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSIVE ADMIN POLICIES (Fixing the "Empty List" bugs)

-- Profiles: Admin sees all, User sees self
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Identity: Admin sees all, User sees own / Public sees active
DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;
CREATE POLICY "identity_read_policy" ON public.student_identity
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Admin
  OR
  user_id = auth.uid() -- Student Own
  OR
  (is_active = true) -- Public Verify
);

DROP POLICY IF EXISTS "identity_write_policy" ON public.student_identity;
CREATE POLICY "identity_write_policy" ON public.student_identity
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Logs: Admin sees all, User can insert
DROP POLICY IF EXISTS "logs_read_policy" ON public.activity_logs;
CREATE POLICY "logs_read_policy" ON public.activity_logs
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "logs_insert_policy" ON public.activity_logs;
CREATE POLICY "logs_insert_policy" ON public.activity_logs
FOR INSERT WITH CHECK (true); -- Allow system/users to log events

-- 4. FORCE ADMIN USER (Your Email)
INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
  'admin', -- Role
  true,    -- Verified
  'active' -- Status
FROM auth.users 
WHERE email = 'damnbayu@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_verified = true,
  account_status = 'active';

-- 5. Fix verification function search path
ALTER FUNCTION public.handle_new_user() SET search_path = public;
