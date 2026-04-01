import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { Product, useAppStore } from '../store';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useAppStore();
  const [justAdded, setJustAdded] = useState(false);
  const disc = Math.round((1 - product.price / product.mrp) * 100);
  const isWishlisted = wishlist.includes(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white border border-gray-200 rounded-[10px] overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col group"
    >
      {/* Image area */}
      <div className="h-[155px] flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {disc > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            {disc}% off
          </div>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            fill={isWishlisted ? '#E53935' : 'transparent'}
            color={isWishlisted ? '#E53935' : '#757575'}
            className="transition-all"
          />
        </button>
        {product.inf && (
          <div className="absolute bottom-2 left-2 z-10 bg-[#7B1FA2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            ⭐ Creator Pick
          </div>
        )}
        {product.icon && product.icon.startsWith('http') ? (
          <img
            src={product.icon}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80'; }}
          />
        ) : (
          <span className="text-[52px] group-hover:scale-110 transition-transform duration-200 block">
            {product.icon || '📦'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <div className="text-[13px] font-semibold mb-0.5 leading-snug line-clamp-2 text-gray-900">
          {product.name}
        </div>
        <div className="text-[11px] text-gray-400 mb-1.5">{product.brand}</div>

        <div className="flex items-baseline gap-1.5 flex-wrap mb-1.5">
          <span className="text-[15px] font-black">₹{product.price.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
            {product.rating} ★
          </span>
          {product.reviews > 0 && (
            <span className="text-[11px] text-gray-400">({product.reviews.toLocaleString('en-IN')})</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className={`mt-auto border-none p-2 rounded text-[11px] font-bold tracking-wide transition-all w-full flex items-center justify-center gap-1.5 ${
            justAdded
              ? 'bg-[#388E3C] text-white scale-[0.98]'
              : 'bg-[#0D47A1] hover:bg-[#1565C0] text-white'
          }`}
          aria-label="Add to cart"
        >
          {justAdded ? (
            <><Check size={13} /> ADDED!</>
          ) : (
            <><ShoppingCart size={13} /> ADD TO CART</>
          )}
        </button>
      </div>
    </Link>
  );
}
