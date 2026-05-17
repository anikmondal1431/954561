"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, MapPin, Clock, CheckCircle2, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const DUMMY_ORDERS = [
  {
    id: "ORD-9824",
    date: "May 12, 2024",
    status: "Delivered",
    total: 450,
    items: 3,
    address: "Chakdaha, Station Road",
    products: [
      { id: "1", name: "Fresh Local Rohu Fish (Cut)" },
      { id: "2", name: "Organic Tomatoes" }
    ]
  },
  {
    id: "ORD-9825",
    date: "Today",
    status: "On the way",
    total: 210,
    items: 1,
    address: "Chakdaha, Palpara",
    products: [
      { id: "4", name: "Chicken Curry Cut" }
    ]
  }
];

type Review = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
};

export default function MyOrdersPage() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string} | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = () => {
    const saved = localStorage.getItem('chakdaha_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Map real orders to display schema
          setOrders(parsed.slice().reverse().map((o: any) => ({
            id: o.id,
            date: o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Today",
            status: o.status || 'Pending',
            total: o.total,
            items: o.items ? o.items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0,
            address: o.customer?.address || 'Chakdaha',
            products: o.items || []
          })));
          return;
        }
      } catch {}
    }
    // Fallback to DUMMY_ORDERS if no orders exist yet
    setOrders(DUMMY_ORDERS);
  };

  useEffect(() => {
    const user = localStorage.getItem('chakdaha_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setCustomerName(parsed.name || '');
      } catch {}
    }
    
    loadOrders();
    const interval = setInterval(loadOrders, 3000); // Live poll order status changes
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      const saved = localStorage.getItem('chakdaha_orders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: 'Cancelled' } : o);
          localStorage.setItem('chakdaha_orders', JSON.stringify(updated));
          loadOrders();
          alert("Order cancelled successfully!");
        } catch {}
      }
    }
  };

  const handleRequestReturn = (orderId: string) => {
    const reason = prompt("Please enter the reason for your return (e.g., Perishable product not fresh, incorrect items):");
    if (reason === null) return; // Cancelled prompt
    if (!reason.trim()) {
      alert("A return reason is required!");
      return;
    }

    const saved = localStorage.getItem('chakdaha_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: 'Return Requested', returnReason: reason.trim() } : o);
        localStorage.setItem('chakdaha_orders', JSON.stringify(updated));
        loadOrders();
        alert("Your return request has been submitted successfully. Our team will contact you shortly!");
      } catch {}
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newReview: Review = {
      id: `REV-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      customerName: customerName || 'Anonymous Customer',
      rating,
      comment,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const existingReviews = JSON.parse(localStorage.getItem('chakdaha_reviews') || '[]');
    localStorage.setItem('chakdaha_reviews', JSON.stringify([newReview, ...existingReviews]));

    setShowReviewModal(false);
    setSelectedProduct(null);
    setComment('');
    setRating(5);
    alert('Review submitted successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Package className="text-primary" size={24} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">My Orders</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={order.id}
            className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-gray-400 font-mono">#{order.id}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    order.status === 'Return Requested' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.items} Items • ₹{order.total}</h3>
                
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    {order.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    {order.address}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link 
                  href={`/orders/${order.id}`}
                  className="w-full md:w-auto bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group"
                >
                  Track Order <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                {(order.status === 'Pending' || order.status === 'Processing') && (
                  <button 
                    onClick={() => handleCancelOrder(order.id)}
                    className="w-full md:w-auto bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Cancel Order
                  </button>
                )}
                {order.status === 'Delivered' && (
                  <>
                    <button 
                      onClick={() => handleRequestReturn(order.id)}
                      className="w-full md:w-auto bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                    >
                      Request Return
                    </button>
                    {order.products.length > 0 && (
                      <button 
                        onClick={() => {
                          setSelectedProduct(order.products[0]);
                          setShowReviewModal(true);
                        }}
                        className="w-full md:w-auto bg-primary/10 text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
                      >
                        <Star size={18} /> Review Product
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReviewModal(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Write a Review</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Share your experience with {selectedProduct?.name}</p>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-all ${rating >= star ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'}`}
                      >
                        <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Your Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none text-gray-900 dark:text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like about the product?"
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none text-gray-900 dark:text-white font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
