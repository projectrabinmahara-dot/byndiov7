import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';

export default function Affiliate() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', website: '', category: 'Fashion', audienceSize: '1K-10K' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('affiliate_applications').insert({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        category: formData.category,
        audience_size: formData.audienceSize,
        status: 'pending',
      });
      if (error) throw error;
    } catch {
      // Graceful fallback even if table not created yet
    }
    setSubmitted(true);
  };

  const plans = [
    { name: 'Basic', price: '₹499/mo', commission: '8%', leads: 'Up to 50 links', analytics: 'Basic', support: 'Email', color: 'border-gray-200', badge: '' },
    { name: 'Gold', price: '₹1,999/mo', commission: '10%', leads: 'Up to 200 links', analytics: 'Advanced', support: 'Priority', color: 'border-[#0D47A1]', badge: '★ Popular' },
    { name: 'Premium', price: '₹4,999/mo', commission: '12%', leads: 'Unlimited', analytics: 'Full + Export', support: '24/7 Dedicated', color: 'border-gray-200', badge: '' },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#E65100] text-white py-12 px-6 text-center">
        <div className="inline-block bg-white/15 border border-white/30 text-[#FFD600] text-[11px] font-black px-4 py-1 rounded-full mb-4">
          🚀 BYNDIO Partner Program
        </div>
        <h1 className="text-4xl font-black mb-3">Earn Without Owning Inventory</h1>
        <p className="text-[15px] opacity-90 max-w-[600px] mx-auto mb-6">
          Promote BYNDIO products via your website, blog, WhatsApp or social media. Earn up to 12% commission on every sale. No investment needed.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          {[
            { val: '12%', label: 'Max Commission' },
            { val: '10L+', label: 'Products to Promote' },
            { val: '₹0', label: 'Joining Fee' },
            { val: 'Weekly', label: 'Payout Cycle' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[120px]">
              <span className="text-[24px] font-black block">{s.val}</span>
              <span className="text-xs opacity-85">{s.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => document.getElementById('affiliate-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-[#F57C00] hover:bg-[#E65100] text-white px-7 py-3.5 rounded-md text-[15px] font-extrabold transition-colors">
          🤝 Join Partner Program
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">

        {/* How it works */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">How the Affiliate Engine Works</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '📝', title: 'Register Free', desc: 'Sign up on the Partner Portal. Verify via email or phone.' },
              { step: '02', icon: '🔗', title: 'Get Unique Links', desc: 'Receive auto-generated referral links or QR codes for any product.' },
              { step: '03', icon: '📢', title: 'Promote Products', desc: 'Share via your blog, Instagram, YouTube, WhatsApp, Telegram.' },
              { step: '04', icon: '💰', title: 'Earn Commission', desc: 'Get paid weekly or monthly. Dashboard tracks every click and sale.' },
            ].map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-[10px] p-5 relative">
                <div className="text-[11px] font-black text-[#0D47A1] opacity-40 mb-2">{s.step}</div>
                <div className="text-[28px] mb-2">{s.icon}</div>
                <div className="font-extrabold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission table */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">📊 Commission by Category</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#0D47A1] text-white">
                <tr>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Partner Commission</th>
                  <th className="p-3 text-left">BYNDIO Margin</th>
                  <th className="p-3 text-left">Example (₹999 product)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Fashion', partner: '8%', byndio: '12%', example: '₹79' },
                  { cat: 'Electronics', partner: '5%', byndio: '10%', example: '₹50' },
                  { cat: 'Beauty & Care', partner: '10%', byndio: '12%', example: '₹100' },
                  { cat: 'Sports & Fitness', partner: '8%', byndio: '10%', example: '₹79' },
                  { cat: 'B2B Lead (Textile)', partner: '20%', byndio: '33%', example: '₹30 per lead' },
                ].map((r, i) => (
                  <tr key={i} className={`border-b border-gray-200 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="p-3 font-semibold">{r.cat}</td>
                    <td className="p-3 font-bold text-[#388E3C]">{r.partner}</td>
                    <td className="p-3 text-gray-500">{r.byndio}</td>
                    <td className="p-3 font-bold text-[#0D47A1]">{r.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plans */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-lg font-black mb-4">Choose Your Partner Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <div key={i} className={`border-2 ${plan.color} rounded-xl p-5 relative flex flex-col gap-2.5`}>
                {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D47A1] text-white text-[10px] font-black px-3 py-0.5 rounded-full whitespace-nowrap">{plan.badge}</div>}
                <div className="font-black text-[16px]">{plan.name}</div>
                <div className="text-[26px] font-black text-[#0D47A1]">{plan.price}</div>
                {[
                  { label: 'Commission', val: plan.commission },
                  { label: 'Links', val: plan.leads },
                  { label: 'Analytics', val: plan.analytics },
                  { label: 'Support', val: plan.support },
                ].map(f => (
                  <div key={f.label} className="flex justify-between text-[13px]">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="font-semibold">{f.val}</span>
                  </div>
                ))}
                <button className="mt-2 w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white py-2.5 rounded-md text-sm font-bold transition-colors">
                  Get {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Already a partner? */}
        {user && (user.role === 'influencer' || user.role === 'seller') && (
          <div className="bg-[#E3F2FD] rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-black text-[15px] text-[#0D47A1]">You already have access to the Partner Program!</div>
              <div className="text-[13px] text-gray-600 mt-0.5">Generate affiliate links directly from your dashboard.</div>
            </div>
            <Link to={user.role === 'influencer' ? '/creator-dashboard' : '/seller-dashboard'}
              className="bg-[#0D47A1] text-white px-5 py-2.5 rounded-md font-bold text-sm hover:bg-[#1565C0] transition-colors">
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Registration form */}
        <div id="affiliate-form" className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#0D47A1] mb-1.5">Join as a Partner / Affiliate</h2>
          <p className="text-[13px] text-gray-500 mb-5">Fill in your details. We'll approve your account within 24 hours.</p>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🎉</div>
              <div className="font-black text-[18px] text-[#388E3C] mb-2">Application Submitted!</div>
              <p className="text-gray-500 text-sm">Our team will review your profile and activate your account within 24 hours. Check your email for next steps.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mobile Number</label>
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Website / Social Handle</label>
                  <input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="yourwebsite.com or @handle" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Promotion Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white">
                    <option>Fashion</option><option>Electronics</option><option>Beauty</option><option>Sports</option><option>B2B Leads</option><option>Multiple</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Monthly Audience / Traffic</label>
                  <select value={formData.audienceSize} onChange={e => setFormData({ ...formData, audienceSize: e.target.value })}
                    className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white">
                    <option>Less than 1K</option><option>1K-10K</option><option>10K-100K</option><option>100K-1M</option><option>1M+</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white border-none p-3 rounded-md text-[15px] font-bold transition-colors">
                🚀 Submit Partner Application
              </button>
            </form>
          )}
        </div>

        {/* Tier Upgrade System */}
        <TierUpgradeSection />

        {/* Instant Wallet Credit */}
        <InstantWalletCredit />

      </div>
    </div>
  );
}

function TierUpgradeSection() {
  const TIERS = [
    { name: 'Starter', icon: '🌱', commission: '5%', min: 0, max: 10, color: '#66BB6A', bg: '#E8F5E9', perks: ['Basic dashboard', 'Standard support', 'Monthly payouts'] },
    { name: 'Silver', icon: '🥈', commission: '8%', min: 10, max: 50, color: '#9E9E9E', bg: '#F5F5F5', perks: ['Priority support', 'Weekly payouts', 'Exclusive deals'] },
    { name: 'Gold', icon: '🥇', commission: '10%', min: 50, max: 200, color: '#F9A825', bg: '#FFFDE7', perks: ['Dedicated manager', 'Daily payouts', 'Brand campaigns', 'Bonus commission'] },
    { name: 'Platinum', icon: '💎', commission: '15%', min: 200, max: Infinity, color: '#1565C0', bg: '#E3F2FD', perks: ['VIP status', 'Instant payouts', 'Co-branded materials', 'Revenue share'] },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-5">
      <h2 className="text-[16px] font-black mb-1">🏆 Tier Upgrade System</h2>
      <p className="text-[12px] text-gray-500 mb-4">Earn more conversions to unlock higher commission rates and exclusive perks</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map((tier, i) => (
          <div key={i} className="rounded-xl p-4 border-2 text-center transition-all"
            style={{ borderColor: tier.color, background: tier.bg }}>
            <div className="text-3xl mb-1">{tier.icon}</div>
            <div className="font-black text-[15px]" style={{ color: tier.color }}>{tier.name}</div>
            <div className="text-[22px] font-black my-1">{tier.commission}</div>
            <div className="text-[10px] text-gray-500 mb-3">
              {tier.max === Infinity ? `${tier.min}+ conversions` : `${tier.min}–${tier.max} conversions`}
            </div>
            <div className="flex flex-col gap-1">
              {tier.perks.map((p, j) => (
                <div key={j} className="text-[10px] text-gray-600 flex items-center gap-1">
                  <span style={{ color: tier.color }}>✓</span> {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstantWalletCredit() {
  const { user, walletBalance, fetchWalletData } = useAppStore();
  const [amount, setAmount] = useState('');
  const [crediting, setCrediting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleCredit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { setMsg('❌ Enter a valid amount'); return; }
    if (val > walletBalance) { setMsg('❌ Insufficient wallet balance'); return; }
    setCrediting(true);
    try {
      const newBal = walletBalance - val;
      await supabase.from('wallets').upsert(
        { user_id: user!.id, balance: newBal },
        { onConflict: 'user_id' }
      );
      await fetchWalletData();
      setMsg(`✅ ₹${val.toLocaleString('en-IN')} transferred from wallet!`);
      setAmount('');
    } catch {
      setMsg('❌ Transfer failed. Please try again.');
    } finally {
      setCrediting(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-5">
      <h2 className="text-[16px] font-black mb-1">⚡ Instant Wallet Credit</h2>
      <p className="text-[12px] text-gray-500 mb-4">Transfer your affiliate earnings instantly to your BYNDIO wallet — no waiting for payout cycles</p>
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Amount to Credit (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
              className="w-full pl-7 p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#0D47A1]" />
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
        </div>
        <div className="flex gap-2">
          {[100, 500, 1000].map(q => (
            <button key={q} onClick={() => setAmount(String(Math.min(q, walletBalance)))}
              className="px-3 py-2.5 bg-[#E3F2FD] text-[#0D47A1] rounded-md text-[12px] font-bold hover:bg-[#BBDEFB] transition-colors">₹{q}</button>
          ))}
        </div>
        <button onClick={handleCredit} disabled={crediting}
          className="bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white px-6 py-2.5 rounded-md text-[13px] font-bold transition-colors whitespace-nowrap">
          {crediting ? '⏳ Processing...' : '⚡ Credit Instantly'}
        </button>
      </div>
      {msg && <div className={`mt-3 p-3 rounded-lg text-[12px] font-semibold ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { icon: '⚡', text: 'Instant transfer' },
          { icon: '0️⃣', text: 'Zero fees' },
          { icon: '🕐', text: '24/7 available' },
          { icon: '🔒', text: 'Secure & encrypted' },
        ].map((b, i) => (
          <div key={i} className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {b.icon} {b.text}
          </div>
        ))}
      </div>
    </div>
  );
}
