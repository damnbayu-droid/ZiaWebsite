-- 1. Reset Policies for Profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Robust Policies
-- A. VIEW: Users can see themselves, Admins can see everyone
CREATE POLICY "View Profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = id -- User sees self
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Admin sees all
);

-- B. UPDATE: Users update self, Admins update everyone
CREATE POLICY "Update Profiles" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- C. INSERT: Trigger handles this, but allow service role just in case
CREATE POLICY "Service Role Insert" ON public.profiles
FOR INSERT WITH CHECK (true);

-- 3. Fix Trigger for New User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    is_verified, 
    account_status,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    'student', -- Default role
    false, -- Not verified by default
    'active',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, -- Sync email on re-register/update
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. EMERGENCY ADMIN FIX
-- RUN THIS LINE MANUALLY IN EDITOR WITH YOUR EMAIL TO BECOME ADMIN
-- UPDATE public.profiles SET role = 'admin', is_verified = true WHERE email = 'YOUR_EMAIL_HERE';

-- 5. Fix Storage Policies (just to be safe)
-- Allow authenticated uploads to 'avatars'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar Images are Public" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 6. Ensure 'products' and other tables are accessible
DO $$ 
BEGIN
  -- Re-apply logs policies just in case
  DROP POLICY IF EXISTS "Admins can view logs" ON public.activity_logs;
  CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT USING ( 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END $$;
