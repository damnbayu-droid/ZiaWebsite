-- 1. Products Table (Learning Services, Rentals, etc.)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT, -- 'service', 'physical', 'digital'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Packages Table (Bundles)
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  items JSONB, -- Array of product IDs or descriptors
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Nullable for Guest invoices
  guest_info JSONB, -- { name, email, company } for guests
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled', 'refunded')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  items JSONB NOT NULL, -- Snapshot of items/packages
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL, -- 'create_product', 'verify_user', etc.
  target_resource TEXT, -- 'product:123', 'user:456'
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies (STRICT ADMIN ONLY)
-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Products: Public Read, Admin Write
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin CRUD Products" ON public.products FOR ALL USING (public.is_admin());

-- Packages: Public Read, Admin Write
CREATE POLICY "Public Read Packages" ON public.packages FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin CRUD Packages" ON public.packages FOR ALL USING (public.is_admin());

-- Invoices: User Read Own, Admin CRUD
CREATE POLICY "User Read Own Invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin CRUD Invoices" ON public.invoices FOR ALL USING (public.is_admin());

-- Admin Logs: Admin Read/Insert Only
CREATE POLICY "Admin Read Logs" ON public.admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin Insert Logs" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin());

-- Add 'is_verified' to profiles if not exists (User Management requirement)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'suspended'));
