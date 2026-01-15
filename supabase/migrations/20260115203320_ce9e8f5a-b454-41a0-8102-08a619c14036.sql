-- =============================================
-- JADARAT ATS - Core Database Schema
-- Phase 1: Foundation Tables
-- =============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'org_admin', 
  'hr_manager',
  'recruiter',
  'hiring_manager',
  'interviewer'
);

-- 2. Create subscription_tiers table (no org_id - platform-wide)
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  max_jobs INTEGER NOT NULL,
  max_candidates INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create organizations table (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1a73e8',
  secondary_color VARCHAR(7) DEFAULT '#34a853',
  custom_domain VARCHAR(255),
  default_language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  tier_id UUID REFERENCES public.subscription_tiers(id),
  subscription_status VARCHAR(20) DEFAULT 'trial',
  subscription_start_date DATE,
  subscription_end_date DATE,
  data_residency VARCHAR(50) DEFAULT 'mena',
  saudization_enabled BOOLEAN DEFAULT false,
  saudization_target_percentage DECIMAL(5,2),
  emiratization_enabled BOOLEAN DEFAULT false,
  emiratization_target_percentage DECIMAL(5,2),
  max_jobs INTEGER DEFAULT 10,
  max_candidates INTEGER DEFAULT 1000,
  max_users INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_tier ON public.organizations(tier_id);

-- 4. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  language_preference VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_org ON public.profiles(org_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 5. Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- =============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTION TIERS POLICIES (readable by all authenticated, managed by super_admin)
CREATE POLICY "Anyone can view active tiers"
  ON public.subscription_tiers FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tiers"
  ON public.subscription_tiers FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ORGANIZATIONS POLICIES
CREATE POLICY "Super admins can view all orgs"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own org"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Super admins can manage all orgs"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view profiles in their org"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'hr_manager'))
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DEFAULT SUBSCRIPTION TIERS
-- =============================================

INSERT INTO public.subscription_tiers (name, name_ar, description, description_ar, price_monthly, price_yearly, max_jobs, max_candidates, max_users, max_storage_gb, features, sort_order) VALUES
  ('Starter', 'المبتدئ', 'Perfect for small teams getting started with recruitment', 'مثالي للفرق الصغيرة التي تبدأ في التوظيف', 299, 2990, 5, 1000, 3, 10, '{"ai_parsing": true, "basic_analytics": true, "email_templates": 5}', 1),
  ('Professional', 'المحترف', 'For growing teams with advanced hiring needs', 'للفرق النامية ذات احتياجات التوظيف المتقدمة', 799, 7990, 25, 10000, 15, 50, '{"ai_parsing": true, "advanced_analytics": true, "white_label": true, "email_templates": 25, "custom_workflows": true}', 2),
  ('Enterprise', 'المؤسسة', 'Full-featured solution for large organizations', 'حل كامل للمؤسسات الكبيرة', 2999, 29990, -1, -1, -1, 500, '{"ai_parsing": true, "advanced_analytics": true, "white_label": true, "api_access": true, "email_templates": -1, "custom_workflows": true, "dedicated_support": true, "sso": true}', 3);