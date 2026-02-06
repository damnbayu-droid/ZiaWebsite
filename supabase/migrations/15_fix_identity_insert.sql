-- Fix: Allow users to create their own student_identity
-- This enables auto-creation of barcode on first login

-- Add INSERT policy for student_identity
DROP POLICY IF EXISTS "identity_user_insert" ON public.student_identity;

CREATE POLICY "identity_user_insert" ON public.student_identity
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Ensure users can read their own identity
DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;

CREATE POLICY "identity_read_policy" ON public.student_identity
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_admin()
);
