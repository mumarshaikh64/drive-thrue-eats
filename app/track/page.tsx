'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, CheckCircle2, Clock, MapPin, Phone, User, ShoppingBag, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const TRACKING_STEPS = [
  { status: 'Pending', label: 'Order Placed', desc: 'We have received your order' },
  { status: 'Preparing', label: 'Preparing', desc: 'Chef is crafting your meal' },
  { status: 'Ready', label: 'Ready', desc: 'Ready for pickup / Out for delivery' },
  { status: 'Delivered', label: 'Delivered', desc: 'Order completed, enjoy!' }
];

export default function TrackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryOrderId = searchParams.get('id') || '';

  const [orderIdInput, setOrderIdInput] = useState(queryOrderId);
  const [orderId, setOrderId] = useState(queryOrderId);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrder = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    try {
      const formattedId = idToFetch.trim().toUpperCase();
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(formattedId)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Order not found. Please verify your Order ID.');
        setOrder(null);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Failed to retrieve tracking status.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on query param change or mount
  useEffect(() => {
    if (queryOrderId) {
      setOrderId(queryOrderId);
      setOrderIdInput(queryOrderId);
      fetchOrder(queryOrderId);
    }
  }, [queryOrderId]);

  // Live auto-refresh loop (every 10s)
  useEffect(() => {
    if (!orderId || !autoRefresh || loading) return;

    // Don't keep refreshing completed orders
    if (order && (order.status === 'Delivered' || order.status === 'Cancelled')) {
      return;
    }

    const interval = setInterval(() => {
      // Background silent refetch
      const formattedId = orderId.trim().toUpperCase();
      fetch(`/api/orders?orderId=${encodeURIComponent(formattedId)}`)
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(data => {
          if (data) setOrder(data);
        })
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, autoRefresh, order, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    const formatted = orderIdInput.trim().toUpperCase();
    setOrderId(formatted);
    // Update URL query parameter without full reload
    router.push(`/track?id=${encodeURIComponent(formatted)}`);
    fetchOrder(formatted);
  };

  const getStepIndex = (status: string) => {
    return TRACKING_STEPS.findIndex(step => step.status === status);
  };

  const currentStepIdx = order ? getStepIndex(order.status) : -1;
  const orderItems = order
    ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items)
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 lg:pt-36 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back link */}
        <Link href="/" className="group inline-flex items-center gap-2 text-brand-muted hover:text-brand-red transition-all font-bold text-sm mb-8">
          <ArrowLeft size={16} /> Back to Menu
        </Link>

        {/* Heading */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-brand-text tracking-tighter">
            Track Your <span className="text-brand-red">Order.</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2">Enter your Tracking ID (e.g. DT-00049) to see real-time updates.</p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text"
              placeholder="Enter Tracking ID (e.g. DT-00049)"
              value={orderIdInput}
              onChange={e => setOrderIdInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 text-slate-800 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f06d2e] text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-tight shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Track Status'}
          </button>
        </form>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-10 flex items-start gap-4 animate-fade-in">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-sm text-red-800">Tracking Error</h4>
              <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Details Container */}
        {order ? (
          <div className="space-y-8 animate-fade-in">
            {/* Live Progress Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-orange to-brand-red" />

              <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Tracking</span>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                    {order.orderId}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => fetchOrder(orderId)}
                    disabled={loading}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 rounded-xl transition-all flex items-center justify-center active:scale-95"
                    title="Manual Refresh"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={e => setAutoRefresh(e.target.checked)}
                      className="accent-brand-red w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Refresh</span>
                  </label>
                </div>
              </div>

              {order.status === 'Cancelled' ? (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
                  <AlertCircle className="text-red-500 mx-auto mb-3" size={36} />
                  <h4 className="text-lg font-bold text-red-800">This Order was Cancelled</h4>
                  <p className="text-sm text-red-600/80 font-medium mt-1">
                    Please contact our support hotline if you have any questions.
                  </p>
                </div>
              ) : (
                /* Timeline Steps */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative pt-4">
                  {/* Line decoration for desktop */}
                  <div className="hidden md:block absolute left-8 right-8 top-[36px] h-1 bg-slate-100 z-0">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-1000"
                      style={{ width: `${Math.max(0, currentStepIdx) * 33.3}%` }}
                    />
                  </div>

                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const isUpcoming = idx > currentStepIdx;

                    return (
                      <div key={idx} className="flex md:flex-col items-center gap-4 md:text-center z-10">
                        {/* Indicator Circle */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCompleted
                          ? 'bg-green-500 border-green-200 text-white'
                          : isCurrent
                            ? 'bg-orange-500 border-orange-200 text-white shadow-lg shadow-orange-500/20 scale-110 animate-pulse-subtle'
                            : 'bg-white border-slate-100 text-slate-300'
                          }`}>
                          {isCompleted ? (
                            <CheckCircle2 size={20} fill="currentColor" className="text-green-500 stroke-white" />
                          ) : isCurrent ? (
                            <Clock size={20} className="animate-spin-slow" />
                          ) : (
                            <span className="font-black text-sm">{idx + 1}</span>
                          )}
                        </div>

                        {/* Text Details */}
                        <div className="space-y-1">
                          <h4 className={`font-bold text-sm tracking-tight ${isCurrent ? 'text-slate-800' : isCompleted ? 'text-slate-600' : 'text-slate-300'}`}>
                            {step.label}
                          </h4>
                          <p className={`text-[10px] font-medium leading-relaxed max-w-[150px] ${isCurrent ? 'text-orange-500 font-semibold' : 'text-slate-400'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-premium">
              <div className="space-y-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 block">Order Summary Details</div>

                {/* Details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-600 border-b border-slate-100 pb-6">
                  <div className="space-y-2.5">
                    <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Customer Name:</span> {order.customerName}</p>
                    <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Contact Number:</span> {order.phone}</p>
                    {order.email && (
                      <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Email:</span> {order.email}</p>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Service Type:</span> <span className="capitalize">{order.type}</span></p>
                    {order.type === 'dining' && order.tableNumber && (
                      <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Table Spot:</span> Table {order.tableNumber}</p>
                    )}
                    {order.type === 'delivery' && (
                      <>
                        <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Delivery Area:</span> {order.deliveryArea}</p>
                        <p className="line-clamp-2"><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Address:</span> {order.address}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dishes Ordered</span>
                  <div className="space-y-3">
                    {orderItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight">{item.quantity} x {item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">₹{item.price} each</p>
                        </div>
                        <span className="font-bold text-sm text-slate-700 font-mono">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment and Totals */}
                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="text-xs text-slate-600 font-semibold space-y-1">
                    <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Payment Method:</span> {order.paymentMethod}</p>
                    {order.transactionNumber && (
                      <p><span className="text-slate-400 uppercase tracking-wider text-[9px] block">Transaction ID:</span> {order.transactionNumber}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Grand Total</span>
                    <span className="text-2xl font-black text-brand-red font-mono">₹{order.total}</span>
                  </div>
                </div>

                {/* Chef Notes / Instructions */}
                {order.instructions && (
                  <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-2xl text-xs font-semibold text-slate-600">
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Instructions</span>
                    <span className="italic">&ldquo;{order.instructions}&rdquo;</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          !loading && orderId && (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-premium text-center">
              <ShoppingBag size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="font-bold text-slate-600">No active tracking data found for order ID &ldquo;{orderId}&rdquo;.</p>
              <p className="text-xs text-slate-400 mt-1">Please confirm your Order ID and try searching again.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
