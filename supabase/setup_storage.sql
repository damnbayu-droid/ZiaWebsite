-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('materials', 'materials', false),
  ('recordings', 'recordings', false),
  ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for Avatars (Public Read, Owner Write)
DROP POLICY IF EXISTS "Avatar Public Read" ON storage.objects;
CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- RLS for Private Content (Materials, Recordings, etc.)
-- Only owner can see and edit
DROP POLICY IF EXISTS "Private Read" ON storage.objects;
CREATE POLICY "Private Read" ON storage.objects FOR SELECT USING (bucket_id IN ('materials', 'recordings', 'chat_attachments') AND auth.uid() = owner);

DROP POLICY IF EXISTS "Private Insert" ON storage.objects;
CREATE POLICY "Private Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('materials', 'recordings', 'chat_attachments') AND auth.uid() = owner);

DROP POLICY IF EXISTS "Private Delete" ON storage.objects;
CREATE POLICY "Private Delete" ON storage.objects FOR DELETE USING (bucket_id IN ('materials', 'recordings', 'chat_attachments') AND auth.uid() = owner);
