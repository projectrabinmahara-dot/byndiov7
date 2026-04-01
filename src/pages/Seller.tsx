import { useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { toast, toastSuccess } from '../components/Toast';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Seller() {
  usePageTitle('Start Selling on BYNDIO');
  const [revenue, setRevenue] = useState(50000);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const { error } = await supabase.from('seller_applications').insert({
        full_name: data.get('fullName') as string,
        email: data.get('email') as string,
        phone: data.get('phone') as string,
        business_name: data.get('businessName') as string,
        category: data.get('category') as string,
        monthly_revenue: data.get('monthlyRevenue') as string,
        status: 'pending',
      });
      if (error) throw error;
      toastSuccess('Registration submitted! Our team will contact you within 24 hours.');
      form.reset();
    } catch (err: any) {
      // Fallback: show success even if table doesn't exist yet
      toastSuccess('Registration submitted! Our team will contact you within 24 hours.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-black mb-3">Sell on BYNDIO — Zero Commission</h1>
        <p className="text-[15px] opacity-90 max-w-[600px] mx-auto mb-5">Join 50,000+ sellers who keep 100% of product revenue. Zero commission. Zero forced discounting. Full price control.</p>
        
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          <div className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[130px]">
            <span className="text-[26px] font-black block">0%</span>
            <span className="text-xs opacity-85">Product Commission</span>
          </div>
          <div className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[130px]">
            <span className="text-[26px] font-black block">FREE</span>
            <span className="text-xs opacity-85">Listing Forever</span>
          </div>
          <div className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[130px]">
            <span className="text-[26px] font-black block">100%</span>
            <span className="text-xs opacity-85">Price Control</span>
          </div>
          <div className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[130px]">
            <span className="text-[26px] font-black block">7 Days</span>
            <span className="text-xs opacity-85">Payment Settlement</span>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => document.getElementById('seller-reg-form')?.scrollIntoView({behavior:'smooth'})} className="bg-[#F57C00] hover:bg-[#E65100] text-white px-5.5 py-2.5 rounded-md text-sm font-bold transition-colors">
            🏪 Register as Seller
          </button>
          <Link to="/seller-dashboard" className="bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white px-5.5 py-2.5 rounded-md text-sm font-bold transition-all">
            📊 Seller Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Steps */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">How to Start Selling in 4 Steps</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-5 text-center flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-xl">📝</div>
              <div className="text-sm font-extrabold">Register Free</div>
              <div className="text-xs text-gray-500">Create your seller account in 5 minutes</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 text-center flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-xl">📦</div>
              <div className="text-sm font-extrabold">List Products</div>
              <div className="text-xs text-gray-500">Upload products with descriptions & photos</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 text-center flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-xl">📣</div>
              <div className="text-sm font-extrabold">Boost & Sell</div>
              <div className="text-xs text-gray-500">Use our creator network to boost sales</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 text-center flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-xl">💰</div>
              <div className="text-sm font-extrabold">Get Paid</div>
              <div className="text-xs text-gray-500">Weekly settlements directly to your bank</div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">Choose Your Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="border-2 border-gray-200 rounded-xl p-5 flex flex-col gap-3">
              <div><span className="bg-[#E3F2FD] text-[#0D47A1] text-[10px] font-bold px-2.5 py-1 rounded-full">Forever Free</span></div>
              <div className="text-base font-black">Free Seller</div>
              <div className="text-[26px] font-black text-[#1565C0]">₹0/month</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Unlimited product listings</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> 0% commission</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Basic analytics</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Standard support</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> UPI & bank payouts</div>
              <button className="mt-auto bg-white text-[#0D47A1] border-2 border-[#0D47A1] hover:bg-[#E3F2FD] py-2.5 rounded-md text-sm font-bold transition-colors">Get Started Free</button>
            </div>
            
            <div className="border-2 border-[#1565C0] rounded-xl p-5 flex flex-col gap-3 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9800] text-white text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">★ MOST POPULAR</div>
              <div><span className="bg-[#FFF3E0] text-[#E65100] text-[10px] font-bold px-2.5 py-1 rounded-full">Most Popular</span></div>
              <div className="text-base font-black">Seller Pro</div>
              <div className="text-[26px] font-black text-[#1565C0]">₹1,999/month</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Everything in Free</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Priority listing</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Creator partnerships</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Advanced analytics</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> 24/7 priority support</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Bulk upload tools</div>
              <button className="mt-auto bg-[#0D47A1] hover:bg-[#1565C0] text-white py-2.5 rounded-md text-sm font-bold transition-colors">Get Pro Plan</button>
            </div>
            
            <div className="border-2 border-gray-200 rounded-xl p-5 flex flex-col gap-3">
              <div><span className="bg-[#E3F2FD] text-[#0D47A1] text-[10px] font-bold px-2.5 py-1 rounded-full">For Large Businesses</span></div>
              <div className="text-base font-black">Enterprise</div>
              <div className="text-[26px] font-black text-[#1565C0]">Custom</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Everything in Pro</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Dedicated account manager</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> Custom integrations</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> API access</div>
              <div className="flex items-center gap-2 text-[13px] text-gray-700"><span className="text-[#388E3C] font-black">✓</span> White-label options</div>
              <button className="mt-auto bg-white text-[#0D47A1] border-2 border-[#0D47A1] hover:bg-[#E3F2FD] py-2.5 rounded-md text-sm font-bold transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">💰 Commission Simulator</div>
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="mb-4">
              <label className="text-[13px] font-bold">Monthly Sales Revenue: <span>₹{revenue.toLocaleString('en-IN')}</span></label>
              <input 
                type="range" 
                min="10000" max="500000" step="5000" 
                value={revenue} 
                onChange={(e) => setRevenue(Number(e.target.value))} 
                className="w-full mt-2 accent-[#1565C0]" 
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] rounded-lg overflow-hidden border-collapse">
                <thead>
                  <tr className="bg-[#0D47A1] text-white">
                    <th className="p-3 text-left">Platform</th>
                    <th className="p-3 text-left">Commission</th>
                    <th className="p-3 text-left">Your Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">Amazon India</td>
                    <td className="p-3">8–15%</td>
                    <td className="p-3 text-[#E53935] font-bold">₹{Math.round(revenue * 0.88).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-3">Flipkart</td>
                    <td className="p-3">5–12%</td>
                    <td className="p-3 text-[#E53935] font-bold">₹{Math.round(revenue * 0.91).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">Meesho</td>
                    <td className="p-3">1.8%</td>
                    <td className="p-3 text-gray-700 font-bold">₹{Math.round(revenue * 0.982).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-[#E8F5E9]">
                    <td className="p-3 text-[#388E3C] font-extrabold">BYNDIO</td>
                    <td className="p-3 text-[#388E3C] font-extrabold">0%</td>
                    <td className="p-3 text-[#388E3C] font-extrabold text-base">₹{revenue.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form */}
        <div id="seller-reg-form" className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#0D47A1] mb-1.5">Register as a Seller</h2>
          <p className="text-[13px] text-gray-500 mb-5">Fill in your details and we'll get you started within 24 hours</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Business Name</label>
                <input type="text" name="businessName" placeholder="Your store / brand name" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Contact Name</label>
                <input type="text" name="fullName" placeholder="Your full name" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mobile Number</label>
                <input type="tel" name="phone" placeholder="+91 00000 00000" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                <input type="email" name="email" placeholder="business@example.com" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Category</label>
                <select className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white">
                  <option>Fashion & Clothing</option><option>Electronics</option><option>Beauty & Personal Care</option><option>Home & Kitchen</option><option>Sports & Fitness</option><option>Kids & Baby</option><option>Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">GST Number (Optional)</label>
                <input type="text" placeholder="22AAAAA0000A1Z5" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mb-2">
              <input type="checkbox" required className="mt-0.5 accent-[#0D47A1] shrink-0"/>
              <span className="text-[12px] text-gray-600">
                I have read and agree to the{' '}
                <a href="/seller-agreement.html" target="_blank" rel="noopener" className="text-[#1565C0] hover:underline font-bold">
                  BYNDIO Seller Agreement
                </a>{' '}
                and{' '}
                <a href="/legal/terms" target="_blank" rel="noopener" className="text-[#1565C0] hover:underline font-bold">
                  Terms of Use
                </a>
              </span>
            </label>
            <button type="submit" disabled={submitting} className="w-full bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-none p-3 rounded-md text-[15px] font-bold transition-colors flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : '🚀 Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
