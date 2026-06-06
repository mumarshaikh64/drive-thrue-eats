'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Utensils, ShoppingBag, Check, Calendar, User, Printer, CreditCard, Loader2 } from 'lucide-react';

export default function PublicReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to load orders');
        const orders = await res.json();
        
        const found = orders.find((o: any) => o.orderId === id || o.id === id);
        if (found) {
          setOrder(found);
        } else {
          setError('Receipt not found. Please verify the link or Order ID.');
        }
      } catch (err) {
        setError('Unable to retrieve receipt. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12 mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading Premium Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Receipt Error</h1>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">{error || 'Something went wrong.'}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Parse items safely
  const items = Array.isArray(order.items) 
    ? order.items 
    : JSON.parse(order.items || '[]');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 overflow-hidden relative flex flex-col my-4">
        
        {/* Sleek Gradient Header */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-8 relative overflow-hidden text-center flex flex-col items-center">
          {/* Decorative floating shapes */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[80px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[80px] rounded-full"></div>
          
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20 rotate-3 animate-pulse">
            <Utensils className="text-white" size={32} />
          </div>
          
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Drive Thru Eats</h1>
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] mt-1.5">Burger Arena • Customer Bill</p>
          
          <div className="mt-4 px-3 py-1 bg-white/10 rounded-full border border-white/15 flex items-center gap-1.5">
            <Check size={12} className="text-green-400 animate-bounce" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-green-400">Bill Finalized</span>
          </div>
        </div>

        {/* Receipt Details Block */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50/80 rounded-2xl p-5 border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
            <div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt ID</span>
              <span className="font-mono text-[10px] font-bold text-slate-800">#{order.orderId}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Time</span>
              <span className="font-bold text-[10px] text-slate-800">
                {new Date(order.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dining Mode</span>
              <span className="font-bold text-[10px] text-slate-800 uppercase flex items-center gap-1">
                {order.type === 'dining' ? `Dining (Table ${order.tableNumber})` : order.type}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Server Assigned</span>
              <span className="font-bold text-[10px] text-slate-800">{order.waiter || 'Staff'}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ordered Items</h3>
            <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm max-h-[220px] overflow-y-auto scrollbar-custom">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 hover:-translate-y-0.5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-orange-50 text-orange-500 text-[10px] font-black flex items-center justify-center">
                      {item.quantity}x
                    </span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs font-black text-slate-800">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pt-4 border-t border-dashed border-slate-200 space-y-4">
            <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-100">
              <div>
                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">Grand Total Due</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">₹{order.total}</span>
              </div>
              
              <div className="text-right">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                  order.paymentMethod?.toLowerCase().includes('credit')
                    ? 'bg-orange-500 text-white shadow-orange-500/20'
                    : 'bg-emerald-500 text-white shadow-emerald-500/20'
                }`}>
                  {order.paymentMethod || 'Paid'}
                </span>
              </div>
            </div>

            {/* Credit Info or Online TRX details */}
            {order.paymentMethod?.toLowerCase().includes('online') && order.transactionNumber && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-semibold text-slate-500 flex justify-between">
                <span>Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-700">{order.transactionNumber}</span>
              </div>
            )}

            {order.paymentMethod?.toLowerCase().includes('credit') && order.credit_customer_name && (
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 space-y-1">
                <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest">Credit Holder Details</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-600">
                  <p>Name: <span className="text-slate-800">{order.credit_customer_name}</span></p>
                  <p>Company: <span className="text-slate-800">{order.credit_company_name || 'N/A'}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Bottom Section */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 hover:text-white text-slate-600 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 group"
          >
            <Printer size={16} className="group-hover:rotate-6 transition-transform" />
            Print Receipt
          </button>
        </div>
        
        {/* Aesthetic footer */}
        <div className="pb-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Thank you for dining with us! ❤️
        </div>
      </div>

      {/* Global CSS for Animations and Printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .min-h-screen, .w-full, .w-full * { visibility: visible; }
          .min-h-screen { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            background: white !important;
            padding: 0 !important;
            display: block !important;
          }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
