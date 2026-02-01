-- BYPASS SUPABASE AUTH LIMIT AND CREATE TEST DATA
-- This script manually inserts a "Student" profile that needs verification.
-- You can use this to test the Admin Dashboard "Approve" button immediately.

INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_verified, 
    account_status,
    avatar_url,
    created_at
)
VALUES (
    gen_random_uuid(), -- Fake ID (won't be able to login, but perfect for Admin UI testing)
    'student_test_' || floor(random() * 1000) || '@sma1.sch.id',
    'Siswa Percobaan (Test)',
    'student',
    false, -- PENDING VERIFICATION
    'active',
    '',
    NOW()
);

-- Run this multiple times to add more pending students!
