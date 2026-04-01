import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { usePageTitle } from '../lib/usePageTitle';
import { useAppStore } from '../store';

export default function Home() {
  usePageTitle('');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const products = useAppStore(state => state.products);
  const isLoadingProducts = useAppStore(state => state.isLoadingProducts);
  const siteSettings = useAppStore(state => state.siteSettings);
  const user = useAppStore(state => state.user);
  const flashSales = useAppStore(state => state.flashSales);
  const offerProduct = products.find(p => p.mrp > p.price * 1.4) || products[0] || null;
  const fetchFlashSales = useAppStore(state => state.fetchFlashSales);
  const recentlyViewed = useAppStore(state => state.recentlyViewed);

  useEffect(() => { fetchFlashSales(); }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const trending = products.slice(0, 6);
  const creatorPicks = products.filter(p => p.inf).slice(0, 5);
  const recentlyViewedProducts = products.filter(p => recentlyViewed.includes(p.id)).slice(0, 6);

  const heroTitle = siteSettings?.hero_title || "Shop Beyond Ordinary";
  const heroSubtitle = siteSettings?.hero_subtitle || "0% commission for sellers. 20,000+ creators. Transparent prices. India's fairest marketplace for buyers, sellers and influencers.";

  const slides = [
    {
      title: heroTitle,
      desc: heroSubtitle,
      bg: "bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0277BD]",
      visual: "🛍️"
    },
    {
      title: "Zero Commission Revolution",
      desc: "Sellers keep 100% of their earnings. No hidden fees, no forced discounting. Join the movement today.",
      bg: "bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C]",
      visual: "🚀"
    },
    {
      title: "Creator-Powered Commerce",
      desc: "Discover products recommended by your favorite influencers. Authentic reviews, real value.",
      bg: "bg-gradient-to-br from-[#6A1B9A] via-[#4A148C] to-[#7B1FA2]",
      visual: "⭐"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Ticker */}
      <div className="bg-[#F57C00] text-white overflow-hidden h-[34px] flex items-center">
        <div className="flex whitespace-nowrap animate-[ticker_30s_linear_infinite]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex">
              {['🚀 India\'s #1 Zero Commission Marketplace', '👗 50K+ Fashion Products', '📱 Latest Electronics', '💄 Beauty at Unbeatable Prices', '0% Commission for Sellers', '⭐ 20K+ Creator Partners', '🚚 Fast Delivery Across India', '🔒 Secure & Trusted Payments'].map((text, j) => (
                <span key={j} className="px-6 text-xs font-bold flex items-center gap-1.5">{text}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Slider */}
      <div className="relative group max-w-7xl mx-auto w-full md:px-4 md:py-4">
        <div className="overflow-hidden relative md:rounded-xl shadow-sm" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, idx) => (
              <div key={idx} className={`flex-[0_0_100%] min-w-0 ${slide.bg} text-white px-6 py-12 md:py-16 flex items-center gap-9 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_width=%2260%22_height=%2260%22_viewBox=%220_0_60_60%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg_fill=%22%23ffffff%22_fill-opacity=%220.03%22%3E%3Ccircle_cx=%2230%22_cy=%2230%22_r=%2220%22/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none"></div>
                <div className="flex-1 relative z-10 max-w-6xl mx-auto flex items-center justify-between w-full">
                  <div className="flex-1">
                    <span className="inline-block bg-[#F57C00] px-3.5 py-1 rounded-full text-xs font-bold mb-4 shadow-sm">🚀 India's #1 Zero Commission Marketplace</span>
                    <h1 className="text-3xl md:text-5xl font-black leading-[1.15] mb-4 drop-shadow-sm">{slide.title}</h1>
                    <p className="text-sm md:text-base opacity-95 max-w-[500px] leading-relaxed mb-6 drop-shadow-sm">{slide.desc}</p>
                    <div className="flex gap-3 flex-wrap mb-8">
                      <Link to="/products" className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-sm text-sm font-bold transition-colors shadow-md">🛒 Shop Now</Link>
                      {user ? (
                        <Link to="/my-orders" className="bg-black/20 hover:bg-black/30 border border-white/30 text-white px-6 py-3 rounded-sm text-sm font-bold transition-all backdrop-blur-sm">📦 My Orders</Link>
                      ) : (
                        <Link to="/seller" className="bg-black/20 hover:bg-black/30 border border-white/30 text-white px-6 py-3 rounded-sm text-sm font-bold transition-all backdrop-blur-sm">🏪 Start Selling FREE</Link>
                      )}
                    </div>
                    <div className="flex gap-6 md:gap-10 flex-wrap">
                      <div className="text-center"><span className="text-xl md:text-3xl font-black text-white drop-shadow-md block">50K+</span><span className="text-[11px] md:text-xs font-semibold opacity-90 uppercase tracking-wider">Sellers</span></div>
                      <div className="text-center"><span className="text-xl md:text-3xl font-black text-white drop-shadow-md block">10L+</span><span className="text-[11px] md:text-xs font-semibold opacity-90 uppercase tracking-wider">Products</span></div>
                      <div className="text-center"><span className="text-xl md:text-3xl font-black text-white drop-shadow-md block">5L+</span><span className="text-[11px] md:text-xs font-semibold opacity-90 uppercase tracking-wider">Buyers</span></div>
                    </div>
                  </div>
                  <div className="text-[140px] shrink-0 opacity-90 hidden lg:block drop-shadow-xl transform hover:scale-110 transition-transform duration-500">{slide.visual}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={scrollPrev}
          className="absolute left-0 md:left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-r-md md:rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={scrollNext}
          className="absolute right-0 md:right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-l-md md:rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Offer of the Day */}
      {offerProduct && (()=>{ const offerDisc=Math.round((1-offerProduct.price/offerProduct.mrp)*100); return (
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <Link to={`/product/${offerProduct.id}`}>
              <div className="bg-gradient-to-r from-[#B71C1C] to-[#E53935] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 hover:shadow-xl transition-shadow overflow-hidden relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
                <div className="relative z-10 flex-1 text-white">
                  <div className="inline-block bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full mb-2 uppercase tracking-widest">
                    🔥 Deal of the Day
                  </div>
                  <h2 className="text-[20px] sm:text-[24px] font-black mb-1 leading-tight">{offerProduct.name}</h2>
                  <p className="text-white/80 text-[13px] mb-3">{offerProduct.brand}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[28px] font-black">₹{offerProduct.price.toLocaleString('en-IN')}</span>
                    <span className="text-white/60 line-through text-[16px]">₹{offerProduct.mrp.toLocaleString('en-IN')}</span>
                    <span className="bg-[#FFD600] text-[#B71C1C] font-black text-[13px] px-3 py-1 rounded-full">
                      {offerDisc}% OFF
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="bg-white text-[#B71C1C] font-black text-[13px] px-5 py-2 rounded-full hover:bg-gray-100 transition-colors inline-block">
                      Shop Now →
                    </span>
                  </div>
                </div>
                <div className="relative z-10 w-40 h-40 bg-white/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                  {offerProduct.icon?.startsWith('http')
                    ? <img src={offerProduct.icon} alt={offerProduct.name} className="w-full h-full object-contain"/>
                    : <span className="text-7xl">{offerProduct.icon}</span>}
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* Categories */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-black">Shop by Category</span>
          <Link to="/products" className="text-[13px] text-[#1565C0] font-semibold hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
          {[
            { icon: '👗', name: 'Fashion', cat: 'Fashion' },
            { icon: '📱', name: 'Electronics', cat: 'Electronics' },
            { icon: '💄', name: 'Beauty & Care', cat: 'Beauty' },
            { icon: '🧸', name: 'Kids & Baby', cat: 'Kids' },
            { icon: '🏋️', name: 'Sports', cat: 'Sports' },
            { icon: '⚡', name: 'Flash Deals', cat: null, link: '/flash-sales' },
            { icon: '🏢', name: 'B2B Supply', cat: null, link: '/b2b' },
          ].map((c, i) => (
            <Link key={i} to={c.link || `/products${c.cat ? `?cat=${c.cat}` : ''}`}
              className={`bg-white border rounded-[10px] p-4 text-center cursor-pointer transition-all hover:shadow-sm ${c.icon === '⚡' ? 'border-[#E65100] bg-[#FFF3E0]' : 'border-gray-200 hover:border-[#1565C0]'}`}>
              <span className="text-[28px] block mb-1.5">{c.icon}</span>
              <span className={`text-xs font-bold ${c.icon === '⚡' ? 'text-[#E65100]' : ''}`}>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-black">🔥 Trending Now</span>
          <Link to="/products" className="text-[13px] text-[#1565C0] font-semibold hover:underline">See All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isLoadingProducts
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-[10px] overflow-hidden animate-pulse">
                  <div className="h-[155px] bg-gray-200" />
                  <div className="p-2.5 flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-7 bg-gray-200 rounded mt-1" />
                  </div>
                </div>
              ))
            : trending.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </div>

      {/* Why BYNDIO */}
      <div className="bg-white py-8">
        <div className="max-w-6xl mx-auto w-full px-4">
          <div className="text-lg font-black mb-4">Why BYNDIO?</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
              <div className="text-[28px] shrink-0">0️⃣</div>
              <div>
                <div className="text-sm font-extrabold mb-1">Zero Commission</div>
                <div className="text-xs text-gray-500 leading-relaxed">Sellers keep 100% of their earnings. No cuts, no surprises.</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
              <div className="text-[28px] shrink-0">⭐</div>
              <div>
                <div className="text-sm font-extrabold mb-1">20K+ Creators</div>
                <div className="text-xs text-gray-500 leading-relaxed">Curated product picks from trusted Indian influencers.</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
              <div className="text-[28px] shrink-0">🔒</div>
              <div>
                <div className="text-sm font-extrabold mb-1">Secure Payments</div>
                <div className="text-xs text-gray-500 leading-relaxed">Bank-grade encryption. Pay with UPI, cards, wallets & more.</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
              <div className="text-[28px] shrink-0">🚀</div>
              <div>
                <div className="text-sm font-extrabold mb-1">Fast Delivery</div>
                <div className="text-xs text-gray-500 leading-relaxed">Nationwide network. Most products delivered in 2–4 days.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Picks */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-black flex items-center gap-2">
            ⭐ Creator Picks 
            <span className="bg-[#F3E5F5] text-[#7B1FA2] text-[10px] font-bold px-2 py-0.5 rounded-full">Verified Creators</span>
          </span>
          <Link to="/influencer" className="text-[13px] text-[#1565C0] font-semibold hover:underline">Creator Hub →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {creatorPicks.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>

      {/* Flash Sale Strip */}
      <div className="bg-gradient-to-r from-[#E65100] to-[#BF360C] py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="bg-white text-[#E65100] text-[11px] font-black px-2.5 py-1 rounded-full">⚡ FLASH SALE</span>
            <span className="text-white text-[13px] font-bold">Up to 70% off — Limited time deals live now!</span>
          </div>
          <Link to="/flash-sales" className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors whitespace-nowrap">
            Shop Flash Deals →
          </Link>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-black">🕐 Recently Viewed</span>
            <Link to="/products" className="text-[13px] text-[#1565C0] font-semibold hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentlyViewedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-gradient-to-br from-[#F57C00] to-[#E65100] py-10 px-6 text-center text-white mt-4">
        <h2 className="text-[26px] font-black mb-2.5">Start Selling on BYNDIO for FREE</h2>
        <p className="text-sm opacity-90 max-w-[500px] mx-auto mb-5">Join 50,000+ sellers. Zero commission. Unlimited listings. Full price control. India's fairest platform for sellers.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/seller" className="bg-white text-[#E65100] px-5.5 py-2.5 rounded-md text-sm font-bold transition-colors">🏪 Start Selling Now</Link>
          <Link to="/b2b" className="bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white px-5.5 py-2.5 rounded-md text-sm font-bold transition-all">🏢 Explore B2B</Link>
        </div>
      </div>
    </div>
  );
}
