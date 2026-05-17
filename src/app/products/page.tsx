"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Heart, Zap, Check, Droplets, Star, MessageSquare, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart } from '@/redux/cartSlice';
import { toggleWishlist } from '@/redux/wishlistSlice';
import { RootState } from '@/redux/store';
import { useSearchParams, useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';
import { getProductImage } from '@/utils/imageHelper';

type Variation = { weight: string; price: number };
type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  status: string;
  variations: Variation[];
  images: string[];
  image?: string;
  tag?: string;
};

type Review = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
};

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Fish', 'Meat', 'Dairy', 'Bakery', 'Snacks', 'Drinking Water'];

const DUMMY_PRODUCTS: Product[] = [];

function ProductCard({ product, onLoginRequired }: { product: Product; onLoginRequired: (callback: () => void) => void }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isInWishlist = wishlistItems.some(i => i.id === Number(product.id) || i.id === (product.id as any));
  const [selectedVariation, setSelectedVariation] = useState(product.variations[0]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const displayImages = (product.images && product.images.filter(Boolean).length > 0) 
    ? product.images.filter(Boolean).map(img => getProductImage(img, product.category)) 
    : [getProductImage(product.image, product.category)];

  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const allReviews = JSON.parse(localStorage.getItem('chakdaha_reviews') || '[]');
    setReviews(allReviews.filter((r: Review) => r.productId === product.id));
  }, [product.id]);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  const handleAddToCart = () => {
    const session = localStorage.getItem('chakdaha_user_session');
    if (!session) {
      onLoginRequired(() => {
        dispatch(addItemToCart({
          id: product.id,
          name: product.name,
          price: selectedVariation.price,
          weight: selectedVariation.weight,
          image: displayImages[0] || ''
        }));
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      });
      return;
    }

    dispatch(addItemToCart({
      id: product.id,
      name: product.name,
      price: selectedVariation.price,
      weight: selectedVariation.weight,
      image: displayImages[0] || ''
    }));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const session = localStorage.getItem('chakdaha_user_session');
    if (!session) {
      onLoginRequired(() => {
        handleAddToCart();
        router.push('/checkout');
      });
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group flex flex-col relative overflow-hidden">
      {product.tag && <div className={`absolute top-0 left-0 text-white text-[10px] font-bold px-3 py-1.5 rounded-br-2xl z-20 ${product.tag.includes('OFF') ? 'bg-red-500' : 'bg-primary'}`}>{product.tag}</div>}
      <button onClick={() => dispatch(toggleWishlist({ id: product.id as any, name: product.name, price: selectedVariation.price, image: displayImages[0] || '' }))} className={`absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md transition-colors ${isInWishlist ? 'bg-red-50 text-red-500' : 'bg-black/5 text-gray-400 hover:text-red-500'}`}><Heart size={20} fill={isInWishlist ? 'currentColor' : 'none'} /></button>
      
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-800 group/image">
        <img 
          src={displayImages[currentImageIdx]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = getProductImage(undefined, product.category);
          }}
        />
        
        {displayImages.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-1 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"><ChevronRight size={16} className="rotate-180" /></button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-1 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"><ChevronRight size={16} /></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {displayImages.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIdx === i ? 'bg-primary w-3' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-1.5 mb-4 justify-center overflow-x-auto no-scrollbar py-1 shrink-0">
          {displayImages.map((img, i) => (
            <button 
              key={i} 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIdx(i);
              }} 
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${currentImageIdx === i ? 'border-primary scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base line-clamp-2 leading-tight min-h-[2.5rem]">{product.name}</h3>
          {avgRating && (
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg shrink-0">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-500">{avgRating}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {product.variations.map(v => <button key={v.weight} onClick={() => setSelectedVariation(v)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedVariation.weight === v.weight ? 'bg-primary border-primary text-white' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500'}`}>{v.weight}</button>)}
        </div>
        <div className="mt-auto">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <span className="text-2xl font-black text-gray-900 dark:text-white">₹{selectedVariation.price}</span>
            <button 
              onClick={() => setShowReviews(!showReviews)}
              className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              <MessageSquare size={14} /> {reviews.length} Reviews
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleAddToCart} className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${isAdded ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>{isAdded ? <Check size={18} /> : <Plus size={18} />}{isAdded ? 'Added' : 'Add'}</button>
            <button onClick={handleBuyNow} className="bg-secondary text-secondary-dark hover:bg-secondary-light py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"><Zap size={16} /> Buy Now</button>
          </div>
        </div>
      </div>

      {/* Expandable Reviews */}
      <AnimatePresence>
        {showReviews && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 space-y-4 max-h-60 overflow-y-auto no-scrollbar">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Reviews</p>
              {reviews.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{review.customerName}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
                    <p className="text-[9px] text-gray-400 font-medium">{review.date}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleLoginRequired = (action: () => void) => {
    setPendingAction(() => action);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('chakdaha_products');
      let adminProducts: Product[] = [];
      if (saved) { try { adminProducts = JSON.parse(saved); } catch {} }
      // Merge dummy products with admin products (admin products first)
      const merged = adminProducts;
      setProducts(merged);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-surface dark:bg-gray-950 min-h-screen">
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-2.5 text-center text-sm font-bold tracking-wide">🚀 Order Today → Receive Tomorrow! Next-day delivery guaranteed across Chakdaha Nadia.</div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div><h1 className="text-4xl font-black text-gray-900 dark:text-white">Fresh Marketplace</h1><p className="text-gray-500 dark:text-gray-400 mt-1">High quality essentials delivered to Chakdaha Nadia.</p></div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for items..." className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all dark:text-white" /></div>
            <button className="bg-white dark:bg-gray-900 p-3 rounded-2xl text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:bg-gray-50"><Filter size={20} /></button>
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-3 mb-10 pb-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-5 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50'}`}>{cat === 'Drinking Water' && <Droplets size={14} />}{cat}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onLoginRequired={handleLoginRequired}
              />
            ))}
          </AnimatePresence>
        </div>

        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading marketplace...</div>}><ProductsContent /></Suspense>; }
