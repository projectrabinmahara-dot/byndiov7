import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { PRODUCTS as LOCAL_PRODUCTS } from './data';

// All shared interfaces live in types.ts to avoid circular dependency:
// store.ts → data.ts → store.ts  (was the cycle — now both point to types.ts)
export type {
  Product,
  CartItem,
  User,
  SiteSettings,
  Order,
  AffiliateLink,
  FlashSale,
} from './types';

import type {
  Product,
  CartItem,
  User,
  SiteSettings,
  Order,
  AffiliateLink,
  FlashSale,
} from './types';

interface AppState {
  products: Product[];
  isLoadingProducts: boolean;
  cart: CartItem[];
  wishlist: (number | string)[];
  recentlyViewed: (number | string)[];
  user: User | null;
  isAuthLoading: boolean;
  siteSettings: SiteSettings | null;
  myOrders: Order[];
  isLoadingOrders: boolean;
  affiliateLinks: AffiliateLink[];
  flashSales: FlashSale[];
  walletBalance: number;
  rewardPoints: number;

  fetchProducts: () => Promise<void>;
  fetchSiteSettings: () => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  fetchAffiliateLinks: () => Promise<void>;
  fetchFlashSales: () => Promise<void>;
  fetchWalletData: () => Promise<void>;
  generateAffiliateLink: (productId: string) => Promise<string | null>;
  addRecentlyViewed: (id: number | string) => void;

  addToCart: (product: Product, qty?: number, affiliateCode?: string) => void;
  removeFromCart: (id: number | string) => void;
  updateQty: (id: number | string, delta: number) => void;
  toggleWishlist: (id: number | string) => void;
  clearCart: () => void;

  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initAuth: () => void;
  subscribeWithRazorpay: (planName: string, amountMonthly: number) => Promise<void>;
}

// Helper to push a notification to the DB for a user
export async function pushNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string,
) {
  const { supabase: sb } = await import('./lib/supabase');
  await sb.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    action_url: actionUrl || null,
  }).then(() => {});
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: LOCAL_PRODUCTS,
      isLoadingProducts: false,
      cart: [],
      wishlist: [],
      recentlyViewed: [],
      user: null,
      isAuthLoading: true,
      siteSettings: null,
      myOrders: [],
      isLoadingOrders: false,
      affiliateLinks: [],
      flashSales: [],
      walletBalance: 0,
      rewardPoints: 0,

      initAuth: () => {
        // Skip all Supabase calls if env vars are not configured
        if (!isSupabaseConfigured()) {
          set({ isAuthLoading: false });
          return;
        }

        const buildUser = (sessionUser: any, profileData: any): User => {
          // Check subscription expiry — downgrade to 'free' if expired
          let activePlan = (profileData?.subscription_plan as User['subscription_plan']) || 'free';
          const expiresAt = profileData?.subscription_expires_at;
          if (expiresAt && new Date(expiresAt) < new Date() && activePlan !== 'free') {
            activePlan = 'free';
            // Async cleanup — don't block login
            supabase.from('users').update({ subscription_plan: 'free' }).eq('id', sessionUser.id).then(() => {});
          }
          return {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: profileData?.full_name || sessionUser.email?.split('@')[0] || 'User',
            role: (profileData?.role as User['role']) || 'buyer',
            subscription_plan: activePlan,
            reward_points: profileData?.reward_points,
          };
        };

        // Register auth state listener and store the unsubscribe handle.
        // Using the returned subscription (instead of a window flag) is the
        // correct pattern for React 18 StrictMode — the effect runs twice in
        // dev, so the second call gets its own subscription that is cleaned up
        // on unmount, avoiding double-listener accumulation in production.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            // Use maybeSingle() — won't 406 if row doesn't exist yet
            supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
              .then(({ data }) => {
                // Always log user in from session, even if profile row is missing
                const builtUser = buildUser(session.user, data);
                set({ user: builtUser, isAuthLoading: false });
                // Sync wishlist from DB
                supabase.from('wishlists').select('product_id').eq('user_id', session.user.id)
                  .then(({ data: wl }) => {
                    if (wl && wl.length > 0) {
                      const dbWishlist = wl.map((w: any) => w.product_id);
                      const localWishlist = get().wishlist;
                      const merged = Array.from(new Set([...localWishlist.map(String), ...dbWishlist]));
                      set({ wishlist: merged });
                      // Upload any local items not yet in DB
                      const toUpload = localWishlist.filter(id => !dbWishlist.includes(String(id)));
                      if (toUpload.length > 0) {
                        supabase.from('wishlists').upsert(
                          toUpload.map(id => ({ user_id: session.user.id, product_id: String(id) })),
                          { onConflict: 'user_id,product_id' }
                        ).then(() => {});
                      }
                    }
                  }).catch((err) => { console.error('[store]', err); });
              })
              .catch(() => {
                set({ user: buildUser(session.user, null), isAuthLoading: false });
              });
          } else {
            set({ user: null, isAuthLoading: false });
          }
        });

        // Store unsubscribe on window so StrictMode's second effect call can
        // clean up the first subscription before registering a new one.
        if ((window as any).__byndioAuthUnsub) {
          (window as any).__byndioAuthUnsub();
        }
        (window as any).__byndioAuthUnsub = () => subscription.unsubscribe();

        // Always check current session on init
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
              .then(({ data }) => {
                set({ user: buildUser(session.user, data), isAuthLoading: false });
              })
              .catch(() => {
                set({ user: buildUser(session.user, null), isAuthLoading: false });
              });
          } else {
            set({ isAuthLoading: false });
          }
        });
      },

      fetchSiteSettings: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
          if (!error && data) set({ siteSettings: data });
        } catch (err) { console.error('[store]', err); }
      },

      fetchProducts: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoadingProducts: true });
        try {
          const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
          if (error) throw error;
          if (data && data.length > 0) {
            set({ products: data.map(p => ({
              id: p.id, name: p.name,
              brand: p.description?.replace('Brand: ', '') || 'Brand',
              cat: p.category, price: p.price, mrp: p.mrp,
              icon: p.images?.[0] || '📦',
              rating: p.avg_rating ?? 4.5, reviews: p.review_count ?? 0,
              inf: p.is_creator_pick ?? false, creator: p.creator_name,
              specs: Object.entries(p.specifications || {}) as [string, string][],
              is_sponsored: p.is_sponsored ?? false,
            })) });
          }
        } catch (err) { console.error('[store] fetchProducts:', err); }
        finally { set({ isLoadingProducts: false }); }
      },

      fetchMyOrders: async () => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) return;
        set({ isLoadingOrders: true });
        try {
          const { data } = await supabase.from('orders').select(`id,buyer_id,total_amount,status,payment_status,shipping_address,payment_method,created_at,order_items(id,quantity,price,products(name,images))`).eq('buyer_id', user.id).order('created_at', { ascending: false });
          if (data) set({ myOrders: data as Order[] });
        } catch (err) { console.error('[store]', err); }
        finally { set({ isLoadingOrders: false }); }
      },

      fetchAffiliateLinks: async () => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) return;
        try {
          const { data } = await supabase.from('affiliate_links').select('*, products(name, images, price)').eq('user_id', user.id).order('created_at', { ascending: false });
          if (data) set({ affiliateLinks: data.map(l => ({ ...l, product: l.products ? { name: l.products.name, icon: l.products.images?.[0] || '📦', price: l.products.price } : undefined })) });
        } catch (err) { console.error('[store]', err); }
      },

      fetchFlashSales: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const now = new Date().toISOString();
          const { data } = await supabase.from('flash_sales').select('*, products(name,images)').eq('is_active', true).gte('ends_at', now).order('ends_at');
          if (data) set({ flashSales: data });
        } catch (err) { console.error('[store]', err); }
      },

      fetchWalletData: async () => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) return;
        try {
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          const { data: points } = await supabase.from('reward_points').select('points').eq('user_id', user.id);
          const totalPoints = points?.reduce((s, p) => s + p.points, 0) ?? 0;
          set({ walletBalance: wallet?.balance ?? 0, rewardPoints: totalPoints });
        } catch (err) { console.error('[store]', err); }
      },

      generateAffiliateLink: async (productId: string) => {
        const { user } = get();
        if (!user) return null;
        try {
          const code = `${user.id.slice(0,8)}-${productId.slice(0,8)}-${Date.now().toString(36)}`;
          const { data, error } = await supabase.from('affiliate_links').upsert({
            user_id: user.id, product_id: productId, link_code: code,
            commission_rate: user.role === 'influencer' ? 10 : 8,
          }, { onConflict: 'user_id,product_id' }).select().single();
          if (error) throw error;
          await get().fetchAffiliateLinks();
          return data.link_code;
        } catch (err) { console.error('[store]', err); return null; }
      },

      addRecentlyViewed: (id) => {
        set(state => ({
          recentlyViewed: [id, ...state.recentlyViewed.filter(i => i !== id)].slice(0, 20),
        }));
      },

      addToCart: (product, qty = 1, affiliateCode) =>
        set(state => {
          const existing = state.cart.find(i => i.id === product.id);
          if (existing) return { cart: state.cart.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i) };
          return { cart: [...state.cart, { ...product, qty, affiliate_code: affiliateCode }] };
        }),
      removeFromCart: id => set(state => ({ cart: state.cart.filter(i => i.id !== id) })),
      updateQty: (id, delta) => set(state => ({ cart: state.cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i) })),
      toggleWishlist: (id) => {
        const { user, wishlist } = get();
        const isIn = wishlist.includes(id);
        set({ wishlist: isIn ? wishlist.filter(w => w !== id) : [...wishlist, id] });
        if (user) {
          if (isIn) {
            supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', String(id)).then(() => {});
          } else {
            supabase.from('wishlists').upsert({ user_id: user.id, product_id: String(id) }, { onConflict: 'user_id,product_id' }).then(() => {});
          }
        }
      },
      clearCart: () => set({ cart: [] }),
      setUser: user => set({ user }),
      subscribeWithRazorpay: async (planName: string, amountMonthly: number) => {
        const { user } = get();
        if (!user) throw new Error('Login required');
        const razorpayKeyId = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKeyId || !(window as any).Razorpay) {
          // Demo mode — just upsert subscription record
          await supabase.from('subscriptions').upsert({
            user_id: user.id,
            plan_name: planName,
            status: 'active',
            amount: amountMonthly,
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
            payment_method: 'demo',
          }, { onConflict: 'user_id' });
          await supabase.from('users').update({
            subscription_plan: planName,
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
          }).eq('id', user.id);
          set(state => ({ user: state.user ? { ...state.user, subscription_plan: planName } : null }));
          return;
        }
        return new Promise((resolve, reject) => {
          const options = {
            key: razorpayKeyId,
            amount: amountMonthly * 100,
            currency: 'INR',
            name: 'BYNDIO',
            description: `${planName} Plan — Monthly`,
            handler: async (response: { razorpay_payment_id: string }) => {
              try {
                await supabase.from('subscriptions').upsert({
                  user_id: user.id,
                  plan_name: planName,
                  status: 'active',
                  amount: amountMonthly,
                  started_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
                  payment_method: 'razorpay',
                  payment_id: response.razorpay_payment_id,
                }, { onConflict: 'user_id' });
                await supabase.from('users').update({
                  subscription_plan: planName,
                  subscription_expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
                }).eq('id', user.id);
                set(state => ({ user: state.user ? { ...state.user, subscription_plan: planName } : null }));
                resolve();
              } catch (err) { reject(err); }
            },
            prefill: { name: user.name, email: user.email },
            theme: { color: '#0D47A1' },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', () => reject(new Error('Payment failed')));
          rzp.open();
        });
      },
      logout: async () => { await supabase.auth.signOut(); set({ user: null, cart: [], wishlist: [], myOrders: [], affiliateLinks: [], walletBalance: 0, rewardPoints: 0 }); },
    }),
    { name: 'byndio-storage', partialize: state => ({ cart: state.cart, wishlist: state.wishlist, recentlyViewed: state.recentlyViewed }) }
  )
);
