import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ThumbsUp, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
  helpful_count?: number;
}


// ─── Product Image Gallery Component ───────────────────────────
function ProductImageGallery({ icon, name, images }: { icon: string; name: string; images?: string[] }) {
  const [activeImg, setActiveImg] = useState(0);
  const isUrl = icon?.startsWith('http');

  if (!isUrl) {
    return (
      <div className="h-72 flex items-center justify-center bg-gray-50 text-[100px]">
        {icon || '📦'}
      </div>
    );
  }

  // Build image gallery from product's images array; pad to at least 1 entry
  const rawImgs: string[] = Array.isArray(images) && images.length > 0
    ? images
    : [icon];
  const imgs = rawImgs.length >= 3 ? rawImgs : [...rawImgs, ...Array(3 - rawImgs.length).fill(rawImgs[0])];

  return (
    <div>
      <div
        className="h-80 bg-gray-50 relative overflow-hidden cursor-zoom-in group"
        onClick={() => window.open(imgs[activeImg], '_blank')}
      >
        <img
          src={imgs[activeImg]}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Click to zoom
        </div>
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-100 overflow-x-auto">
        {imgs.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
              activeImg === i ? 'border-[#0D47A1]' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams();
  const products = useAppStore(state => state.products);
  const product = products.find(p => p.id.toString() === id);
  const { addToCart, toggleWishlist, wishlist, user, addRecentlyViewed, generateAffiliateLink } = useAppStore();
  usePageTitle(product ? `${product.name} — ₹${product.price.toLocaleString('en-IN')}` : 'Product');
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [qaList, setQaList] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [myAffiliateCode, setMyAffiliateCode] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const similarProducts = product ? products.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5) : [];
  const [pincodeResult, setPincodeResult] = useState<{ ok: boolean; msg: string; days?: string } | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);

  const checkDelivery = async () => {
    if (!/^\d{6}$/.test(pincode)) { setPincodeResult({ ok: false, msg: 'Enter a valid 6-digit pincode' }); return; }
    setCheckingPin(true);
    try {
      // Use Shiprocket serviceability check
      const { shiprocket } = await import('../lib/email');
      const res = await shiprocket('check_serviceability', {
        pickup_pin: '400001', // BYNDIO warehouse pincode - update this
        delivery_pin: pincode,
        cod: true,
      });
      const available = res?.data?.available_courier_companies?.length > 0;
      const eta = res?.data?.available_courier_companies?.[0]?.estimated_delivery_days;
      if (available) {
        setPincodeResult({ ok: true, msg: `✅ Delivery available!`, days: eta ? `Estimated ${eta} business days` : '2–5 business days' });
      } else {
        setPincodeResult({ ok: false, msg: '❌ Sorry, delivery not available to this pincode yet.' });
      }
    } catch {
      // Fallback: assume delivery available for most Indian pincodes
      setPincodeResult({ ok: true, msg: '✅ Delivery available', days: '3–5 business days' });
    }
    setCheckingPin(false);
  };
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQty(1);
    setActiveThumb(0);
    setAddedToCart(false);
    setMyAffiliateCode(null);
    fetchReviews();
    fetchQA();
    if (id) addRecentlyViewed(id);
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setReviews(data);
    } catch {
      // Reviews table may not exist yet — silent fail
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchQA = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.from('product_qa').select('*').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false });
      if (data) setQaList(data);
    } catch (e) { /* non-critical — table may not exist yet */ }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.trim()) return;
    try {
      await supabase.from('product_qa').insert({ product_id: id, user_id: user.id, question: newQuestion.trim() });
      setNewQuestion('');
      fetchQA();
    } catch (e) { /* non-critical — table may not exist yet */ }
  };

  const handleGetAffiliateLink = async () => {
    if (!user || !product) return;
    const code = await generateAffiliateLink(product.id.toString());
    if (code) {
      setMyAffiliateCode(code);
      const url = `${window.location.origin}/products?ref=${code}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReviewMessage('Please login to submit a review.'); return; }
    // Check for existing review
    const { data: existing } = await supabase
      .from('reviews').select('id').eq('product_id', id).eq('user_id', user.id).maybeSingle();
    if (existing) { setReviewMessage('⚠️ You have already reviewed this product.'); return; }
    // Verify purchase — only buyers who received the product can review
    const { data: purchase } = await supabase
      .from('order_items').select('id, orders(status)').eq('product_id', id)
      .eq('orders.buyer_id', user.id).maybeSingle();
    const delivered = purchase?.orders && (purchase.orders as any).status === 'delivered';
    if (!delivered) {
      setReviewMessage('⚠️ You can only review products you have purchased and received. Reviews are verified.');
      return;
    }
    if (!newReview.comment.trim()) { setReviewMessage('Please write a comment.'); return; }
    setIsSubmittingReview(true);
    setReviewMessage('');
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: id,
        user_id: user.id,
        user_name: user.name,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        verified_purchase: false,
      });
      if (error) throw error;
      setReviewMessage('✅ Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
      fetchReviews();
    } catch (err: any) {
      setReviewMessage('❌ ' + (err.message || 'Failed to submit review'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-xl font-bold mb-2">Product not found</h2>
        <Link to="/products" className="bg-[#0D47A1] text-white px-5 py-2.5 rounded-md font-bold mt-2">Browse Products</Link>
      </div>
    );
  }

  const disc = Math.round((1 - product.price / product.mrp) * 100);
  const isWishlisted = wishlist.includes(product.id);
  const similar = products.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating.toFixed(1);

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-4 py-2.5 bg-white border-b border-gray-200">
        <Link to="/" className="text-[#1565C0] hover:underline">Home</Link> ›
        <Link to="/products" className="text-[#1565C0] hover:underline">Products</Link> ›
        <Link to={`/products?cat=${product.cat}`} className="text-[#1565C0] hover:underline">{product.cat}</Link> ›
        <span className="font-semibold text-gray-800 truncate">{product.name}</span>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl flex items-center justify-center h-[380px] text-[110px] relative overflow-hidden">
            <div className="absolute top-3 left-3 bg-[#388E3C] text-white text-xs font-bold px-2.5 py-1 rounded-md">
              {disc}% off
            </div>
            {product.inf && (
              <div className="absolute top-3 right-3 bg-[#7B1FA2] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                ⭐ Creator Pick
              </div>
            )}
            <span className="transition-all duration-200">{product.icon}</span>
          </div>
          <div className="flex gap-2 mt-3">
            {[0, 1, 2, 3].map(i => (
              <button
                key={i}
                onClick={() => setActiveThumb(i)}
                className={`w-14 h-14 bg-white border-2 rounded-md flex items-center justify-center text-[22px] transition-colors ${activeThumb === i ? 'border-[#1565C0]' : 'border-gray-200 hover:border-[#1565C0]'}`}
              >
                {product.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
            <span>{product.brand}</span>
            <span>•</span>
            <Link to={`/products?cat=${product.cat}`} className="text-[#1565C0] hover:underline">{product.cat}</Link>
          </div>
          <h1 className="text-[22px] font-black leading-tight mb-2.5">{product.name}</h1>

          <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
            <span className="bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
              {avgRating} <Star size={10} fill="white" />
            </span>
            <span className="text-xs text-gray-500">
              ({reviews.length > 0 ? reviews.length : product.reviews.toLocaleString('en-IN')} reviews)
            </span>
            {product.inf && product.creator && (
              <span className="text-xs text-[#7B1FA2] font-bold">⭐ Recommended by {product.creator}</span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3.5 mb-4">
            <div className="flex items-baseline gap-2.5 mb-1">
              <span className="text-[28px] font-black">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
              <span className="text-[15px] font-bold text-[#388E3C]">{disc}% off</span>
            </div>
            <div className="text-xs text-[#388E3C] font-semibold">
              You save ₹{(product.mrp - product.price).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Qty */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[13px] font-semibold text-gray-600">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 bg-white hover:bg-gray-50 text-lg font-bold transition-colors">−</button>
              <span className="w-10 text-center text-[15px] font-bold border-x border-gray-300 leading-[36px]">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 bg-white hover:bg-gray-50 text-lg font-bold transition-colors">+</button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-2.5 mb-4">
            <button
              onClick={handleAdd}
              className={`flex-1 text-white border-none py-3 rounded-md text-[15px] font-bold transition-all ${addedToCart ? 'bg-[#388E3C]' : 'bg-[#0D47A1] hover:bg-[#1565C0]'}`}
            >
              {addedToCart ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`px-4 py-3 border rounded-md text-[15px] font-bold transition-colors ${isWishlisted ? 'border-[#E53935] text-[#E53935] bg-[#FFEBEE]' : 'border-gray-300 text-gray-800 bg-white hover:border-[#E53935] hover:text-[#E53935]'}`}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Pincode Delivery Check */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <div className="text-[13px] font-bold text-gray-700 mb-2.5">📍 Check Delivery</div>
            <div className="flex gap-2">
              <input
                type="tel" value={pincode}
                onChange={e => { setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); setPincodeResult(null); }}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-[#1565C0]"
              />
              <button onClick={checkDelivery} disabled={checkingPin || pincode.length < 6}
                className="px-4 py-2 bg-[#0D47A1] text-white text-[12px] font-bold rounded-lg disabled:opacity-50 hover:bg-[#1565C0] transition-colors">
                {checkingPin ? '…' : 'Check'}
              </button>
            </div>
            {pincodeResult && (
              <div className={`mt-2 text-[12px] font-semibold ${pincodeResult.ok ? 'text-[#388E3C]' : 'text-red-600'}`}>
                {pincodeResult.msg}
                {pincodeResult.ok && pincodeResult.days && <span className="text-gray-500 font-normal"> · {pincodeResult.days}</span>}
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex gap-3 flex-wrap mb-5">
            {[
              { icon: '🔒', label: 'Secure Payment' },
              { icon: '🚚', label: '2–4 Day Delivery' },
              { icon: '🔄', label: '7-Day Returns' },
              { icon: '✅', label: 'Genuine Product' },
            ].map(b => (
              <span key={b.label} className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                {b.icon} {b.label}
              </span>
            ))}
            <Link to="/compare" className="text-xs text-[#0D47A1] flex items-center gap-1 bg-[#E3F2FD] border border-[#90CAF9] rounded-md px-2 py-1 font-semibold hover:bg-[#BBDEFB] transition-colors">
              ⚖️ Compare
            </Link>
          </div>

          {/* Specs */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3.5 py-2.5 text-[13px] font-bold border-b border-gray-200">Specifications</div>
            {product.specs.map(([k, v], i) => (
              <div key={i} className={`flex px-3.5 py-2.5 ${i !== product.specs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="w-[140px] text-xs text-gray-500 shrink-0">{k}</span>
                <span className="text-xs font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-[17px] font-black flex items-center gap-2">
              ⭐ Customer Reviews
              <span className="text-[12px] text-gray-500 font-normal">({reviews.length} reviews)</span>
            </h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-4 py-2 rounded-md text-[12px] font-bold transition-colors"
              >
                {showReviewForm ? 'Cancel' : '+ Write a Review'}
              </button>
            )}
          </div>

          {/* Rating summary */}
          {reviews.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-5 p-5 border-b border-gray-100">
              <div className="flex flex-col items-center justify-center shrink-0 w-[120px]">
                <div className="text-[48px] font-black text-[#0D47A1] leading-none">{avgRating}</div>
                <div className="flex gap-0.5 my-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill={s <= Math.round(parseFloat(avgRating)) ? '#F57C00' : 'none'} color={s <= Math.round(parseFloat(avgRating)) ? '#F57C00' : '#D1D5DB'} />
                  ))}
                </div>
                <div className="text-[11px] text-gray-500">{reviews.length} reviews</div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {ratingDist.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-600 w-6 text-right">{star}★</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-[#F57C00] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-500 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review form */}
          {showReviewForm && (
            <div className="p-5 border-b border-gray-100 bg-blue-50/40">
              <h3 className="text-[14px] font-bold mb-3">Share Your Experience</h3>
              <form onSubmit={handleSubmitReview} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setNewReview(r => ({ ...r, rating: s }))}>
                        <Star size={24} fill={s <= newReview.rating ? '#F57C00' : 'none'} color={s <= newReview.rating ? '#F57C00' : '#D1D5DB'} className="transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={e => setNewReview(r => ({ ...r, comment: e.target.value }))}
                    placeholder="Share your honest thoughts about this product..."
                    rows={3}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] resize-none"
                    maxLength={500}
                  />
                  <div className="text-[11px] text-gray-400 text-right mt-0.5">{newReview.comment.length}/500</div>
                </div>
                {reviewMessage && (
                  <p className={`text-[12px] font-semibold ${reviewMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>{reviewMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="self-start bg-[#E65100] hover:bg-[#F57C00] disabled:bg-gray-400 text-white px-5 py-2 rounded-md text-[13px] font-bold transition-colors"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews list */}
          <div className="divide-y divide-gray-100">
            {isLoadingReviews ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl block mb-2">💬</span>
                <p className="text-[13px] text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#0D47A1] rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0">
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold">{review.user_name}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={11} fill={s <= review.rating ? '#F57C00' : 'none'} color={s <= review.rating ? '#F57C00' : '#D1D5DB'} />
                            ))}
                          </div>
                          {review.verified_purchase && (
                            <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
                              <ShieldCheck size={10} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed">{review.comment}</p>
                  <button className="flex items-center gap-1 mt-2 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                    <ThumbsUp size={11} /> Helpful ({review.helpful_count ?? 0})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Affiliate/Creator Link */}
      {user && (user.role === 'influencer' || user.role === 'seller') && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-4">
          <div className="bg-[#F3E5F5] border border-[#CE93D8] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-black text-[14px] text-[#7B1FA2]">🔗 Generate Your Affiliate Link</div>
              <div className="text-[12px] text-gray-600 mt-0.5">Share this product and earn {user.role === 'influencer' ? '10%' : '8%'} commission on every sale.</div>
              {myAffiliateCode && <code className="text-[11px] text-[#7B1FA2] bg-white px-2 py-0.5 rounded mt-1 block">{window.location.origin}/products?ref={myAffiliateCode}</code>}
            </div>
            <button onClick={handleGetAffiliateLink} className="bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white px-4 py-2 rounded-md text-[12px] font-bold flex items-center gap-1.5 transition-colors">
              {copiedLink ? '✓ Link Copied!' : '🔗 Get & Copy Link'}
            </button>
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {(() => {
        const filtered = recentlyViewed.filter(rid => rid !== product.id);
        if (filtered.length === 0) return null;
        const recent = filtered
          .map(rid => products.find(p => String(p.id) === String(rid)))
          .filter(Boolean)
          .slice(0, 4) as typeof products;
        if (recent.length === 0) return null;
        return (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <div className="text-[15px] font-black mb-4">🕐 Recently Viewed</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map(p => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="flex flex-col bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-gray-100 group">
                  <div className="h-24 bg-white flex items-center justify-center overflow-hidden">
                    {p.icon?.startsWith('http')
                      ? <img src={p.icon} alt={p.name} loading="lazy" className="h-full w-full object-contain group-hover:scale-105 transition-transform"/>
                      : <span className="text-4xl">{p.icon}</span>}
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">{p.name}</div>
                    <div className="text-[12px] font-black text-[#0D47A1]">₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Similar Products */}
      {(() => {
        if (similarProducts.length === 0) return null;
        return (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[16px] font-black">You Might Also Like</div>
              <Link to={`/products?cat=${product.cat}`} className="text-[12px] text-[#1565C0] font-bold hover:underline">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {similarProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="flex flex-col bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group border border-gray-100">
                  <div className="h-28 bg-white flex items-center justify-center overflow-hidden">
                    {p.icon?.startsWith('http')
                      ? <img src={p.icon} alt={p.name} loading="lazy" className="h-full w-full object-contain group-hover:scale-105 transition-transform"/>
                      : <span className="text-4xl">{p.icon}</span>}
                  </div>
                  <div className="p-2.5">
                    <div className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-2 mb-1">{p.name}</div>
                    <div className="text-[13px] font-black text-[#0D47A1]">₹{p.price.toLocaleString('en-IN')}</div>
                    {p.mrp > p.price && (
                      <div className="text-[10px] text-[#388E3C] font-semibold">
                        {Math.round((1 - p.price/p.mrp)*100)}% off
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Q&A Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-[16px] font-black flex items-center gap-2">💬 Questions & Answers <span className="text-[12px] text-gray-400 font-normal">({qaList.length})</span></h2>
          </div>
          {user && (
            <form onSubmit={handleSubmitQuestion} className="flex gap-2 p-4 border-b border-gray-100">
              <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Ask a question about this product..."
                className="flex-1 p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#0D47A1]" />
              <button type="submit" disabled={!newQuestion.trim()} className="bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-[12px] font-bold transition-colors">Ask</button>
            </form>
          )}
          <div className="divide-y divide-gray-100">
            {qaList.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">💬</div>
                <div className="text-[13px] font-semibold text-gray-500 mb-1">No questions yet</div>
                <div className="text-[11px] text-gray-400">Be the first to ask a question about this product!</div>
              </div>
            ) : (
              qaList.map((qa, idx) => (
                <div key={qa.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#E3F2FD] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#0D47A1] font-black text-[10px]">Q</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800">{qa.question}</p>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {qa.created_at ? new Date(qa.created_at).toLocaleDateString('en-IN') : 'Recently'} • {qa.user_name || 'Customer'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <button className="hover:text-[#0D47A1] transition-colors">👍 Helpful</button>
                    </div>
                  </div>
                  {qa.answer ? (
                    <div className="flex items-start gap-3 ml-9 bg-[#E8F5E9] rounded-lg p-3">
                      <div className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-[10px]">A</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] text-gray-700">{qa.answer}</p>
                        <div className="text-[10px] text-[#388E3C] font-semibold mt-1">✅ Answered by Seller</div>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-9 flex items-center gap-2 text-[11px] text-[#E65100] bg-[#FFF3E0] rounded-lg px-3 py-2">
                      <span>⏳</span> Awaiting seller response...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {!user && (
            <div className="p-4 bg-[#E3F2FD] border-t border-gray-100 text-center text-[12px] text-[#1565C0] font-semibold">
              <button className="underline">Sign in</button> to ask a question about this product
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed */}
      {(() => {
        const filtered = recentlyViewed.filter(rid => rid !== product.id);
        if (filtered.length === 0) return null;
        const recent = filtered
          .map(rid => products.find(p => String(p.id) === String(rid)))
          .filter(Boolean)
          .slice(0, 4) as typeof products;
        if (recent.length === 0) return null;
        return (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <div className="text-[15px] font-black mb-4">🕐 Recently Viewed</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map(p => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="flex flex-col bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-gray-100 group">
                  <div className="h-24 bg-white flex items-center justify-center overflow-hidden">
                    {p.icon?.startsWith('http')
                      ? <img src={p.icon} alt={p.name} loading="lazy" className="h-full w-full object-contain group-hover:scale-105 transition-transform"/>
                      : <span className="text-4xl">{p.icon}</span>}
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">{p.name}</div>
                    <div className="text-[12px] font-black text-[#0D47A1]">₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-6">
          <h3 className="text-lg font-black mb-4">Similar Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {similarProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
