import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, toastSuccess } from '../components/Toast';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';

type B2BTab = 'buyer' | 'supplier' | 'leads' | 'plans' | 'contracts';

export default function B2B() {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<B2BTab>('buyer');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [buyerForm, setBuyerForm] = useState({
    buyer_name: '', buyer_phone: '', buyer_email: '',
    company_name: '', gst_number: '',
    product_category: 'Fashion & Garments',
    product_description: '', quantity: '', budget: '',
    delivery_location: '', delivery_timeline: '1-2 weeks',
  });

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('b2b_leads').insert({
        ...buyerForm,
        buyer_id: user?.id || null,
        is_otp_verified: false,
        status: 'open',
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast(err.message || 'Failed to submit. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const plans = [
    { name: 'Basic', price: '₹2,999/mo', leads: '20 leads/mo', badge: '', color: 'border-gray-200' },
    { name: 'Silver', price: '₹6,999/mo', leads: '60 leads/mo', badge: '★ Popular', color: 'border-[#1B5E20]' },
    { name: 'Gold', price: '₹12,999/mo', leads: '150 leads/mo', badge: '', color: 'border-gray-200' },
    { name: 'Premium', price: '₹19,999/mo', leads: 'Unlimited + Featured', badge: '', color: 'border-gray-200' },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C] text-white py-12 px-6 text-center">
        <div className="inline-block bg-white/15 border border-white/30 text-[#FF9800] text-xs font-extrabold px-4 py-1 rounded-full mb-4">
          🏢 BYNDIO B2B Supply Network
        </div>
        <h1 className="text-4xl font-black mb-3">India's Inventory-Free B2B Marketplace</h1>
        <p className="text-[15px] opacity-90 max-w-[600px] mx-auto mb-6">
          Buyers post requirements. Suppliers receive verified leads. BYNDIO never handles inventory — just connects you.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          {[
            { val: '₹5,000', label: 'Min Order Value' },
            { val: '30–60%', label: 'Savings vs Retail' },
            { val: '50K+', label: 'Business Clients' },
            { val: '100%', label: 'GST Compliant' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 border-2 border-white/25 rounded-lg py-4 px-6 text-center min-w-[120px]">
              <span className="text-[24px] font-black block">{s.val}</span>
              <span className="text-xs opacity-85">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-5">

        {/* How it works */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-[16px] font-black mb-4">How BYNDIO B2B Works</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', icon: '📝', title: 'Buyer Posts Requirement', desc: 'Fill category, quantity, budget, location, delivery timeline. OTP verified for authenticity.' },
              { step: '02', icon: '🔍', title: 'System Matches Suppliers', desc: 'Lead automatically sent to 3–5 matched, verified suppliers in your region.' },
              { step: '03', icon: '🤝', title: 'Suppliers Contact Directly', desc: 'Suppliers view your full contact details and reach out with quotes. No middleman.' },
            ].map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-[10px] p-4">
                <div className="text-[11px] font-black text-[#1B5E20] opacity-50 mb-1">{s.step}</div>
                <div className="text-[26px] mb-2">{s.icon}</div>
                <div className="font-extrabold text-[14px] mb-1">{s.title}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-gray-200">
          {([
            { id: 'buyer', label: '🛒 Post Requirement (Buyer)' },
            { id: 'supplier', label: '🏪 Register as Supplier' },
            { id: 'leads', label: '📋 Lead Inbox (Suppliers)' },
            { id: 'plans', label: '💳 Supplier Plans' },
            { id: 'contracts', label: '📝 Contracts' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeTab === t.id ? 'text-[#1B5E20] border-[#1B5E20]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Buyer requirement form */}
        {activeTab === 'buyer' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-[16px] font-black text-[#1B5E20] mb-1.5">Post Your Buying Requirement</h2>
            <p className="text-[13px] text-gray-500 mb-5">We'll match you with 3–5 verified suppliers within minutes. OTP verification ensures your privacy.</p>
            {submitted ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🎉</div>
                <div className="font-black text-[18px] text-[#388E3C] mb-2">Requirement Posted!</div>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">Your requirement has been submitted. Matched suppliers will contact you within 2–4 hours at the phone/email you provided.</p>
                <button onClick={() => { setSubmitted(false); setBuyerForm({ buyer_name: '', buyer_phone: '', buyer_email: '', company_name: '', gst_number: '', product_category: 'Fashion & Garments', product_description: '', quantity: '', budget: '', delivery_location: '', delivery_timeline: '1-2 weeks' }); }}
                  className="mt-4 bg-[#1B5E20] text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-[#2E7D32] transition-colors">
                  Post Another Requirement
                </button>
              </div>
            ) : (
              <form onSubmit={handleBuyerSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  {[
                    { label: 'Your Name *', field: 'buyer_name', type: 'text', placeholder: 'Full name' },
                    { label: 'Mobile / WhatsApp *', field: 'buyer_phone', type: 'tel', placeholder: '+91 98765 43210' },
                    { label: 'Email Address', field: 'buyer_email', type: 'email', placeholder: 'business@example.com' },
                    { label: 'Company / Business Name', field: 'company_name', type: 'text', placeholder: 'Your company (optional)' },
                  ].map(f => (
                    <div key={f.field} className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} required={f.label.includes('*')} placeholder={f.placeholder}
                        value={(buyerForm as any)[f.field]} onChange={e => setBuyerForm({ ...buyerForm, [f.field]: e.target.value })}
                        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Category *</label>
                    <select value={buyerForm.product_category} onChange={e => setBuyerForm({ ...buyerForm, product_category: e.target.value })}
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] bg-white">
                      {['Fashion & Garments', 'Electronics', 'Beauty & Personal Care', 'Home & Kitchen', 'Sports & Fitness', 'Kids & Baby', 'Raw Materials', 'Machinery', 'Food & Beverages', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Quantity Required *</label>
                    <input type="text" required placeholder="e.g. 500 units, 100 kg" value={buyerForm.quantity}
                      onChange={e => setBuyerForm({ ...buyerForm, quantity: e.target.value })}
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 mb-3.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Description *</label>
                  <textarea required rows={3} placeholder="Describe what you need in detail — material, specs, colour, design, etc."
                    value={buyerForm.product_description} onChange={e => setBuyerForm({ ...buyerForm, product_description: e.target.value })}
                    className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Budget (Optional)</label>
                    <input type="text" placeholder="e.g. ₹50,000–₹1,00,000" value={buyerForm.budget}
                      onChange={e => setBuyerForm({ ...buyerForm, budget: e.target.value })}
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Delivery Location *</label>
                    <input type="text" required placeholder="City / State" value={buyerForm.delivery_location}
                      onChange={e => setBuyerForm({ ...buyerForm, delivery_location: e.target.value })}
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Delivery Timeline</label>
                    <select value={buyerForm.delivery_timeline} onChange={e => setBuyerForm({ ...buyerForm, delivery_timeline: e.target.value })}
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] bg-white">
                      {['Within 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', 'Flexible'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-gray-400 text-white border-none p-3 rounded-md text-[15px] font-bold transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : '🏢 Post Requirement & Match Suppliers'}
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">Your contact details are only shared with matched, verified suppliers.</p>
              </form>
            )}
          </div>
        )}

        {/* Supplier registration */}
        {activeTab === 'supplier' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-[16px] font-black text-[#1B5E20] mb-1.5">Register as a B2B Supplier</h2>
            <p className="text-[13px] text-gray-500 mb-5">Receive qualified buyer leads directly. GST verified. Pay only for leads you want.</p>
            <form onSubmit={e => { e.preventDefault(); toastSuccess('Supplier registration submitted! We will verify your GST within 24 hours.'); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                {[
                  { label: 'Business Name *', type: 'text', placeholder: 'Your company name' },
                  { label: 'Contact Person *', type: 'text', placeholder: 'Full name' },
                  { label: 'Mobile Number *', type: 'tel', placeholder: '+91 98765 43210' },
                  { label: 'GST Number *', type: 'text', placeholder: '22AAAAA0000A1Z5' },
                  { label: 'Email Address *', type: 'email', placeholder: 'business@company.com' },
                  { label: 'Business Location *', type: 'text', placeholder: 'City, State' },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder} className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Supply Category</label>
                  <select className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] bg-white">
                    {['Fashion & Garments', 'Electronics', 'Beauty & Personal Care', 'Home & Kitchen', 'Sports & Fitness', 'Raw Materials', 'Multiple'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Monthly Supply Capacity</label>
                  <select className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] bg-white">
                    {['₹5L–₹25L', '₹25L–₹1Cr', '₹1Cr–₹10Cr', '₹10Cr+'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none p-3 rounded-md text-[15px] font-bold transition-colors">
                🏪 Register as Supplier
              </button>
            </form>
          </div>
        )}

        {/* Plans */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-[15px] font-black text-[#1B5E20] mb-2">Supplier Lead Inbox</h2>
            <p className="text-[13px] text-gray-500 mb-4 max-w-sm mx-auto">
              View and respond to buyer requirements matched to your product category and location.
            </p>
            <Link to="/supplier-leads" className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-6 py-2.5 rounded-md font-bold text-sm transition-colors inline-block">
              Open Lead Inbox →
            </Link>
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            <div className="text-[16px] font-black mb-4">Supplier Subscription Plans</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan, i) => (
                <div key={i} className={`bg-white border-2 ${plan.color} rounded-xl p-5 relative flex flex-col gap-2.5`}>
                  {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1B5E20] text-white text-[10px] font-black px-3 py-0.5 rounded-full">{plan.badge}</div>}
                  <div className="font-black text-[16px]">{plan.name}</div>
                  <div className="text-[22px] font-black text-[#1B5E20]">{plan.price}</div>
                  <div className="text-[13px] font-semibold text-gray-700">{plan.leads}</div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {['GST verified badge', 'Lead inbox dashboard', 'Buyer contact details', 'Rating & review system', 'Analytics dashboard'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[12px] text-gray-600"><span className="text-[#388E3C] font-black">✓</span>{f}</div>
                    ))}
                  </div>
                  <button className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white py-2.5 rounded-md text-sm font-bold mt-2 transition-colors">
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-[#E8F5E9] rounded-xl p-4 text-center">
              <div className="text-[13px] text-[#1B5E20] font-semibold">💡 Pay Per Lead option also available: ₹50–₹500 per lead depending on category value</div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-[15px] font-black mb-3">📝 Contract Management</div>
              <p className="text-[12px] text-gray-500 mb-4">Manage your B2B supply agreements, MOQ contracts, and subscription orders in one place.</p>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'CNT-001', supplier: 'TechSource India', type: 'MOQ Contract', value: '₹2,40,000', status: 'active', start: '2026-01-01', end: '2026-12-31', items: 'Electronics — 500 units/month' },
                  { id: 'CNT-002', supplier: 'FashionHub Delhi', type: 'Subscription Order', value: '₹85,000', status: 'pending', start: '2026-03-01', end: '2026-06-30', items: 'Apparel — 200 units/month' },
                  { id: 'CNT-003', supplier: 'HomeDecor Surat', type: 'Custom Pricing', value: '₹1,20,000', status: 'expired', start: '2025-10-01', end: '2026-02-28', items: 'Home goods — Bulk order' },
                ].map((contract) => (
                  <div key={contract.id} className="border border-gray-200 rounded-xl p-4 hover:border-[#1B5E20] transition-colors">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black">{contract.supplier}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${contract.status === 'active' ? 'bg-[#E8F5E9] text-[#2E7D32]' : contract.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-gray-100 text-gray-500'}`}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{contract.id} • {contract.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-black text-[#1B5E20]">{contract.value}</div>
                        <div className="text-[10px] text-gray-400">Contract Value</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-600 mb-2">{contract.items}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] text-gray-400">
                        {new Date(contract.start).toLocaleDateString('en-IN')} → {new Date(contract.end).toLocaleDateString('en-IN')}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] rounded-md text-[11px] font-bold hover:bg-[#C8E6C9] transition-colors">View</button>
                        {contract.status === 'pending' && (
                          <button className="px-3 py-1.5 bg-[#1B5E20] text-white rounded-md text-[11px] font-bold hover:bg-[#2E7D32] transition-colors">Approve</button>
                        )}
                        {contract.status === 'expired' && (
                          <button className="px-3 py-1.5 bg-[#0D47A1] text-white rounded-md text-[11px] font-bold hover:bg-[#1565C0] transition-colors">Renew</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-[14px] font-black mb-3">➕ Create New Contract</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Supplier Name', placeholder: 'e.g. TechSource India' },
                  { label: 'Contract Type', placeholder: 'MOQ / Subscription / Custom' },
                  { label: 'Contract Value (₹)', placeholder: 'e.g. 500000' },
                  { label: 'MOQ (units/month)', placeholder: 'e.g. 100' },
                  { label: 'Start Date', placeholder: '', type: 'date' },
                  { label: 'End Date', placeholder: '', type: 'date' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
                    <input type={f.type || 'text'} placeholder={f.placeholder}
                      className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20]" />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Terms & Conditions</label>
                <textarea rows={3} placeholder="Describe payment terms, delivery SLA, quality standards..."
                  className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] resize-none" />
              </div>
              <button className="mt-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-6 py-2.5 rounded-md text-[13px] font-bold transition-colors">
                📝 Create Contract
              </button>
            </div>
          </div>
        )}

        {/* B2B Categories */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-[15px] font-black mb-3">B2B Product Categories</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { icon: '👗', name: 'Fashion', disc: 'Up to 55% off' },
              { icon: '📱', name: 'Electronics', disc: 'Up to 40% off' },
              { icon: '💄', name: 'Beauty', disc: 'Up to 60% off' },
              { icon: '🏠', name: 'Home', disc: 'Up to 50% off' },
              { icon: '🏋️', name: 'Sports', disc: 'Up to 45% off' },
              { icon: '🧸', name: 'Kids', disc: 'Up to 40% off' },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-[10px] p-4 text-center hover:border-[#1B5E20] transition-colors cursor-pointer">
                <span className="text-[26px] block mb-1.5">{c.icon}</span>
                <span className="text-xs font-bold block">{c.name}</span>
                <span className="text-[10px] text-[#388E3C] font-bold mt-0.5 block">{c.disc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
