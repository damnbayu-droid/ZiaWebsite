-- Activity Logs Table (replaces generic admin_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT, -- Snapshot of name at time of log
  action TEXT NOT NULL, -- 'login', 'logout', 'api_openai', 'api_profile', 'delete_account', etc.
  details JSONB, -- { "method": "GET", "endpoint": "...", "status": 200 }
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view logs" 
ON public.activity_logs 
FOR SELECT 
USING ( public.is_admin() );

-- Server-side only insert (via Service Role) or Admin insert
-- We will likely insert via API route using Service Role for reliability, 
-- but allowing authenticated users to insert their *own* logs (e.g. client-side logout) is okay if validated.
CREATE POLICY "Users can insert own logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

-- Admin can insert system logs
CREATE POLICY "Admins can insert logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK ( public.is_admin() );
