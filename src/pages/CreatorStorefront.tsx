import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import ProductCard from '../components/ProductCard';

export default function CreatorStorefront() {
  const { creatorId } = useParams();
  const { products } = useAppStore();
  const [creatorInfo, setCreatorInfo] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!creatorId) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('users').select('full_name, role').eq('id', creatorId).single()
        .then(({ data }) => { if (data) setCreatorInfo({ name: data.full_name, role: data.role }); });
    });
  }, [creatorId]);

  const creatorProducts = products.filter(p => p.inf && (p.creator === creatorInfo?.name || (creatorId && p.creator?.toLowerCase().includes(creatorInfo?.name?.toLowerCase() || '__none__')))).slice(0, 12);

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="bg-gradient-to-br from-[#7B1FA2] to-[#4A148C] text-white py-10 px-6 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[32px] font-black">
          {creatorInfo?.name?.charAt(0).toUpperCase() || '⭐'}
        </div>
        <h1 className="text-[24px] font-black mb-1">{creatorInfo?.name || 'Creator'}</h1>
        <p className="text-[13px] opacity-75 mb-4">Curated product picks — verified creator recommendations</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <span className="bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-semibold">{creatorProducts.length} Products</span>
          <span className="bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-semibold">⭐ Verified Creator</span>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="text-[15px] font-black mb-4">🛍 {creatorInfo?.name || 'Creator'}'s Picks</div>
        {creatorProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🛍</div>
            <p>No products in this storefront yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {creatorProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link to="/products" className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-6 py-2.5 rounded-md font-bold transition-colors">
            Browse All Products →
          </Link>
        </div>
      </div>
    </div>
  );
}
