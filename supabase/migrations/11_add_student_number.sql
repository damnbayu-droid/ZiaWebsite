-- Migration: Add student_number to student_identity
ALTER TABLE IF EXISTS public.student_identity 
ADD COLUMN IF NOT EXISTS student_number TEXT;

-- Update existing records with a placeholder if any (optional)
-- UPDATE public.student_identity SET student_number = 'SMA-2026-' || floor(random() * 9000 + 1000)::text WHERE student_number IS NULL;
