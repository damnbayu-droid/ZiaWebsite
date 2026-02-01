-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies (Drop first to avoid collision)
DROP POLICY IF EXISTS "Avatar Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Admin Delete" ON storage.objects;

-- Re-create
CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE 
WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Avatar Admin Delete" ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND (
      auth.uid() = owner OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
);
