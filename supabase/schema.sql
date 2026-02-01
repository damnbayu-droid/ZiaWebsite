-- Zia Educational Platform - Database Schema

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  school TEXT,
  grade TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'class_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone in same class" 
ON public.profiles FOR SELECT 
USING ( true ); -- Simplified for now, refine for class-based later

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT '#db2777',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own subjects" 
ON public.subjects FOR ALL 
USING ( auth.uid() = user_id );

-- 3. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  content TEXT, -- Rich text HTML or Markdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes" 
ON public.notes FOR ALL 
USING ( auth.uid() = user_id );

-- 4. Recordings Table
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration INTEGER, -- Seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own recordings" 
ON public.recordings FOR ALL 
USING ( auth.uid() = user_id );

-- 5. Materials Table (File Uploads)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own materials" 
ON public.materials FOR ALL 
USING ( auth.uid() = user_id );

-- 6. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL, -- Creator (student self-assign or teacher)
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'reviewed', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own assignments" 
ON public.assignments FOR ALL 
USING ( auth.uid() = user_id );

-- 7. Classes System
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Invitation code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- RLS for Classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View classes I am member of" 
ON public.classes FOR SELECT 
USING ( 
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = public.classes.id AND user_id = auth.uid()) 
);

CREATE POLICY "Create classes" 
ON public.classes FOR INSERT 
WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "View members of my classes" 
ON public.class_members FOR SELECT 
USING ( 
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND owner_id = auth.uid()) OR
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = class_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Join class" 
ON public.class_members FOR INSERT 
WITH CHECK ( user_id = auth.uid() );

-- Updates to existing tables for Class support
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);

-- 8. Internal Chat System
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('private', 'group', 'class')),
  name TEXT, -- For groups
  class_id UUID REFERENCES public.classes(id), -- If class chat
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View my chat rooms" ON public.chat_rooms 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_room_id = id AND user_id = auth.uid()) OR
  (type = 'class' AND EXISTS (SELECT 1 FROM public.class_members WHERE class_id = public.chat_rooms.class_id AND user_id = auth.uid()))
);

CREATE POLICY "View messages in my rooms" ON public.messages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_room_id = messages.chat_room_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.chat_rooms cr JOIN public.class_members cm ON cr.class_id = cm.class_id 
          WHERE cr.id = messages.chat_room_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Send messages to my rooms" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_room_id = messages.chat_room_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.chat_rooms cr JOIN public.class_members cm ON cr.class_id = cm.class_id 
            WHERE cr.id = messages.chat_room_id AND cm.user_id = auth.uid())
  )
);

-- 9. AI Interaction Logs (Optional)
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prompt TEXT,
  response TEXT,
  context_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own AI logs" ON public.ai_logs FOR ALL USING (auth.uid() = user_id);

-- Storage Buckets Setup (Via SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true),
       ('materials', 'materials', false), -- Secure
       ('recordings', 'recordings', false),
       ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Avatars)
-- Allow Public Read
CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow User Own Upload OR Admin Upload
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
-- Allow Admin Delete
CREATE POLICY "Avatar Admin Delete" ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND (
      auth.uid() = owner OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
);

-- Storage RLS (Materials/Recordings) - Private
CREATE POLICY "Private Read" ON storage.objects FOR SELECT USING (bucket_id IN ('materials', 'recordings') AND auth.uid() = owner);
CREATE POLICY "Private Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('materials', 'recordings') AND auth.uid() = owner);
CREATE POLICY "Private Delete" ON storage.objects FOR DELETE USING (bucket_id IN ('materials', 'recordings') AND auth.uid() = owner);
