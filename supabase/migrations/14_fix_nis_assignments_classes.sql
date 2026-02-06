-- Phase 20: Fix NIS Saving, Assignments, and Add Class System

-- ============================================
-- 1. FIX STUDENT_IDENTITY WRITE POLICY
-- ============================================
-- Allow verified users to update their own student_number
DROP POLICY IF EXISTS "identity_write_policy" ON public.student_identity;

-- Admins can do anything
CREATE POLICY "identity_admin_all" ON public.student_identity
FOR ALL USING (public.is_admin());

-- Verified users can update their own student_number
CREATE POLICY "identity_verified_update" ON public.student_identity
FOR UPDATE USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_verified = true
  )
);

-- ============================================
-- 2. FIX ASSIGNMENTS RLS POLICIES
-- ============================================
-- Add INSERT policy for assignments
DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
CREATE POLICY "Users can insert own assignments" ON public.assignments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for assignments
DROP POLICY IF EXISTS "Users can delete own assignments" ON public.assignments;
CREATE POLICY "Users can delete own assignments" ON public.assignments 
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. CREATE CLASS SYSTEM TABLES
-- ============================================

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('X', 'XI', 'XII')),
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class members table
CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- ============================================
-- 4. RLS POLICIES FOR CLASSES
-- ============================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Classes: Everyone can read
CREATE POLICY "Anyone can read classes" ON public.classes 
FOR SELECT USING (true);

-- Classes: Users can create
CREATE POLICY "Users can create classes" ON public.classes 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Classes: Users can update their own, admins can update any
CREATE POLICY "Users can update own classes" ON public.classes 
FOR UPDATE USING (
  auth.uid() = created_by 
  OR public.is_admin()
);

-- Classes: Users can delete their own, admins can delete any
CREATE POLICY "Users can delete own classes" ON public.classes 
FOR DELETE USING (
  auth.uid() = created_by 
  OR public.is_admin()
);

-- Class Members: Users can read if they're a member or admin
CREATE POLICY "Users can read class members" ON public.class_members 
FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.class_members cm 
    WHERE cm.class_id = class_members.class_id 
    AND cm.user_id = auth.uid()
  )
);

-- Class Members: Users can join classes
CREATE POLICY "Users can join classes" ON public.class_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Class Members: Users can leave classes they joined
CREATE POLICY "Users can leave classes" ON public.class_members 
FOR DELETE USING (
  auth.uid() = user_id 
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_members.class_id 
    AND created_by = auth.uid()
  )
);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON public.classes(created_by);
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
