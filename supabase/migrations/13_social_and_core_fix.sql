-- Phase 13 & 14: Core Fixes, Social Messaging, and Notifications

-- 1. Ensure Subjects Table exists
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ec4899', -- Default pink
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Assignments Table exists (Fixing the "Supabase Error: {}" if due to missing table/join)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Assigned to specific user OR null for global
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Social Messaging System
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Unified Notification System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('assignment', 'message', 'system')),
    title TEXT NOT NULL,
    body TEXT,
    reference_id UUID, -- assignment_id or message_id
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Subjects: Public Read
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);

-- Assignments: User reads own
CREATE POLICY "Users can read own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = user_id);

-- Messages: User reads/sends if sender or receiver
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications: User reads own
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Initial Mock Data for Subjects if empty
INSERT INTO public.subjects (name, color)
VALUES 
('Matematika', '#ef4444'),
('Bahasa Inggris', '#3b82f6'),
('Fisika', '#8b5cf6'),
('Biologi', '#10b981'),
('Sejarah', '#f59e0b')
ON CONFLICT DO NOTHING;
