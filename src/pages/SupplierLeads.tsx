import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { RefreshCw, Phone, Mail, MapPin, Package, Clock } from 'lucide-react';
import { toastSuccess, toast } from '../components/Toast';

interface Lead {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  company_name: string;
  product_category: string;
  product_description: string;
  quantity: string;
  budget: string;
  delivery_location: string;
  delivery_timeline: string;
  status: string;
  created_at: string;
}

export default function SupplierLeads() {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'matched' | 'closed'>('all');
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [user?.id, filter]);

  const fetchLeads = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch leads assigned to this supplier, or all leads if admin
      let query;
      if (user.role === 'admin') {
        query = supabase.from('b2b_leads').select('*').order('created_at', { ascending: false }).limit(50);
      } else {
        const { data: assignments } = await supabase
          .from('b2b_lead_assignments').select('lead_id').eq('supplier_id', user.id);
        const leadIds = assignments?.map(a => a.lead_id) || [];
        if (leadIds.length === 0) { setLeads([]); setIsLoading(false); return; }
        query = supabase.from('b2b_leads').select('*').in('id', leadIds).order('created_at', { ascending: false });
      }
      if (filter !== 'all') query = query.eq('status', filter);
      const { data } = await query;
      if (data) setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (leadId: string) => {
    const text = responseText[leadId]?.trim();
    if (!text || !user) return;
    try {
      await supabase.from('b2b_lead_assignments').update({
        status: 'responded',
        response: text,
      }).eq('lead_id', leadId).eq('supplier_id', user.id);
      await supabase.from('b2b_leads').update({ status: 'matched' }).eq('id', leadId);
      setRespondingTo(null);
      setResponseText(prev => { const n = { ...prev }; delete n[leadId]; return n; });
      toastSuccess('Response sent to buyer successfully!');
      fetchLeads();
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-green-100 text-green-700',
      matched: 'bg-blue-100 text-blue-700',
      closed: 'bg-gray-100 text-gray-600',
      expired: 'bg-red-100 text-red-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-4 py-2.5 bg-white border-b border-gray-200">
        <Link to="/" className="text-[#1565C0] hover:underline">Home</Link> ›
        <Link to="/b2b" className="text-[#1565C0] hover:underline">B2B Supply</Link> ›
        <span className="font-semibold text-gray-800">Supplier Lead Inbox</span>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-[18px] font-black flex items-center gap-2">
            📋 B2B Lead Inbox
            <span className="bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-bold px-2 py-0.5 rounded-full">{leads.length} leads</span>
          </h1>
          <button onClick={fetchLeads} className="flex items-center gap-1.5 text-[12px] text-[#1565C0] font-semibold hover:underline">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm w-fit mb-5">
          {(['all', 'open', 'matched', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-colors ${filter === f ? 'bg-[#1B5E20] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">📭</div>
            <div className="font-black text-[16px] text-gray-700 mb-2">No leads yet</div>
            <p className="text-[13px] text-gray-500 max-w-sm mx-auto mb-4">
              {user?.role === 'admin'
                ? 'B2B buyer requirements will appear here once buyers post them.'
                : 'Subscribe to a B2B plan to start receiving qualified buyer leads.'}
            </p>
            {user?.role !== 'admin' && (
              <Link to="/b2b" className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-5 py-2 rounded-md font-bold text-sm transition-colors">
                View B2B Plans
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {leads.map(lead => (
              <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Lead header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[14px]">{lead.product_category}</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${getStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="p-5">
                  {/* Requirement */}
                  <div className="mb-4">
                    <div className="text-[13px] font-bold text-gray-700 mb-1">Requirement</div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{lead.product_description}</p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: Package, label: 'Quantity', val: lead.quantity },
                      { icon: MapPin, label: 'Location', val: lead.delivery_location },
                      { icon: Clock, label: 'Timeline', val: lead.delivery_timeline },
                      { icon: Package, label: 'Budget', val: lead.budget || 'Not specified' },
                    ].map((d, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">{d.label}</div>
                        <div className="text-[12px] font-bold mt-0.5">{d.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Buyer contact */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-[12px] font-bold text-gray-500 mb-2">Buyer Contact</div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <div className="w-7 h-7 bg-[#0D47A1] rounded-full flex items-center justify-center text-white text-[11px] font-black">
                          {lead.buyer_name.charAt(0)}
                        </div>
                        {lead.buyer_name}
                        {lead.company_name && <span className="text-gray-400 font-normal text-[11px]">({lead.company_name})</span>}
                      </div>
                      <a href={`tel:${lead.buyer_phone}`} className="flex items-center gap-1 text-[12px] text-[#1B5E20] font-bold hover:underline">
                        <Phone size={13} /> {lead.buyer_phone}
                      </a>
                      {lead.buyer_email && (
                        <a href={`mailto:${lead.buyer_email}`} className="flex items-center gap-1 text-[12px] text-[#1565C0] font-bold hover:underline">
                          <Mail size={13} /> {lead.buyer_email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Respond */}
                  {lead.status === 'open' && (
                    <div className="mt-4">
                      {respondingTo === lead.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={responseText[lead.id] || ''}
                            onChange={e => setResponseText(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            placeholder="Write your quote or response to the buyer..."
                            rows={3}
                            className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1B5E20] resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleRespond(lead.id)}
                              disabled={!responseText[lead.id]?.trim()}
                              className="bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-[12px] font-bold transition-colors">
                              Send Response
                            </button>
                            <button onClick={() => setRespondingTo(null)}
                              className="text-[12px] font-semibold text-gray-500 hover:text-gray-700">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRespondingTo(lead.id)}
                          className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-5 py-2 rounded-md text-[13px] font-bold transition-colors">
                          📩 Respond to Buyer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
