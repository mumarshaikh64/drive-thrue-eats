'use client';
import { useState, useEffect } from 'react';
import { Tag, Plus, Loader2, Trash2, Power, Percent } from 'lucide-react';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discount })
      });
      const data = await res.json();
      
      if (res.ok) {
        setCode('');
        setDiscount('');
        fetchCoupons();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Coupons</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2 flex items-center gap-2">
            Discount Management <div className="h-1 w-8 bg-brand-red rounded-full" />
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleCreate} className="bg-[#212529] rounded-[2rem] p-8 border border-gray-800 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">
              <Plus className="text-brand-red" /> New Coupon
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Coupon Code</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER20"
                    className="w-full bg-[#1a1d20] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white font-bold uppercase placeholder:text-gray-600 focus:outline-none focus:border-brand-red transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Discount (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="10"
                    className="w-full bg-[#1a1d20] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-brand-red transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-red text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-brand-red">
              <Loader2 className="animate-spin" size={40} />
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-[#212529] rounded-[2rem] p-12 text-center border border-gray-800 flex flex-col items-center justify-center">
              <Tag size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 uppercase">No Coupons Active</h3>
              <p className="text-sm text-gray-500 mt-2">Create your first discount code.</p>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div key={coupon.id} className="bg-[#212529] border border-gray-800 p-6 rounded-2xl flex items-center justify-between group hover:border-gray-600 transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${coupon.isActive ? 'bg-brand-red/10 text-brand-red' : 'bg-gray-800 text-gray-500'}`}>
                    {coupon.discount}%
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-widest ${coupon.isActive ? 'text-white' : 'text-gray-500 line-through'}`}>
                      {coupon.code}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                      {new Date(coupon.createdAt).toLocaleDateString()} &middot; {coupon.isActive ? <span className="text-green-500">Active</span> : <span className="text-gray-500">Disabled</span>}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-col sm:flex-row">
                  <button
                    onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center gap-2 ${
                      coupon.isActive ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    <Power size={14} /> {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
