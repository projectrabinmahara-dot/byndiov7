import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';

export default function Products() {
  usePageTitle('Browse Products');
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') || '';
  const refCode = searchParams.get('ref') || '';
  const products = useAppStore(state => state.products);
  const isLoading = useAppStore(state => state.isLoadingProducts);

  // Track affiliate click when ref code present
  useEffect(() => {
    if (refCode) {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('affiliate_links').select('id, clicks').eq('link_code', refCode).single()
          .then(({ data }) => {
            if (data) supabase.from('affiliate_links').update({ clicks: data.clicks + 1 }).eq('id', data.id).then(() => {});
          });
      });
    }
  }, [refCode]);

  const [cats, setCats] = useState<string[]>(['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports']);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;
  const [sort, setSort] = useState('pop');
  const [infOnly, setInfOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const allPrices = useMemo(() => products.map(p => p.price), [products]);
  const globalMin = Math.min(...allPrices, 0);
  const globalMax = Math.max(...allPrices, 10000);
  const [priceRange, setPriceRange] = useState<[number, number]>([globalMin, globalMax]);

  useEffect(() => {
    if (catParam) {
      setCats([catParam]);
    } else {
      setCats(['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports']);
    }
    setPriceRange([globalMin, globalMax]);
  }, [catParam, globalMin, globalMax]);

  const clearFilters = () => {
    setCats(['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports']);
    setSort('pop');
    setInfOnly(false);
    setPriceRange([globalMin, globalMax]);
  };

  const isFiltered = infOnly || priceRange[0] > globalMin || priceRange[1] < globalMax
    || (catParam ? !cats.includes(catParam) : cats.length < 5);

  let filtered = products.filter(p => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.brand.toLowerCase().includes(query.toLowerCase()) && !p.cat.toLowerCase().includes(query.toLowerCase())) return false;
    if (cats.length > 0 && !cats.includes(p.cat)) return false;
    if (infOnly && !p.inf) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    return true;
  });

  if (sort === 'lh') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === 'hl') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sort === 'disc') filtered = [...filtered].sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const CATEGORIES = ['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports'];
  const toggleCat = (cat: string) => {
    setPage(1);
    setCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const FilterPanel = () => (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <strong className="text-sm">Filters</strong>
        {isFiltered && (
          <button onClick={clearFilters} className="text-xs text-[#1565C0] font-semibold hover:underline flex items-center gap-1">
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500 mb-2.5">Category</div>
        {CATEGORIES.map(c => (
          <label key={c} className="flex items-center gap-2 py-1.5 cursor-pointer text-[13px]">
            <input type="checkbox" checked={cats.includes(c)} onChange={() => toggleCat(c)} className="accent-[#1565C0] cursor-pointer" />
            <span>{c === 'Beauty' ? 'Beauty & Care' : c === 'Kids' ? 'Kids & Baby' : c === 'Sports' ? 'Sports & Fitness' : c}</span>
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500 mb-2.5">Price Range</div>
        <div className="flex items-center justify-between text-[12px] font-bold mb-2">
          <span className="bg-gray-100 px-2 py-1 rounded">₹{priceRange[0].toLocaleString('en-IN')}</span>
          <span className="text-gray-400">–</span>
          <span className="bg-gray-100 px-2 py-1 rounded">₹{priceRange[1].toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={globalMin}
          max={globalMax}
          value={priceRange[1]}
          onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
          className="w-full accent-[#1565C0]"
        />
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={e => setPriceRange([Math.max(globalMin, parseInt(e.target.value) || globalMin), priceRange[1]])}
            className="w-full p-1.5 border border-gray-300 rounded text-[12px] outline-none focus:border-[#1565C0]"
            placeholder="Min"
          />
          <input
            type="number"
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Math.min(globalMax, parseInt(e.target.value) || globalMax)])}
            className="w-full p-1.5 border border-gray-300 rounded text-[12px] outline-none focus:border-[#1565C0]"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500 mb-2.5">Sort By</div>
        {[
          { id: 'pop', label: 'Popularity' },
          { id: 'rating', label: 'Customer Rating' },
          { id: 'lh', label: 'Price: Low to High' },
          { id: 'hl', label: 'Price: High to Low' },
          { id: 'disc', label: 'Best Discount' },
        ].map(opt => (
          <label key={opt.id} className="flex items-center gap-2 py-1.5 cursor-pointer text-[13px]">
            <input type="radio" name="sort" checked={sort === opt.id} onChange={() => setSort(opt.id)} className="accent-[#1565C0]" />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Creator Picks */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500 mb-2.5">Creator Picks</div>
        <label className="flex items-center gap-2 cursor-pointer text-[13px]">
          <input type="checkbox" checked={infOnly} onChange={() => setInfOnly(!infOnly)} className="accent-[#7B1FA2]" />
          <span className="text-[#7B1FA2] font-semibold">⭐ Creator Picks Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-115px)] bg-[#F5F5F5]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 px-4 py-2.5 bg-white border-b border-gray-200">
        <Link to="/" className="text-[#1565C0] hover:underline">Home</Link>
        <span>›</span>
        <span className="font-semibold text-gray-800">
          {query ? `Search: "${query}"` : catParam || 'All Products'}
        </span>
        <span className="text-gray-400">({filtered.length} results)</span>

        {isFiltered && (
          <button onClick={clearFilters} className="ml-2 flex items-center gap-1 text-[#1565C0] font-semibold">
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[220px] bg-white border-r border-gray-200 p-4 shrink-0 sticky top-[106px] self-start max-h-[calc(100vh-106px)] overflow-y-auto">
          <FilterPanel />
        </div>

        {/* Mobile filter toggle */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md"
          >
            <SlidersHorizontal size={14} />
            Filters {isFiltered && <span className="bg-[#0D47A1] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">!</span>}
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)} className="ml-auto text-[12px] border border-gray-300 rounded-md px-2 py-1.5 outline-none bg-white">
            <option value="pop">Popularity</option>
            <option value="rating">Rating</option>
            <option value="lh">Price ↑</option>
            <option value="hl">Price ↓</option>
            <option value="disc">Discount</option>
          </select>
        </div>

        {showFilters && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4">
            <FilterPanel />
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 p-3 md:p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-[10px] overflow-hidden animate-pulse">
                  <div className="h-[155px] bg-gray-200" />
                  <div className="p-2.5 flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-8 bg-gray-200 rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-extrabold">No products found</h3>
              <p className="text-gray-500 max-w-xs text-sm">Try adjusting your filters or search for something else.</p>
              <button onClick={clearFilters} className="bg-[#0D47A1] text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-[#1565C0] transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {paginated.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  <button
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-md border border-gray-300 text-[13px] font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1
                      : page <= 4 ? i + 1
                      : page >= totalPages - 3 ? totalPages - 6 + i
                      : page - 3 + i;
                    return (
                      <button key={p} onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                        className={`w-9 h-9 rounded-md text-[13px] font-bold transition-colors ${page === p ? 'bg-[#0D47A1] text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-md border border-gray-300 text-[13px] font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
