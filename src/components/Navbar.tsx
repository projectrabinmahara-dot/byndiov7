import { Link, useNavigate } from 'react-router-dom';
import { toast, toastSuccess } from './Toast';
import { Search, User, Heart, ShoppingCart, ChevronDown, LogOut, MessageSquare, Package, Gift, RotateCcw, Zap, Mic } from 'lucide-react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

// Voice Search Component
function VoiceSearchButton() {
  const [listening, setListening] = useState(false);
  const nav = useNavigate();

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast('Voice search is only supported in Chrome or Edge.', 'info'); return; }
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      nav(`/products?search=${encodeURIComponent(transcript)}`);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <button type="button" onClick={handleVoice} title="Voice Search"
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${listening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#1565C0] hover:bg-blue-50'}`}>
      {listening ? <Mic size={14} className='text-red-500'/> : <Mic size={14}/>}
    </button>
  );
}

export default function Navbar({ onOpenLogin, onOpenCart }: { onOpenLogin: () => void; onOpenCart: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const products = useAppStore(s => s.products);

  const suggestions = searchQuery.trim().length >= 2
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cat.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    // Fetch unread count
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0));
    // Realtime unread count updates
    const ch = supabase.channel('nav-notif-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          supabase.from('notifications').select('id', { count: 'exact', head: true })
            .eq('user_id', user.id).eq('is_read', false)
            .then(({ count }) => setUnreadCount(count || 0));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const cart = useAppStore(s => s.cart);
  const cartCount = cart.reduce((a, i) => a + i.qty, 0);
  const wishlist = useAppStore(s => s.wishlist);
  const rewardPoints = useAppStore(s => s.rewardPoints);
  const navigate = useNavigate();
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);

  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast('Voice search is only supported in Chrome or Edge browsers.', 'info'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      navigate(`/products?q=${encodeURIComponent(transcript)}`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    setIsUserOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-50 bg-[#0D47A1] shadow-md">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-start gap-3 md:gap-4 px-4 py-2 md:h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <div className="flex flex-col items-center justify-center transition-opacity hover:opacity-90">
            <div className="flex items-center gap-1.5">
              <span className="text-[28px] font-black tracking-tight leading-none"
                style={{ background: 'linear-gradient(180deg,#40C4FF 0%,#0277BD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}>
                Byndio
              </span>
              <div className="relative w-7 h-7 rounded-md bg-gradient-to-br from-[#FFCA28] to-[#E65100] shadow-md flex items-center justify-center">
                <div className="absolute -top-1.5 w-4 h-2.5 border-[2.5px] border-[#FFB300] rounded-t-full border-b-0" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="w-4 h-4 text-[#7F0000] mt-1">
                  <path d="M7 10 Q 12 16 17 10" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-0.5">
              <span className="text-white drop-shadow-sm">Shop</span>
              <span className="text-[#FFCA28]">•</span>
              <span className="text-[#FFCA28] drop-shadow-sm">Sell</span>
              <span className="text-[#FFCA28]">•</span>
              <span className="text-[#FFCA28] drop-shadow-sm">Earn</span>
            </div>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="order-3 md:order-none w-full md:w-auto md:flex-1 max-w-[600px] flex rounded overflow-hidden mt-2 md:mt-0 md:ml-4 bg-white relative">
          <input type="text" placeholder="Search products, brands, sellers... or use 🎤"
            className="flex-1 px-3 py-2 text-sm outline-none text-gray-900 bg-transparent placeholder-gray-500"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          <button type="button" onClick={handleVoiceSearch} title="Voice Search"
            className={`px-2.5 text-gray-400 hover:text-[#0D47A1] transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}>
            <Mic size={15} />
          </button>
          <button type="submit" className="bg-[#F57C00] hover:bg-[#E65100] text-white px-4 text-sm font-bold flex items-center gap-1 transition-colors">
            <Search size={16} /> <span className="hidden sm:inline">Search</span>
          </button>
          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
              {suggestions.map(p => (
                <button key={p.id} type="button"
                  onClick={() => { navigate(`/product/${p.id}`); setSearchQuery(''); setShowSuggestions(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {p.icon?.startsWith('http')
                      ? <img src={p.icon} alt="" className="w-full h-full object-cover"/>
                      : <span className="text-lg">{p.icon}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-gray-400">{p.brand} · {p.cat}</div>
                  </div>
                  <span className="text-[13px] font-black text-[#0D47A1] shrink-0">₹{p.price.toLocaleString('en-IN')}</span>
                </button>
              ))}
              <button type="button"
                onClick={() => { navigate(`/products?q=${encodeURIComponent(searchQuery)}`); setShowSuggestions(false); }}
                className="w-full px-4 py-2.5 text-[12px] text-[#0D47A1] font-bold bg-[#E3F2FD] hover:bg-[#BBDEFB] text-left">
                🔍 See all results for "{searchQuery}"
              </button>
            </div>
          )}
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:ml-auto shrink-0 order-2 md:order-none">
          {user ? (
            <div className="relative">
              <button onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded transition-colors">
                <div className="w-6 h-6 bg-[#F57C00] rounded-full flex items-center justify-center text-white text-[11px] font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-[11px] font-bold">Hi, {user.name.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-70 capitalize">{user.role}</span>
                </div>
                <ChevronDown size={13} className={`transition-transform ${isUserOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[210px] z-50 overflow-hidden py-1.5">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <div className="text-[13px] font-bold text-gray-900">{user.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                      {rewardPoints > 0 && <div className="text-[10px] text-[#FF9800] font-bold mt-0.5">🎁 {rewardPoints} reward points</div>}
                    </div>
                    <Link to="/my-orders" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <Package size={14} /> My Orders
                    </Link>
                    <Link to="/invoices" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <Package size={14} /> My Invoices
                    </Link>
                    <Link to="/returns" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <RotateCcw size={14} /> Returns & Refunds
                    </Link>
                    <Link to="/rewards" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <Gift size={14} /> Rewards & Wallet
                    </Link>
                    <Link to="/gamification" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <Gift size={14} /> 🏅 Badges & Levels
                    </Link>
                    {/* Referral Code Section */}
                    <div className="px-4 py-3 border-y border-gray-100 bg-[#FFF8E1] my-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">🎁 Your Referral Code</div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <code className="text-[15px] font-black text-[#0D47A1] tracking-widest">
                          {user.id.slice(0,8).toUpperCase()}
                        </code>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            navigator.clipboard.writeText(user.id.slice(0,8).toUpperCase());
                          }} className="text-[10px] text-[#1565C0] font-bold border border-[#1565C0]/30 px-2 py-0.5 rounded hover:bg-blue-50">📋 Copy</button>
                          <a href={`https://wa.me/?text=${encodeURIComponent('Join BYNDIO — India\'s 0% Commission Marketplace! Use my code ' + user.id.slice(0,8).toUpperCase() + ' to get ₹100 bonus. https://byndio.in')}`}
                            target="_blank" rel="noopener"
                            className="text-[10px] text-[#25D366] font-bold border border-[#25D366]/30 px-2 py-0.5 rounded hover:bg-green-50">
                            WhatsApp
                          </a>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500">Earn ₹200 per friend who joins</div>
                    </div>
                    <Link to="/notifications" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <Package size={14} /> 🔔 Notifications
                    </Link>
                    <Link to="/kyc" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#1B5E20] font-semibold hover:bg-green-50">
                      <Package size={14} /> ✅ KYC Verification
                    </Link>
                    <Link to="/messages" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                      <MessageSquare size={14} /> Messages
                    </Link>
                    {user.role === 'admin' && <Link to="/admin" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#0D47A1] font-semibold hover:bg-blue-50">🔒 Admin Panel</Link>}
                    {user.role === 'seller' && (
                      <>
                        <Link to="/seller-dashboard" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#E65100] font-semibold hover:bg-orange-50">📊 Seller Dashboard</Link>
                        <Link to="/supplier-leads" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#1B5E20] font-semibold hover:bg-green-50">📋 B2B Lead Inbox</Link>
                      </>
                    )}
                    {user.role === 'influencer' && <Link to="/creator-dashboard" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#7B1FA2] font-semibold hover:bg-purple-50">⭐ Creator Dashboard</Link>}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={onOpenLogin} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-1">
              <User size={14} /> Login
            </button>
          )}

          <Link to="/wishlist" className="relative bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors" title="Wishlist">
            <Heart size={16} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length > 9 ? '9+' : wishlist.length}
              </span>
            )}
          </Link>

          <button onClick={onOpenCart} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-1 relative">
            <ShoppingCart size={14} /> <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF9800] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Bar */}
      <div className="bg-[#0D47A1]/90 border-t border-white/10 flex items-center px-4 h-9 gap-1 overflow-x-auto scrollbar-hide relative">
        <Link to="/" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">🏠 Home</Link>
        <Link to="/products?cat=Fashion" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">👗 Fashion</Link>
        <Link to="/products?cat=Electronics" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">📱 Electronics</Link>
        <Link to="/products?cat=Beauty" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">💄 Beauty</Link>
        <Link to="/products?cat=Kids" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">🧸 Kids</Link>
        <Link to="/products?cat=Sports" className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors">🏋️ Sports</Link>
        <Link to="/flash-sales" className="text-[#FFD600] hover:bg-white/15 px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1">
          <Zap size={12} fill="currentColor" /> Flash Deals
        </Link>

        <div className="ml-auto relative">
          <button onClick={() => setIsPartnerOpen(!isPartnerOpen)}
            className="text-white/85 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors border border-white/25 flex items-center gap-1">
            🤝 Partners <ChevronDown size={12} />
          </button>
          {isPartnerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPartnerOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[210px] z-50 overflow-hidden py-1">
                <Link to="/b2b" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🏢 B2B Supply</Link>
                <Link to="/seller" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🏪 Sell on BYNDIO</Link>
                <Link to="/influencer" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">⭐ Creator Hub</Link>
                <Link to="/campaigns" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🎯 Brand Campaigns</Link>
                <Link to="/affiliate" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🔗 Affiliate Program</Link>
                <Link to="/dropshipping" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🚚 Dropshipping</Link>
                <Link to="/leaderboard" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-800 hover:bg-gray-50">🏆 Leaderboard</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
