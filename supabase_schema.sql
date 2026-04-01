-- ============================================================
-- BYNDIO PLATFORM - Complete Supabase Database Schema
-- Run this entire file in Supabase → SQL Editor → New Query
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'influencer', 'admin')),
  referral_code TEXT UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
  referred_by UUID REFERENCES public.users(id),
  subscription_plan TEXT DEFAULT 'free',
  kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  reward_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KYC SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  dob DATE,
  pan_number TEXT,
  aadhaar_number TEXT,
  gst_number TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  bank_name TEXT,
  address TEXT,
  pincode TEXT,
  state TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id)
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  seller_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 100,
  sku TEXT,
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_sponsored BOOLEAN DEFAULT FALSE,
  is_creator_pick BOOLEAN DEFAULT FALSE,
  creator_name TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  buyer_id UUID REFERENCES public.users(id) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method TEXT DEFAULT 'online',
  shipping_address JSONB DEFAULT '{}',
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  affiliate_code TEXT
);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SELLERS TABLE
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  gst_number TEXT,
  pan_number TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  bank_name TEXT,
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.5,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INFLUENCERS TABLE
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  social_media_links JSONB DEFAULT '{}',
  total_followers INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 10,
  niche TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AFFILIATE LINKS TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  link_code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 8,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 10. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(10,2) DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_withdrawn NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REWARD POINTS TABLE
CREATE TABLE IF NOT EXISTS public.reward_points (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FLASH SALES TABLE
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  title TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_pct INTEGER NOT NULL,
  original_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  max_quantity INTEGER DEFAULT 100,
  sold_quantity INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hero_title TEXT DEFAULT 'Shop Smarter. Earn More. Sell Free.',
  hero_subtitle TEXT DEFAULT 'India''s first zero-commission marketplace with built-in influencer monetization',
  footer_about TEXT DEFAULT 'BYNDIO is India''s most creator-friendly marketplace.',
  contact_email TEXT DEFAULT 'team@byndio.in',
  contact_phone TEXT DEFAULT '+91 98765 43210',
  contact_address TEXT DEFAULT 'Mumbai, Maharashtra, India'
);

-- 14. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. RETURNS TABLE
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  user_id UUID REFERENCES public.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  refund_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. KYC_SUBMISSIONS ALREADY CREATED ABOVE

-- 17. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. CAMPAIGN APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.campaign_applications (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  brand_name TEXT,
  applicant_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  bank_account TEXT,
  ifsc_code TEXT,
  bank_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================
-- DISABLE RLS ON ALL TABLES (Simple setup for development)
-- For production, replace with proper RLS policies below
-- ============================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA: Insert default site settings
-- ============================================================
INSERT INTO public.site_settings (id, hero_title, hero_subtitle, footer_about, contact_email, contact_phone, contact_address)
VALUES (
  1,
  'Shop Smarter. Earn More. Sell Free.',
  'India''s first zero-commission marketplace with built-in influencer monetization',
  'BYNDIO is India''s most creator-friendly marketplace. Zero commission for sellers. Real earnings for creators.',
  'team@byndio.in',
  '+91 98765 43210',
  'Mumbai, Maharashtra, India'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MAKE YOUR ACCOUNT ADMIN
-- Replace the email below with YOUR email
-- ============================================================
-- UPDATE public.users SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================================
-- DONE! All tables created successfully.
-- ============================================================
