"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, ThumbsUp, CreditCard, ChevronRight, Zap, Plus } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '@/redux/cartSlice';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';
import { Star } from 'lucide-react';
import { getProductImage } from '@/utils/imageHelper';

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();

  const categories = [
    { name: "Vegetables", color: "bg-green-100", slug: "vegetables", icon: "🥦" },
    { name: "Fruits", color: "bg-orange-100", slug: "fruits", icon: "🍎" },
    { name: "Fish", color: "bg-blue-100", slug: "fish", icon: "🐟" },
    { name: "Meat", color: "bg-red-100", slug: "meat", icon: "🍗" },
    { name: "Dairy", color: "bg-yellow-100", slug: "dairy", icon: "🥛" },
    { name: "Bakery", color: "bg-amber-100", slug: "bakery", icon: "🍞" },
    { name: "Snacks", color: "bg-purple-100", slug: "snacks", icon: "🍿" },
    { name: "Drinking Water", color: "bg-blue-50", slug: "drinking-water", icon: "💧" },
  ];

  const [featuredProducts, setFeaturedProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('chakdaha_products');
    if (saved) {
      try { 
        const products = JSON.parse(saved);
        setFeaturedProducts(products.slice(0, 5).map((p: any) => ({
          ...p,
          displayImage: getProductImage(p.images && p.images.length > 0 ? p.images[0] : p.image, p.category)
        }))); 
      } catch {}
    }
  }, []);

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

  const handleAddToCart = (product: any) => {
    const action = () => {
      dispatch(addItemToCart({
        id: product.id,
        name: product.name,
        price: product.variations ? product.variations[0].price : product.price,
        weight: product.variations ? product.variations[0].weight : product.weight,
        image: product.images && product.images.length > 0 ? product.images[0] : (product.image || product.displayImage)
      }));
    };

    const session = localStorage.getItem('chakdaha_user_session');
    if (!session) {
      handleLoginRequired(action);
      return;
    }
    action();
  };

  const handleBuyNow = (product: any) => {
    const action = () => {
      handleAddToCart(product);
      router.push('/checkout');
    };

    const session = localStorage.getItem('chakdaha_user_session');
    if (!session) {
      handleLoginRequired(action);
      return;
    }
    action();
  };

  return (
    <div className="bg-surface dark:bg-gray-950 pb-20 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-dark via-primary to-primary-light overflow-hidden pt-20 pb-28">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-3/5 text-white space-y-8 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
              >
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest">Now serving Chakdaha Nadia</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black leading-[1.1] text-white"
              >
                Chakdaha's Fastest <br />
                <span className="text-secondary drop-shadow-lg">Grocery Delivery</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-primary-100 max-w-xl font-medium"
              >
                Fresh vegetables, local fish, and daily essentials delivered to your doorstep with next-day delivery.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start"
              >
                <Link href="/products" className="bg-secondary text-secondary-dark px-10 py-5 rounded-2xl font-black text-xl hover:bg-secondary-light transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 group">
                  Order Now <Zap size={22} className="group-hover:scale-125 transition-transform" />
                </Link>
                <Link href="/auth" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all flex items-center justify-center">
                  Live Tracking
                </Link>
              </motion.div>
            </div>
            
            <div className="md:w-2/5 relative h-[500px] w-full hidden md:flex items-center justify-center">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 1 }}
                 className="relative z-10 bg-white/10 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/20 shadow-2xl rotate-3"
               >
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: "🥦", label: "Fresh", delay: 0.3 },
                      { icon: "🐟", label: "Local", delay: 0.4 },
                      { icon: "🥛", label: "Pure", delay: 0.5 },
                      { icon: "🍎", label: "Sweet", delay: 0.6 }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: item.delay }}
                        className={`w-32 h-32 bg-white dark:bg-gray-900 rounded-[2.5rem] flex flex-col items-center justify-center text-5xl shadow-2xl ${i % 2 !== 0 ? 'mt-12' : '-mt-12'}`}
                      >
                        {item.icon}
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
               </motion.div>
               {/* Decorative circles */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] -z-10"></div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/30 rounded-full blur-[80px] -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">Trending Items</h2>
              <p className="text-gray-500 mt-1">Our most popular fresh essentials</p>
            </div>
            <Link href="/products" className="bg-primary/5 text-primary px-6 py-3 rounded-2xl font-bold hover:bg-primary/10 transition-all">
              Marketplace
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <AnimatePresence>
              {featuredProducts.map((product) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id} 
                  className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="aspect-square rounded-3xl bg-gray-50 dark:bg-gray-800 mb-4 overflow-hidden">
                    <img 
                      src={product.displayImage} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getProductImage(undefined, product.category);
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[3rem] mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-black text-gray-900 dark:text-white">₹{product.variations?.[0]?.price || product.price}</span>
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-500">4.9</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-primary/5 text-primary py-3 rounded-2xl font-bold text-xs hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                    <button 
                      onClick={() => handleBuyNow(product)}
                      className="bg-secondary text-secondary-dark py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-secondary-light transition-all"
                    >
                      <Zap size={14} /> Buy
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Top Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">Explore Categories</h2>
            <p className="text-gray-500 mt-1">Wide range of fresh items for you</p>
          </div>
          <Link href="/products" className="text-primary font-bold hover:underline flex items-center gap-1 group">
            View All <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <Link href={`/products?category=${cat.name}`} key={idx}>
              <motion.div 
                whileHover={{ y: -8 }}
                className="flex flex-col items-center gap-4 cursor-pointer group"
              >
                <div className={`w-full aspect-square ${cat.color} rounded-[2.5rem] flex items-center justify-center shadow-sm group-hover:shadow-2xl transition-all duration-500 border-b-8 border-black/5`}>
                   <span className="text-4xl md:text-5xl group-hover:scale-125 transition-transform duration-500 drop-shadow-sm">{cat.icon}</span>
                </div>
                <span className="text-sm font-black text-gray-700 dark:text-gray-300 text-center">{cat.name}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Clock, label: "Fast Delivery", desc: "Superfast delivery across Chakdaha Nadia.", color: "blue" },
            { icon: ShieldCheck, label: "Fresh Quality", desc: "Guaranteed local market freshness.", color: "green" },
            { icon: ThumbsUp, label: "Best Prices", desc: "Same as your local bazaar rates.", color: "yellow" },
            { icon: CreditCard, label: "Easy Pay", desc: "UPI, Card & Cash on Delivery.", color: "purple" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center group hover:shadow-2xl transition-all"
            >
              <div className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner`}>
                <item.icon size={36} />
              </div>
              <h4 className="font-black text-xl text-gray-900 dark:text-white mb-3">{item.label}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>


      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
