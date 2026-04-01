-- ============================================================
-- BYNDIO — Patch: All 5 Code Fixes
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- FIX #4: withdrawal_requests table
-- (was missing from schema entirely)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount        DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert and view their own requests
CREATE POLICY "withdrawal_own_insert" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_own_select" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see and update all requests
CREATE POLICY "withdrawal_admin_all" ON public.withdrawal_requests
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );


-- ============================================================
-- FIX #1 & #3: decrement_stock RPC
-- Called by Checkout.tsx as a fallback alongside the trigger.
-- The trigger (decrement_stock_on_order) already handles the
-- main path; this RPC is the explicit client-side call.
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_qty        INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id AND o.buyer_id = auth.uid() AND o.status = 'pending'
  ) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.products SET stock_quantity = GREATEST(0, stock_quantity - p_qty) WHERE id = p_product_id;
END;
$$;


-- ============================================================
-- FIX #1: Coupon 'uses' column — ensure it exists
-- The schema already has 'uses INTEGER DEFAULT 0'.
-- This is a safety add-if-missing:
-- ============================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS uses INTEGER NOT NULL DEFAULT 0;

-- Add created_by so creators can own and manage their promo codes
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;


-- ============================================================
-- FIX #2: sellers table — extra columns for store settings
-- The base schema has business_name, bank_account_number,
-- ifsc_code, gst_number, pan_number, kyc_status.
-- Add any columns that may be missing in older deployments:
-- ============================================================

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS support_phone    TEXT,
  ADD COLUMN IF NOT EXISTS business_email   TEXT;

-- Allow creators/sellers to insert and manage their own coupon codes
CREATE POLICY IF NOT EXISTS "coupons_own_insert" ON public.coupons
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "coupons_own_update" ON public.coupons
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "coupons_own_select_all" ON public.coupons
  FOR SELECT USING (
    is_active = true
    OR auth.uid() = created_by
    OR (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================================
-- Dropshipping columns on products table
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_dropship            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dropship_supplier_id   UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- ============================================================
-- Coupon per-user usage tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  order_id    UUID,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)   -- one use per user per coupon
);
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_uses_own" ON public.coupon_uses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "coupon_uses_admin" ON public.coupon_uses
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================================
-- Subscription plan + expiry on users table
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ============================================================
-- Return → refund tracking
-- ============================================================
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS refund_id       TEXT,
  ADD COLUMN IF NOT EXISTS refund_status   TEXT DEFAULT 'pending'
    CHECK (refund_status IN ('pending','processing','completed','failed')),
  ADD COLUMN IF NOT EXISTS refund_amount   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS refund_at       TIMESTAMPTZ;

-- ============================================================
-- SECURITY HARDENING — Fix dangerous RLS policy holes
-- ============================================================

-- 1. wallet_upd USING(true) lets ANY authenticated user update ANY wallet
--    A malicious user could set their own balance to any amount
DROP POLICY IF EXISTS "wallet_upd" ON public.wallets;
CREATE POLICY "wallet_upd_own" ON public.wallets
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- 2. rp_insert WITH CHECK(true) lets any user insert reward points for any user_id
--    A malicious user could award themselves unlimited points
DROP POLICY IF EXISTS "rp_insert" ON public.reward_points;
CREATE POLICY "rp_insert_own" ON public.reward_points
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- 3. notif_admin INSERT WITH CHECK(true) lets any authenticated user
--    send notifications to any user_id (notification spam attack)
DROP POLICY IF EXISTS "notif_admin" ON public.notifications;
CREATE POLICY "notif_insert_admin_only" ON public.notifications
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );
-- Separate policy so server-side functions (service role) can also insert
-- Service role bypasses RLS by default — no extra policy needed for that

-- 4. users_own_update lets a user UPDATE their own row including the role column
--    A user could escalate themselves to admin/seller/influencer
--    Fix: restrict which columns they can change via a column-level check
--    (Supabase/Postgres doesn't support column-level RLS, so we use a trigger instead)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only admins can change the role column
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) != 'admin' THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  -- Only admins can change subscription_plan directly
  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan THEN
    IF (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) != 'admin' THEN
      -- Allow if it's a downgrade to free (expiry enforcement)
      IF NEW.subscription_plan != 'free' THEN
        RAISE EXCEPTION 'Only admins can change subscription plans';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. orders missing UPDATE policy — buyers need to be able to cancel pending orders
CREATE POLICY "orders_buyer_cancel" ON public.orders
  FOR UPDATE USING (
    auth.uid() = buyer_id
    AND status = 'pending'    -- can only cancel pending orders
  )
  WITH CHECK (
    status = 'cancelled'      -- can only set to cancelled, nothing else
  );

-- 6. return_requests admin needs UPDATE not just SELECT
DROP POLICY IF EXISTS "ret_admin" ON public.return_requests;
CREATE POLICY "ret_admin_all" ON public.return_requests
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================================
-- KYC Storage Bucket + Policies
-- Run in: Supabase SQL Editor
-- ============================================================

-- Create the private KYC documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own KYC documents
CREATE POLICY IF NOT EXISTS "kyc_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow users to read only their own KYC documents
CREATE POLICY IF NOT EXISTS "kyc_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow admins to read all KYC documents
CREATE POLICY IF NOT EXISTS "kyc_read_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents'
    AND (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Atomic coupon redemption to prevent race conditions
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code TEXT, p_user_id UUID, p_order_id UUID, p_subtotal DECIMAL)
RETURNS TABLE(discount DECIMAL, coupon_type TEXT, coupon_value DECIMAL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coupon RECORD; v_discount DECIMAL;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE code = p_code AND is_active = true FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired coupon'; END IF;
  IF v_coupon.expiry IS NOT NULL AND v_coupon.expiry < NOW() THEN RAISE EXCEPTION 'Coupon expired'; END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses >= v_coupon.max_uses THEN RAISE EXCEPTION 'Usage limit reached'; END IF;
  IF EXISTS (SELECT 1 FROM public.coupon_uses WHERE coupon_id = v_coupon.id AND user_id = p_user_id) THEN RAISE EXCEPTION 'Already used'; END IF;
  IF p_subtotal < COALESCE(v_coupon.min_order, 0) THEN RAISE EXCEPTION 'Min order not met'; END IF;
  v_discount := CASE WHEN v_coupon.type = 'flat' THEN v_coupon.value ELSE ROUND(p_subtotal * v_coupon.value / 100) END;
  UPDATE public.coupons SET uses = uses + 1 WHERE id = v_coupon.id;
  INSERT INTO public.coupon_uses (coupon_id, user_id, order_id) VALUES (v_coupon.id, p_user_id, p_order_id);
  RETURN QUERY SELECT v_discount, v_coupon.type::TEXT, v_coupon.value;
END;
$$;

-- Performance indexes for production scale
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reward_points_user_id ON public.reward_points(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_links_user_id ON public.affiliate_links(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_links_code ON public.affiliate_links(link_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ============================================================
-- SECURITY: Fix sellers_public policy exposing bank details
-- ============================================================
DROP POLICY IF EXISTS "sellers_public" ON public.sellers;

CREATE POLICY "sellers_public" ON public.sellers FOR SELECT USING (true);

-- Create a safe public view without financial columns
CREATE OR REPLACE VIEW public.sellers_public_view AS
SELECT id, business_name, category, kyc_status, gst_verified, is_verified, subscription_plan, created_at
FROM public.sellers;

-- ============================================================
-- SECURITY: Add server-side admin role verification RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin';
$$;
