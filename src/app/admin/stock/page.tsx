"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, Package,
  ChevronDown, ChevronUp, X, Save, ImagePlus
} from 'lucide-react';
import { getProductImage } from '@/utils/imageHelper';
export type Variation = { weight: string; price: number };
export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  variations: Variation[];
  images: string[]; // array of base64 or URLs
  image?: string; // fallback single image
  tag?: string;
};

const CATEGORIES = ['Vegetables', 'Fruits', 'Fish', 'Meat', 'Dairy', 'Bakery', 'Snacks', 'Bengali Special', 'Drinking Water'];
const STORAGE_KEY = 'chakdaha_products';

const getStatus = (stock: number): Product['status'] => {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  return 'In Stock';
};

const emptyForm = {
  name: '', category: 'Vegetables', stock: '', tag: '',
  images: [] as string[],
  variations: [{ weight: '', price: '' }] as { weight: string; price: string }[]
};

export default function StockManagement() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setInventory(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Save to localStorage whenever inventory changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const inStock = inventory.filter(i => i.status === 'In Stock').length;
  const lowStock = inventory.filter(i => i.status === 'Low Stock').length;
  const outStock = inventory.filter(i => i.status === 'Out of Stock').length;

  const filtered = inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCat === 'All' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setForm(emptyForm); setFormError(''); setEditingId(null); setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setForm({
      name: product.name, category: product.category,
      stock: String(product.stock), tag: product.tag || '',
      images: product.images || [product.image].filter(Boolean),
      variations: product.variations.map(v => ({ weight: v.weight, price: String(v.price) })),
    });
    setFormError(''); setEditingId(product.id); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const addVariation = () => setForm(f => ({ ...f, variations: [...f.variations, { weight: '', price: '' }] }));
  const removeVariation = (i: number) => setForm(f => ({ ...f, variations: f.variations.filter((_, idx) => idx !== i) }));
  const updateVariation = (i: number, field: 'weight' | 'price', val: string) => {
    setForm(f => {
      const vars = [...f.variations];
      vars[i] = { ...vars[i], [field]: val };
      return { ...f, variations: vars };
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { setFormError('Images must be under 2MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setForm(f => ({ ...f, images: [...f.images, result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Product name is required.'); return; }
    if (!form.stock || isNaN(Number(form.stock))) { setFormError('Valid stock quantity is required.'); return; }
    if (form.variations.some(v => !v.weight.trim() || !v.price || isNaN(Number(v.price)))) {
      setFormError('All variations need a weight label and valid price.'); return;
    }

    const stockNum = parseInt(form.stock);
    const variations: Variation[] = form.variations.map(v => ({ weight: v.weight.trim(), price: parseFloat(v.price) }));

    if (editingId) {
      setInventory(prev => prev.map(p => p.id === editingId
        ? { ...p, name: form.name.trim(), category: form.category, stock: stockNum, status: getStatus(stockNum), variations, images: form.images, tag: form.tag.trim() || undefined }
        : p
      ));
    } else {
      const newProduct: Product = {
        id: `PRD-${Date.now()}`,
        name: form.name.trim(),
        category: form.category,
        stock: stockNum,
        status: getStatus(stockNum),
        variations,
        images: form.images,
        tag: form.tag.trim() || undefined,
      };
      setInventory(prev => [newProduct, ...prev]);
    }
    closeModal();
  };

  const deleteProduct = (id: string) => {
    if (confirm('Delete this product?')) setInventory(prev => prev.filter(p => p.id !== id));
  };

  const updatePrice = (id: string, weight: string, newPrice: number) => {
    setInventory(prev => prev.map(item => item.id === id
      ? { ...item, variations: item.variations.map(v => v.weight === weight ? { ...v, price: newPrice } : v) }
      : item
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Inventory Control</h1>
          <p className="text-gray-400 text-sm mt-1">Manage products, variations, and pricing.</p>
        </div>
        <button onClick={openAddModal} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
          <Plus size={20} /> Add New Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'In Stock', count: inStock, color: 'green', Icon: CheckCircle2 },
          { label: 'Low Stock', count: lowStock, color: 'yellow', Icon: AlertTriangle },
          { label: 'Out of Stock', count: outStock, color: 'red', Icon: AlertTriangle },
        ].map(c => (
          <div key={c.label} className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4`}>
            <div className={`p-4 bg-${c.color}-50 text-${c.color}-500 rounded-2xl`}><c.Icon size={28} /></div>
            <div>
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{c.label}</p>
              <p className="text-2xl font-black text-gray-900">{c.count} {c.count === 1 ? 'Item' : 'Items'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search inventory..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full md:w-48 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs text-gray-400 font-black uppercase tracking-widest">
                <th className="px-6 py-5">Image</th>
                <th className="px-6 py-5">Product Details</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Stock / Status</th>
                <th className="px-6 py-5">Variations</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-28 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center"><Package size={40} className="text-gray-200" /></div>
                      <div>
                        <p className="text-gray-400 font-bold text-base">{inventory.length === 0 ? 'No products added yet' : 'No results found'}</p>
                        <p className="text-gray-300 text-sm mt-1">{inventory.length === 0 ? 'Click "Add New Product" to start.' : 'Try a different search or category.'}</p>
                      </div>
                      {inventory.length === 0 && (
                        <button onClick={openAddModal} className="mt-2 bg-primary/10 text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
                          <Plus size={16} /> Add First Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {item.images && item.images.length > 0 ? (
                          <div className="flex -space-x-4">
                            {item.images.slice(0, 3).map((img, i) => (
                              <img 
                                key={i} 
                                src={getProductImage(img, item.category)} 
                                alt={item.name} 
                                className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getProductImage(undefined, item.category);
                                }}
                              />
                            ))}
                            {item.images.length > 3 && (
                              <div className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400">+{item.images.length - 3}</div>
                            )}
                          </div>
                        ) : item.image ? (
                           <img 
                             src={getProductImage(item.image, item.category)} 
                             alt={item.name} 
                             className="w-12 h-12 object-cover rounded-xl" 
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = getProductImage(undefined, item.category);
                             }}
                           />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.id}</div>
                        {item.tag && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">{item.tag}</span>}
                      </td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">{item.category}</span></td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{item.stock} units</div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.status === 'In Stock' ? 'bg-green-100 text-green-700' : item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                          {item.variations.length} Var{item.variations.length !== 1 ? 's' : ''} {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="text-blue-500 hover:bg-blue-50 p-2.5 rounded-xl transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => deleteProduct(item.id)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-gray-50/30">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-white rounded-3xl border border-gray-100">
                              {item.variations.map(v => (
                                <div key={v.weight} className="p-3 border border-gray-50 rounded-2xl">
                                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{v.weight}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400 font-bold text-sm">₹</span>
                                    <input type="number" value={v.price} min={0} onChange={e => updatePrice(item.id, v.weight, parseInt(e.target.value) || 0)} className="w-full font-black text-gray-900 outline-none focus:text-primary transition-colors text-sm" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Fill in product details below</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"><X size={22} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Images <span className="text-gray-400 font-normal">(Add multiple)</span></label>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img src={img} className="w-full h-full object-cover rounded-xl" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold mt-1">Add</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fresh Local Rohu Fish" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
                </div>

                {/* Category + Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Stock Qty <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="e.g. 20" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
                  </div>
                </div>

                {/* Tag */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tag / Badge <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. Fresh, 15% OFF, Bestseller" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>

                {/* Variations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-700">Variations & Pricing <span className="text-red-500">*</span></label>
                    <button type="button" onClick={addVariation} className="text-xs text-primary font-bold hover:underline flex items-center gap-1"><Plus size={14} /> Add Variation</button>
                  </div>
                  <div className="space-y-3">
                    {form.variations.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                        <input type="text" value={v.weight} onChange={e => updateVariation(i, 'weight', e.target.value)} placeholder="Weight/Size (e.g. 500g)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <span className="px-2 text-gray-400 font-bold text-sm">₹</span>
                          <input type="number" min="0" value={v.price} onChange={e => updateVariation(i, 'price', e.target.value)} placeholder="Price" className="w-20 px-2 py-2 text-sm focus:outline-none" required />
                        </div>
                        {form.variations.length > 1 && (
                          <button type="button" onClick={() => removeVariation(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"><X size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {formError && <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl border border-red-100">⚠ {formError}</div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-primary text-white px-4 py-3 rounded-xl font-black hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm">
                    <Save size={18} /> {editingId ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
