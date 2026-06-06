'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Image as ImageIcon, Save, X, Search, ChevronRight } from 'lucide-react';
import { resolveMenuImage } from '@/lib/image-helper';


export default function MenuManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'item'>('item');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    discount: '0',
    tags: '',
    categoryId: '',
    categoryName: '',
    image: '',
    restaurant: 'Burger Arena'
  });

  const [uploading, setUploading] = useState(false);

  const [newCat, setNewCat] = useState({
    name: ''
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image to 400x400, strictly forcing the size
          ctx.drawImage(img, 0, 0, 400, 400);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setNewItem({ ...newItem, image: resizedDataUrl });
        }
        setUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async () => {
    if (!newItem.image) return alert('Please upload an image');
    try {
      if (editingId) {
        // UPDATE Existing
        const res = await fetch('/api/menu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingId, 
            updates: {
              name: newItem.name,
              price: parseFloat(newItem.price),
              description: newItem.description,
              discount: parseFloat(newItem.discount),
              tags: newItem.tags,
              categoryId: newItem.categoryId,
              categoryName: newItem.categoryName,
              image: newItem.image,
              restaurant: newItem.restaurant
            }
          })
        });
        if (res.ok) {
          fetchMenu();
          setShowAddModal(false);
          setEditingId(null);
          resetForm();
        }
      } else {
        // CREATE New
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'item', payload: newItem })
        });
        if (res.ok) {
          fetchMenu();
          setShowAddModal(false);
          resetForm();
        }
      }
    } catch (err) {
      alert(editingId ? 'Failed to update item' : 'Failed to add item');
    }
  };

  const resetForm = () => {
    setNewItem({ 
      name: '', 
      price: '', 
      description: '', 
      discount: '0', 
      tags: '', 
      categoryId: '', 
      categoryName: '', 
      image: '', 
      restaurant: 'Burger Arena' 
    });
  };

  const editItem = (it: any) => {
    setEditingId(it.id);
    setNewItem({
      name: it.name,
      price: String(it.price),
      description: it.description || '',
      discount: String(it.discount || '0'),
      tags: it.tags || '',
      categoryId: it.categoryId,
      categoryName: it.categoryName,
      image: it.image,
      restaurant: it.restaurant || 'Burger Arena'
    });
    setModalType('item');
    setShowAddModal(true);
  };

  const handleAddCategory = async () => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', payload: newCat })
      });
      if (res.ok) {
        fetchMenu();
        setShowAddModal(false);
        setNewCat({ name: '' });
      }
    } catch (err) {
      alert('Failed to add category');
    }
  };

  const deleteItem = async (id: string, type: 'item' | 'category' = 'item') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type })
    });
    fetchMenu();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tighter uppercase">Menu Control</h1>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-1">Management Dashboard • Dynamic Content</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setEditingId(null); resetForm(); setModalType('category'); setShowAddModal(true); }}
              className="bg-white border border-gray-200 text-gray-900 font-bold px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all text-sm"
            >
              <Plus size={18} /> NEW CATEGORY
            </button>
            <button 
              onClick={() => { setEditingId(null); resetForm(); setModalType('item'); setShowAddModal(true); }}
              className="bg-brand-red text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-red-700 transition-all text-sm shadow-premium"
            >
              <Plus size={18} /> ADD NEW DISH
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center font-bold animate-pulse text-gray-300 tracking-[0.5em]">SYNCHRONIZING DATABASE...</div>
        ) : (
          <div className="space-y-12">
            {categories.map(cat => (
              <div key={cat.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 rounded-full bg-brand-red/70" />
                  <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{cat.name}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.items.length} Items</span>
                  <button 
                    onClick={() => deleteItem(cat.id, 'category')}
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Category"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cat.items.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm group hover:shadow-premium transition-all">
                      <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-4 relative">
                        <img src={resolveMenuImage(item.image)} alt={item.name || "Item image"} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {item.discount > 0 && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-lg">
                              {item.discount}% OFF
                            </span>
                          )}
                          {item.tags?.split(',').map((tag: string) => tag.trim() && (
                            <span key={tag} className="bg-brand-red text-white text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); editItem(item); }}
                            className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-blue-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-blue-50"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 px-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.restaurant}</p>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-brand-red text-lg">₹{item.price - (item.price * (item.discount / 100))}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-gray-400 line-through font-bold">₹{item.price}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-brand-text/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
              <div className="bg-brand-red p-8 flex justify-between items-center text-white">
                <h3 className="text-2xl font-bold uppercase tracking-tight">
                  {modalType === 'item' 
                    ? (editingId ? 'Update Menu Item' : 'Add New Menu Item') 
                    : 'New Category Section'}
                </h3>
                <button onClick={() => { setShowAddModal(false); setEditingId(null); resetForm(); }} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[80vh]">
                {modalType === 'item' ? (
                  <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Dish Name</label>
                        <input 
                          type="text" 
                          value={newItem.name}
                          onChange={e => setNewItem({...newItem, name: e.target.value})}
                          placeholder="e.g. Smash Burger" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Base Price</label>
                          <input 
                            type="number" 
                            value={newItem.price}
                            onChange={e => setNewItem({...newItem, price: e.target.value})}
                            placeholder="0" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Discount %</label>
                          <input 
                            type="number" 
                            value={newItem.discount}
                            onChange={e => setNewItem({...newItem, discount: e.target.value})}
                            placeholder="0" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Final Price Preview */}
                    {parseFloat(newItem.discount) > 0 && (
                      <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Final Price Preview</span>
                        <span className="text-2xl font-bold text-green-700">
                          ₹{parseFloat(newItem.price || '0') - (parseFloat(newItem.price || '0') * (parseFloat(newItem.discount) / 100))}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Description</label>
                      <textarea 
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Tell us about this dish..." 
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all resize-none"
                      />
                    </div>

                    {/* Cat & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Category</label>
                        <select 
                          value={newItem.categoryId}
                          onChange={e => {
                            const cat = categories.find(c => c.id === e.target.value);
                            setNewItem({...newItem, categoryId: e.target.value, categoryName: cat.name});
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all appearance-none"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Tags (Comma separated)</label>
                        <input 
                          type="text" 
                          value={newItem.tags}
                          onChange={e => setNewItem({...newItem, tags: e.target.value})}
                          placeholder="Spicy, Vegan, Popular" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red transition-all"
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Product Photo</label>
                      {newItem.image ? (
                        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden group">
                          <img src={resolveMenuImage(newItem.image)} alt="Upload preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setNewItem({...newItem, image: ''})}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all font-bold text-xs uppercase"
                          >
                            Change Image
                          </button>
                        </div>
                      ) : (
                        <label className="w-full aspect-video rounded-[2rem] border-4 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 hover:border-brand-red/20 transition-all group">
                          <div className="w-16 h-16 bg-white rounded-3xl shadow-premium flex items-center justify-center text-gray-300 group-hover:text-brand-red transition-all">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {uploading ? 'Processing...' : 'Click to Upload Image'}
                          </p>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>

                    <button 
                      onClick={handleAddItem}
                      className="w-full bg-brand-text text-white font-bold py-6 rounded-[2rem] shadow-premium hover:bg-black transition-all uppercase tracking-[0.2em] text-sm mt-4 active:scale-95"
                    >
                      {editingId ? 'Update Changes' : 'Add Item'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Category Name</label>
                      <input 
                        type="text" 
                        value={newCat.name}
                        onChange={e => setNewCat({...newCat, name: e.target.value})}
                        placeholder="e.g. Beverages" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAddCategory}
                      className="w-full bg-brand-text text-white font-bold py-6 rounded-[2rem] shadow-premium hover:bg-black transition-all uppercase tracking-[0.2em] text-sm mt-4"
                    >
                      Add Category
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
