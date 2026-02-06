-- Phase 21: Admin Dashboard Improvements
-- Enable comprehensive user management and activity tracking

-- ============================================
-- 1. ENHANCE ACTIVITY_LOGS TABLE
-- ============================================
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================
-- 2. RLS POLICIES FOR ACTIVITY_LOGS
-- ============================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
DROP POLICY IF EXISTS "Admins can read all logs" ON public.activity_logs;
CREATE POLICY "Admins can read all logs" ON public.activity_logs
FOR SELECT USING (public.is_admin());

-- Users can create their own logs
DROP POLICY IF EXISTS "Users can create own logs" ON public.activity_logs;
CREATE POLICY "Users can create own logs" ON public.activity_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. ADMIN POLICIES FOR STUDENT_IDENTITY
-- ============================================
-- Allow admins to update any student identity (for NIS editing)
DROP POLICY IF EXISTS "Admins can update any identity" ON public.student_identity;
CREATE POLICY "Admins can update any identity" ON public.student_identity
FOR UPDATE USING (public.is_admin());

-- ============================================
-- 4. ADMIN POLICIES FOR PROFILES
-- ============================================
-- Allow admins to delete users (will cascade to related tables)
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;
CREATE POLICY "Admins can delete users" ON public.profiles
FOR DELETE USING (public.is_admin());

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_student_identity_user_id ON public.student_identity(user_id);
