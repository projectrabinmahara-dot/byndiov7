-- ============================================================
-- BYNDIO — Complete Production Database Schema v2
-- Run this ONCE in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin','buyer','seller','influencer')),
    avatar_url TEXT,
    phone_number TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    subscription_plan TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- SELLERS
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID REFERENCES public.users(id) PRIMARY KEY,
    business_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    business_address TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    category TEXT DEFAULT 'General',
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
    gst_verified BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free','pro','enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- INFLUENCERS
CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID REFERENCES public.users(id) PRIMARY KEY,
    social_media_links JSONB DEFAULT '{}',
    total_followers INTEGER DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- PRODUCTS — 'name' column (NOT 'title') to match all frontend code
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    sku TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    hsn_code TEXT,
    is_active BOOLEAN DEFAULT true,
    is_sponsored BOOLEAN DEFAULT false,
    sponsored_until TIMESTAMP WITH TIME ZONE,
    is_creator_pick BOOLEAN DEFAULT false,
    creator_name TEXT,
    avg_rating DECIMAL(3,2) DEFAULT 4.5,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
    payment_method TEXT NOT NULL,
    payment_id TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}',
    affiliate_code TEXT,
    affiliate_commission DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 10,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    cod_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ORDER ITEMS — 'price' column (NOT 'price_at_time'), seller_id → users(id) NOT sellers(id)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    seller_id UUID REFERENCES public.users(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(product_id, user_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) NOT NULL,
    receiver_id UUID REFERENCES public.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- SITE SETTINGS (single row)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'Shop Beyond Ordinary',
    hero_subtitle TEXT DEFAULT '0% commission for sellers. 20,000+ creators. Transparent prices.',
    footer_about TEXT DEFAULT 'India''s 0% commission social commerce ecosystem.',
    contact_email TEXT DEFAULT 'support@byndio.in',
    contact_phone TEXT DEFAULT '1800-BYNDIO',
    contact_address TEXT DEFAULT 'Mumbai, Maharashtra, India',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    CONSTRAINT site_settings_single_row CHECK (id = 1)
);
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- AFFILIATE LINKS
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    link_code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- FLASH SALES
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    discount_pct INTEGER NOT NULL CHECK (discount_pct BETWEEN 1 AND 95),
    original_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    max_quantity INTEGER NOT NULL DEFAULT 100,
    sold_quantity INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- REWARD POINTS
CREATE TABLE IF NOT EXISTS public.reward_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    action TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_withdrawn DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- RETURN REQUESTS
CREATE TABLE IF NOT EXISTS public.return_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','picked_up','refunded')),
    refund_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- PRODUCT Q&A
CREATE TABLE IF NOT EXISTS public.product_qa (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES public.users(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- RECENTLY VIEWED
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- B2B LEADS
CREATE TABLE IF NOT EXISTS public.b2b_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id),
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT,
    company_name TEXT,
    gst_number TEXT,
    product_category TEXT NOT NULL,
    product_description TEXT NOT NULL,
    quantity TEXT NOT NULL,
    budget TEXT,
    delivery_location TEXT NOT NULL,
    delivery_timeline TEXT,
    is_otp_verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','closed','expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- B2B LEAD ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.b2b_lead_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.b2b_leads(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES public.users(id) NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent','viewed','responded','closed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_select"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_insert"   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_own_update"   ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_admin_select" ON public.users FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "sellers_own"    ON public.sellers FOR ALL USING (auth.uid() = id);
CREATE POLICY "sellers_public" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "influencers_own" ON public.influencers FOR ALL USING (auth.uid() = id);

CREATE POLICY "products_public"   ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "products_own"      ON public.products FOR ALL   USING (auth.uid() = seller_id);
CREATE POLICY "products_admin"    ON public.products FOR ALL   USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "orders_buyer"       ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_buyer_ins"   ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_seller_sel"  ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = id AND seller_id = auth.uid()));
CREATE POLICY "orders_admin"       ON public.orders FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "oi_buyer"  ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));
CREATE POLICY "oi_seller" ON public.order_items FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "oi_insert" ON public.order_items FOR INSERT  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));

CREATE POLICY "reviews_public"     ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_ins"    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_own_upd"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "msg_own"  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_send" ON public.messages FOR INSERT  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "ss_public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "ss_admin"  ON public.site_settings FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "aff_own"    ON public.affiliate_links FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "aff_public" ON public.affiliate_links FOR SELECT USING (is_active = true);

CREATE POLICY "fs_public" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "fs_admin"  ON public.flash_sales FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "rp_own"    ON public.reward_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rp_insert" ON public.reward_points FOR INSERT  WITH CHECK (true);

CREATE POLICY "wallet_sel"    ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_ins"    ON public.wallets FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallet_upd"    ON public.wallets FOR UPDATE  USING (true);

CREATE POLICY "ret_own"   ON public.return_requests FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "ret_admin" ON public.return_requests FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "qa_public" ON public.product_qa FOR SELECT USING (is_approved = true);
CREATE POLICY "qa_ins"    ON public.product_qa FOR INSERT  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rv_own" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "b2b_ins"   ON public.b2b_leads FOR INSERT  WITH CHECK (true);
CREATE POLICY "b2b_sel"   ON public.b2b_leads FOR SELECT  USING (auth.uid() = buyer_id OR (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin','seller'));
CREATE POLICY "b2ba_own"  ON public.b2b_lead_assignments FOR ALL    USING (auth.uid() = supplier_id);
CREATE POLICY "b2ba_adm"  ON public.b2b_lead_assignments FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');
CREATE POLICY "sub_own"   ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER upd_users    BEFORE UPDATE ON public.users    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_orders   BEFORE UPDATE ON public.orders   FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_returns  BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || EXTRACT(EPOCH FROM now())::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END; $$;
CREATE TRIGGER set_referral_code BEFORE INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE generate_referral_code();

-- Auto-create wallet for every new user (fixes Google OAuth path)
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_user_created_wallet AFTER INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE create_user_wallet();

-- Update product avg_rating after review insert/update/delete
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_pid UUID;
BEGIN
  v_pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products SET
    avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE product_id = v_pid),
    review_count = (SELECT COUNT(*)                       FROM public.reviews WHERE product_id = v_pid)
  WHERE id = v_pid;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER update_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE update_product_rating();

-- SAFE atomic increment for reward points (no race condition)
CREATE OR REPLACE FUNCTION increment_reward_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET total_reward_points = COALESCE(total_reward_points, 0) + p_points WHERE id = p_user_id;
END; $$;

-- Award points on order delivery
CREATE OR REPLACE FUNCTION award_points_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_points INTEGER;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    v_points := GREATEST(1, FLOOR(NEW.total_amount / 10)::INTEGER);
    INSERT INTO public.reward_points (user_id, points, action, order_id)
      VALUES (NEW.buyer_id, v_points, 'purchase', NEW.id);
    PERFORM increment_reward_points(NEW.buyer_id, v_points);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER order_delivery_points AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE award_points_on_delivery();

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.affiliate_leaderboard AS
SELECT
  u.id, u.full_name, u.role,
  COALESCE(SUM(al.total_earnings), 0)::NUMERIC  AS total_earned,
  COALESCE(SUM(al.clicks), 0)::INTEGER           AS total_clicks,
  COALESCE(SUM(al.conversions), 0)::INTEGER      AS total_sales,
  COALESCE(COUNT(al.id), 0)::INTEGER             AS link_count,
  RANK() OVER (ORDER BY COALESCE(SUM(al.total_earnings), 0) DESC) AS rank
FROM public.users u
LEFT JOIN public.affiliate_links al ON al.user_id = u.id AND al.is_active = true
WHERE u.role IN ('influencer','seller')
GROUP BY u.id, u.full_name, u.role
ORDER BY total_earned DESC;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_cat    ON public.products(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer    ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_oi_order        ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_seller       ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_prod    ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_aff_user        ON public.affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_aff_code        ON public.affiliate_links(link_code);
CREATE INDEX IF NOT EXISTS idx_msg_sender      ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_receiver    ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_flash_active    ON public.flash_sales(ends_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rp_user         ON public.reward_points(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_status      ON public.b2b_leads(status);
CREATE INDEX IF NOT EXISTS idx_rv_user         ON public.recently_viewed(user_id);

-- ============================================================
-- PATCH: Missing tables and policies (Bug fixes)
-- ============================================================

-- KYC Submissions table (was missing)
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE(user_id)
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc_own" ON public.kyc_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "kyc_admin" ON public.kyc_submissions FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

-- Seller applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT, email TEXT, phone TEXT,
  business_name TEXT, category TEXT, monthly_revenue TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_insert" ON public.seller_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "sa_admin" ON public.seller_applications FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

-- Influencer applications table
CREATE TABLE IF NOT EXISTS public.influencer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT, email TEXT, phone TEXT,
  instagram_handle TEXT, youtube_channel TEXT,
  followers_count TEXT, category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.influencer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_insert" ON public.influencer_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ia_admin" ON public.influencer_applications FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

-- Affiliate applications table
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT, email TEXT, phone TEXT,
  website TEXT, category TEXT, audience_size TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "afa_insert" ON public.affiliate_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "afa_admin" ON public.affiliate_applications FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

-- Campaign applications table
CREATE TABLE IF NOT EXISTS public.campaign_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT, campaign_title TEXT, brand TEXT,
  message TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_insert" ON public.campaign_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ca_admin" ON public.campaign_applications FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

-- Fix subscriptions: add missing INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'sub_insert'
  ) THEN
    CREATE POLICY "sub_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Wishlists table (for cross-device sync)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl_own" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Admin seed: run this manually with your email
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

-- ============================================================
-- PATCH 2: KYC document URL columns + Storage bucket
-- ============================================================

-- Add document URL columns to kyc_submissions
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS pan_doc_url     TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url      TEXT;

-- Storage bucket for KYC docs (run this in Supabase Dashboard > Storage OR via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only the owner and admins can read their own KYC docs
-- CREATE POLICY "kyc_upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[2]);
-- CREATE POLICY "kyc_read_own" ON storage.objects FOR SELECT
--   USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- NOTE: Create the 'kyc-documents' bucket in Supabase Dashboard > Storage > New Bucket
-- Set it as PRIVATE (not public). Then enable RLS on the bucket.

-- ============================================================
-- PATCH 3: Subscription table improvements
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_name  TEXT,
  ADD COLUMN IF NOT EXISTS plan_role  TEXT,
  ADD COLUMN IF NOT EXISTS price      NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add commission_rate to influencers table
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10;

-- ============================================================
-- PATCH 4: Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'system',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own"   ON public.notifications FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "notif_admin" ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================================
-- FEATURE PATCH: Notifications + KYC Storage
-- ============================================================

-- Notifications table (real, not mock)

-- ============================================================
-- SUPABASE STORAGE BUCKET SETUP INSTRUCTIONS
-- ============================================================
-- Run this in Supabase Dashboard > Storage > New Bucket:
--   Name: kyc-documents
--   Public: false (private — only accessible via signed URLs)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--
-- Then add RLS policies on storage.objects:
--   INSERT: auth.uid()::text = (storage.foldername(name))[2]
--   SELECT: auth.uid()::text = (storage.foldername(name))[2]
--   DELETE: auth.uid()::text = (storage.foldername(name))[2]
-- ============================================================

-- ============================================================
-- NOTIFICATION TRIGGERS — auto-create notifications on events
-- ============================================================

-- Helper: insert a notification row
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID, p_type TEXT, p_title TEXT,
  p_message TEXT, p_action_url TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url);
EXCEPTION WHEN OTHERS THEN NULL; -- never block the parent transaction
END; $$;

-- Notify buyer when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    PERFORM notify_user(
      NEW.buyer_id,
      'order',
      CASE NEW.status
        WHEN 'processing' THEN '📦 Order Confirmed'
        WHEN 'shipped'    THEN '🚚 Order Shipped!'
        WHEN 'delivered'  THEN '🏠 Order Delivered!'
        WHEN 'cancelled'  THEN '❌ Order Cancelled'
        ELSE '📋 Order Update'
      END,
      CASE NEW.status
        WHEN 'processing' THEN 'Your order #' || UPPER(LEFT(NEW.id::text, 8)) || ' is being processed.'
        WHEN 'shipped'    THEN 'Great news! Your order #' || UPPER(LEFT(NEW.id::text, 8)) || ' is on its way.'
        WHEN 'delivered'  THEN 'Your order #' || UPPER(LEFT(NEW.id::text, 8)) || ' has been delivered. Enjoy!'
        WHEN 'cancelled'  THEN 'Your order #' || UPPER(LEFT(NEW.id::text, 8)) || ' has been cancelled. Refund will be processed shortly.'
        ELSE 'Your order status has been updated to: ' || NEW.status
      END,
      '/my-orders'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;
CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE notify_order_status_change();

-- Notify buyer when order is placed (INSERT)
CREATE OR REPLACE FUNCTION notify_order_placed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM notify_user(
    NEW.buyer_id, 'order',
    '🎉 Order Placed Successfully!',
    'Your order #' || UPPER(LEFT(NEW.id::text, 8)) || ' has been placed. We will confirm it shortly.',
    '/my-orders'
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_placed ON public.orders;
CREATE TRIGGER trg_notify_order_placed
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE notify_order_placed();

-- Notify seller when they receive a new order
CREATE OR REPLACE FUNCTION notify_seller_new_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    PERFORM notify_user(
      NEW.seller_id, 'payment',
      '💰 New Order Received!',
      'You have a new order for ₹' || NEW.price::text || '. Ship it promptly to maintain your rating.',
      '/seller-dashboard'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_seller_order ON public.order_items;
CREATE TRIGGER trg_notify_seller_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE PROCEDURE notify_seller_new_order();

-- Notify affiliate when they earn a commission
CREATE OR REPLACE FUNCTION notify_affiliate_commission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.conversions > OLD.conversions THEN
    PERFORM notify_user(
      NEW.user_id, 'payment',
      '💸 Affiliate Commission Earned!',
      'You earned ₹' || (NEW.total_earnings - OLD.total_earnings)::text || ' from a new sale via your affiliate link!',
      '/rewards'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_affiliate ON public.affiliate_links;
CREATE TRIGGER trg_notify_affiliate
  AFTER UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE PROCEDURE notify_affiliate_commission();

-- Notify user when KYC status changes
CREATE OR REPLACE FUNCTION notify_kyc_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    PERFORM notify_user(
      NEW.user_id, 'kyc',
      CASE NEW.status
        WHEN 'approved' THEN '✅ KYC Approved!'
        WHEN 'rejected' THEN '❌ KYC Rejected'
        ELSE '🔍 KYC Under Review'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Your KYC verification is complete. You can now withdraw earnings instantly!'
        WHEN 'rejected' THEN 'Your KYC was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Please resubmit with clearer documents.')
        ELSE 'Your KYC documents are under review. We will notify you within 24–48 hours.'
      END,
      '/kyc'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_kyc ON public.kyc_submissions;
CREATE TRIGGER trg_notify_kyc
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE PROCEDURE notify_kyc_status();

-- Notify user when reward points are credited
CREATE OR REPLACE FUNCTION notify_reward_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.points > 0 THEN
    PERFORM notify_user(
      NEW.user_id, 'referral',
      '🎁 Reward Points Credited!',
      '+' || NEW.points::text || ' points added for: ' || REPLACE(NEW.action, '_', ' ') || '. Keep earning!',
      '/rewards'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_points ON public.reward_points;
CREATE TRIGGER trg_notify_points
  AFTER INSERT ON public.reward_points
  FOR EACH ROW EXECUTE PROCEDURE notify_reward_points();

-- ============================================================
-- SUPABASE STORAGE BUCKETS (run manually or via Supabase UI)
-- ============================================================
-- Create these buckets in Supabase Dashboard → Storage:
-- 1. Bucket name: 'kyc-documents'  | Private: YES | Max file size: 5MB
--    Allowed MIME: image/jpeg, image/png, image/webp, application/pdf
-- 2. Bucket name: 'product-images' | Private: NO  | Max file size: 10MB
--    Allowed MIME: image/jpeg, image/png, image/webp
--
-- Storage RLS policies (run in SQL editor):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES ('kyc-documents', 'kyc-documents', false, 5242880,
--           ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
--   ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES ('product-images', 'product-images', true, 10485760,
--           ARRAY['image/jpeg','image/png','image/webp'])
--   ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PATCH 5: Stock management
-- ============================================================

-- Decrement stock when order item is inserted
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_item_stock_decrement ON public.order_items;
CREATE TRIGGER order_item_stock_decrement
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order();

-- Restore stock if order is cancelled
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.products p
    SET stock_quantity = stock_quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_cancel_stock_restore ON public.orders;
CREATE TRIGGER order_cancel_stock_restore
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_cancel();

-- Prevent ordering out-of-stock items
CREATE OR REPLACE FUNCTION check_stock_before_order()
RETURNS TRIGGER AS $$
DECLARE
  available INT;
BEGIN
  SELECT stock_quantity INTO available FROM public.products WHERE id = NEW.product_id;
  IF available IS NOT NULL AND available < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_item_stock_check ON public.order_items;
CREATE TRIGGER order_item_stock_check
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_before_order();

-- ============================================================
-- PATCH 6: Order cancellation + Seller payouts + Reviews verified
-- ============================================================

-- Seller payouts table
CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount       NUMERIC NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  payment_ref  TEXT,
  period_start DATE,
  period_end   DATE,
  items_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  paid_at      TIMESTAMPTZ
);
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_own"   ON public.seller_payouts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "payout_admin" ON public.seller_payouts FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Add cancellation columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason    TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by     UUID REFERENCES public.users(id);

-- Verified purchase check for reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT false;

-- Function to check if reviewer purchased the product
CREATE OR REPLACE FUNCTION verify_purchase_on_review()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.buyer_id = NEW.user_id
      AND oi.product_id = NEW.product_id
      AND o.status = 'delivered'
  ) THEN
    NEW.is_verified_purchase := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_purchase_verify ON public.reviews;
CREATE TRIGGER review_purchase_verify
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION verify_purchase_on_review();

-- Seller earnings view
CREATE OR REPLACE VIEW public.seller_earnings AS
SELECT
  oi.seller_id,
  COUNT(DISTINCT o.id)       AS total_orders,
  SUM(oi.price * oi.quantity) AS gross_revenue,
  SUM(oi.price * oi.quantity) AS net_revenue,
  MAX(o.created_at)          AS last_sale_at
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled') AND o.payment_status = 'paid'
GROUP BY oi.seller_id;

-- ============================================================
-- PATCH 7: Storage buckets + Shiprocket tracking columns
-- ============================================================

-- Add shipping tracking columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shiprocket_order_id  TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_awb          TEXT,
  ADD COLUMN IF NOT EXISTS courier_name          TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url          TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_id             TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount         NUMERIC;

-- Add TDS tracking to seller_payouts
ALTER TABLE public.seller_payouts
  ADD COLUMN IF NOT EXISTS tds_amount    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_rate      NUMERIC DEFAULT 1;

-- NOTE: Create these Storage buckets in Supabase Dashboard > Storage:
-- 1. "product-images" — PUBLIC bucket (product images need to be publicly viewable)
-- 2. "kyc-documents"  — PRIVATE bucket (already in previous patch)

-- Storage policy for product-images (public read, owner write)
-- These must be run in Supabase Dashboard > Storage > Policies:
-- SELECT: true (public)
-- INSERT: auth.uid()::text = (storage.foldername(name))[2]
-- UPDATE: auth.uid()::text = (storage.foldername(name))[2]
-- DELETE: auth.uid()::text = (storage.foldername(name))[2]

-- ============================================================
-- PATCH 8: Coupons table for Admin Coupon Manager
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  type       TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','flat')),
  value      NUMERIC NOT NULL,
  min_order  NUMERIC DEFAULT 0,
  max_uses   INTEGER,
  uses       INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  expiry     TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_admin" ON public.coupons FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');
CREATE POLICY "coupons_read" ON public.coupons FOR SELECT USING (is_active = true);
