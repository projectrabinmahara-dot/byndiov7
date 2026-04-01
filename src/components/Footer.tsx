import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAppStore } from '../store';

export default function Footer() {
  const siteSettings = useAppStore(s => s.siteSettings);
  const footerAbout = siteSettings?.footer_about || "India's 0% commission social commerce ecosystem. Revenue from logistics, ads & subscriptions — never from seller margins.";
  const contactEmail = siteSettings?.contact_email || "support@byndio.in";
  const contactPhone = siteSettings?.contact_phone || "1800-BYNDIO (toll free)";
  const contactAddress = siteSettings?.contact_address || "Mumbai, Maharashtra, India";

  return (
    <footer className="bg-[#0D47A1] text-white pt-10 pb-5 px-6 mt-auto">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8 max-w-6xl mx-auto">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="text-xl font-black flex items-center gap-2 mb-2.5">
            <span className="bg-[#F57C00] px-2 py-0.5 rounded text-sm"><ShoppingBag size={16} /></span> BYNDIO
          </div>
          <div className="text-xs opacity-75 leading-relaxed max-w-[240px] mb-3">{footerAbout}</div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {['0% Commission', 'Secure Payments', 'Fast Delivery', 'Easy Returns'].map(t => (
              <span key={t} className="bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold">{t}</span>
            ))}
          </div>
          {/* Social Links */}
          <div className="flex gap-3 items-center">
            {[
              { href: 'https://instagram.com/byndio.official', label: 'Instagram', svg: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
              { href: 'https://youtube.com/@byndio', label: 'YouTube', svg: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
              { href: 'https://twitter.com/byndio', label: 'Twitter/X', svg: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { href: 'https://linkedin.com/company/byndio', label: 'LinkedIn', svg: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-80">
                  <path d={s.svg}/>
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* For Sellers */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">For Sellers</h4>
          <Link to="/seller" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Start Selling FREE</Link>
          <Link to="/seller-dashboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Seller Dashboard</Link>
          <Link to="/affiliate" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Affiliate Program</Link>
          <Link to="/b2b" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">B2B Supply</Link>
        </div>

        {/* For Buyers */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">For Buyers</h4>
          <Link to="/products" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Browse Products</Link>
          <Link to="/my-orders" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Track My Orders</Link>
          <Link to="/returns" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Returns & Refunds</Link>
          <Link to="/rewards" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Rewards & Wallet</Link>
          <Link to="/flash-sales" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">⚡ Flash Sales</Link>
        </div>

        {/* For Creators */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">Creators & Partners</h4>
          <Link to="/influencer" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Join Creator Hub</Link>
          <Link to="/creator-dashboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Creator Dashboard</Link>
          <Link to="/affiliate" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Affiliate Engine</Link>
          <Link to="/leaderboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">🏆 Leaderboard</Link>
          <Link to="/compare" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Compare Products</Link>
        </div>

        {/* Contact + App Download */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">Contact Us</h4>
          <div className="text-xs opacity-70 mb-1.5">📧 {contactEmail}</div>
          <div className="text-xs opacity-70 mb-1.5">📞 {contactPhone}</div>
          <div className="text-xs opacity-70 mb-4">📍 {contactAddress}</div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-2">Revenue Model</h4>
          <div className="text-[10px] opacity-60 leading-relaxed">Logistics margin · Platform fees · Seller ads · Subscriptions · B2B leads · Affiliate commissions</div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mt-4 mb-2">Download App</h4>
          <div className="flex flex-col gap-2">
            <a href="#" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors">
              <span className="text-lg">🍎</span>
              <div>
                <div className="text-[9px] opacity-70">Coming soon on</div>
                <div className="text-[12px] font-bold">App Store</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors">
              <span className="text-lg">▶️</span>
              <div>
                <div className="text-[9px] opacity-70">Coming soon on</div>
                <div className="text-[12px] font-bold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 pt-4 flex flex-wrap justify-between gap-2.5 max-w-6xl mx-auto">
        <p className="text-[11px] opacity-55">© {new Date().getFullYear()} BYNDIO Technologies Pvt Ltd. All rights reserved. | <a href="/about" className="hover:opacity-100 transition-opacity">About & Grievance Officer</a></p>
        <div className="flex gap-4">
          <Link to="/legal/privacy" className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Privacy Policy</Link>
          <Link to="/legal/terms" className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Terms of Use</Link>
          <Link to="/legal/refund" className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
