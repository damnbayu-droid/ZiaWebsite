-- 1. Fix Profiles Table (Add role column if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'student';
        -- Add check constraint separately to avoid issues if data exists
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'class_admin', 'admin'));
    END IF;
END $$;

-- 2. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default School
INSERT INTO public.schools (name, address)
VALUES ('SMAN 1 Kotabunan', 'Kotabunan, Indonesia')
ON CONFLICT DO NOTHING;

-- 3. Create Student Identity Table
CREATE TABLE IF NOT EXISTS public.student_identity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  public_token TEXT NOT NULL UNIQUE,
  activated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_active_identity_per_user UNIQUE (user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_student_identity_token ON public.student_identity(public_token);

-- 4. RLS Policies (Drop existing to ensure clean state)
ALTER TABLE public.student_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools Policies
DROP POLICY IF EXISTS "Schools public read" ON public.schools;
CREATE POLICY "Schools public read" ON public.schools FOR SELECT USING (true);

-- Identity Policies
DROP POLICY IF EXISTS "public_read_identity" ON public.student_identity;
CREATE POLICY "public_read_identity" ON public.student_identity
FOR SELECT TO anon, authenticated
USING ( is_active = true AND expires_at > NOW() );

DROP POLICY IF EXISTS "student_read_own_identity" ON public.student_identity;
CREATE POLICY "student_read_own_identity" ON public.student_identity
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_identity" ON public.student_identity;
CREATE POLICY "admin_manage_identity" ON public.student_identity
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
