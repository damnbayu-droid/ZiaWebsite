-- Allow Admins to see ALL profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.is_admin()
);

-- Allow Admins to update verification status (if not covered by existing policy)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_admin()
);
