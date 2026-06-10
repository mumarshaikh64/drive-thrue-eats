'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ChefHat, Utensils, LayoutGrid, Check, LogOut, Loader2, ArrowLeft,
  History, TrendingUp, Clock, PackageCheck, Truck, XCircle, AlertCircle,
  ChevronDown, ChevronUp, CalendarDays, Search, Filter, Ban, MessageSquareWarning
} from 'lucide-react';

const DEFAULT_CANCEL_REASONS = [
  'Item out of stock',
  'Kitchen too busy',
  'Equipment malfunction',
  'Ingredient unavailable',
  'Order placed by mistake',
  'Customer requested cancellation',
  'Quality issue with ingredients',
  'Menu item discontinued',
];

export default function ChefPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chef, setChef] = useState<any>(null);
  const [sid, setSid] = useState('');
  const [pin, setPin] = useState('');

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kitchenTab, setKitchenTab] = useState<'Pending' | 'Preparing' | 'Ready'>('Pending');

  // History state
  const [mainView, setMainView] = useState<'kitchen' | 'history'>('kitchen');
  const [stats, setStats] = useState<any>(null);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Delivered' | 'Cancelled' | 'Pending' | 'Preparing' | 'Ready'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const lastOrderIdRef = useRef<string | null>(null);

  // Helpers to parse cancel reason and clean instructions
  const getCancelReasonFromInstructions = (instructions: string | null) => {
    if (!instructions) return null;
    if (instructions.startsWith('[CANCELLED_BY_CHEF:')) {
      const idx = instructions.indexOf(']');
      if (idx > -1) {
        return instructions.substring('[CANCELLED_BY_CHEF:'.length, idx).trim();
      }
    }
    return null;
  };

  const getCleanInstructions = (instructions: string | null) => {
    if (!instructions) return '';
    if (instructions.startsWith('[CANCELLED_BY_CHEF:')) {
      const idx = instructions.indexOf(']');
      if (idx > -1) {
        return instructions.substring(idx + 1).trim();
      }
    }
    return instructions;
  };

  const loadInitialData = async () => {
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    try {
      const oRes = await fetch('/api/orders');
      const oData = await oRes.json();
      if (Array.isArray(oData)) {
        const active = oData.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled');
        setActiveOrders(active);

        if (oData.length > 0) {
          const latestId = oData[0].id;
          const prevLatestId = lastOrderIdRef.current;

          if (prevLatestId && latestId !== prevLatestId) {
            const isNewActive = active.some((o: any) => o.id === latestId && o.status === 'Pending');
            if (isNewActive) {
              notificationSound.play().catch(e => console.log('Audio play blocked:', e));
            }
          }
          lastOrderIdRef.current = latestId;
        }
      } else {
        setActiveOrders([]);
      }
    } catch (e) {
      console.error("Failed to fetch kitchen orders:", e);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const chefQuery = chef?.name ? `?chef=${encodeURIComponent(chef.name)}` : '';
      const res = await fetch(`/api/orders/stats${chefQuery}`);
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.orders) setHistoryOrders(data.orders);
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('dte_chef_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sid) {
          setChef(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Session restore error", e);
        localStorage.removeItem('dte_chef_session');
      }
    }

    loadInitialData();
    const interval = setInterval(loadInitialData, 3000); // 3 seconds live poll
    return () => clearInterval(interval);
  }, []);

  // Load history when switching to history tab or when chef is loaded
  useEffect(() => {
    if (mainView === 'history' && isLoggedIn) {
      loadHistory();
    }
  }, [mainView, isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid, pin })
      });
      const data = await res.json();
      if (data.success) {
        const staff = data.staff;
        const isAuthorized = staff.role === 'Kitchen Staff' ||
          staff.role === 'Manager' ||
          staff.role.toLowerCase().includes('kitchen') ||
          staff.role.toLowerCase().includes('chef');

        if (isAuthorized) {
          setChef(staff);
          setIsLoggedIn(true);
          localStorage.setItem('dte_chef_session', JSON.stringify(staff));
          loadInitialData();
        } else {
          alert(`Access Denied: Role '${staff.role}' is not authorized for the Chef Portal.`);
        }
      } else {
        alert(data.error || 'Invalid ID or PIN');
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dte_chef_session');
    setChef(null);
    setIsLoggedIn(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          updates: {
            status: newStatus,
            chef: chef?.name || 'Chef'
          }
        })
      });
      await loadInitialData();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Open cancel modal
  const openCancelModal = (orderId: string) => {
    setCancelOrderId(orderId);
    setCancelReason('');
    setCustomReason('');
    setCancelModalOpen(true);
  };

  // Cancel order with reason
  const confirmCancelOrder = async () => {
    const reason = cancelReason === '__custom__' ? customReason.trim() : cancelReason;
    if (!reason) {
      alert('Please select or enter a cancellation reason.');
      return;
    }
    if (!cancelOrderId) return;

    setCancelling(true);
    try {
      const targetOrder = activeOrders.find(o => o.orderId === cancelOrderId);
      const originalInstructions = targetOrder?.instructions || '';
      const formattedReason = `[CANCELLED_BY_CHEF:${reason}]`;
      const newInstructions = originalInstructions 
        ? `${formattedReason} ${originalInstructions}` 
        : formattedReason;

      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cancelOrderId,
          updates: {
            status: 'Cancelled',
            chef: chef?.name || 'Chef',
            instructions: newInstructions
          }
        })
      });
      setCancelModalOpen(false);
      setCancelOrderId(null);
      setCancelReason('');
      setCustomReason('');
      await loadInitialData();
    } catch (err) {
      alert('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // History helpers
  const filteredHistory = historyOrders.filter(o => {
    const matchesFilter = historyFilter === 'all' || o.status === historyFilter;
    const matchesSearch = !historySearch || 
      o.orderId?.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.chef?.toLowerCase().includes(historySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'Preparing': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
      case 'Ready': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
      case 'Delivered': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'Cancelled': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-red/10 overflow-hidden">
      {!isLoggedIn ? (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Glowing Fire/Amber Background Decor for Chefs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

          <div className="max-w-md w-full backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative z-10 animate-fade-in">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20 rotate-3">
                <ChefHat className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Chef Portal</h1>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-[0.2em]">Secure Kitchen Access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="group relative">
                <input
                  required
                  type="text"
                  placeholder="CHEF ID"
                  value={sid}
                  onChange={e => setSid(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-center placeholder:text-slate-500 uppercase"
                />
              </div>
              <div className="group relative">
                <input
                  required
                  type="password"
                  placeholder="PIN"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold tracking-[1em] outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-center placeholder:text-slate-500 placeholder:tracking-normal"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Enter Dashboard'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Top Header - Glass Navbar */}
          <header className="px-8 py-5 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
                  {chef?.name?.[0] || 'C'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">{chef?.name || 'Chef'}</h2>
                  <span className="px-2 py-0.5 bg-orange-100 text-[8px] font-bold text-orange-600 rounded uppercase tracking-tighter border border-orange-200">{chef?.role || 'Kitchen Staff'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher: Kitchen / History */}
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setMainView('kitchen')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                    mainView === 'kitchen'
                      ? 'bg-white text-slate-800 shadow-md'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ChefHat size={14} />
                  Kitchen
                </button>
                <button
                  onClick={() => setMainView('history')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                    mainView === 'history'
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <History size={14} />
                  History
                </button>
              </div>

              <div className="hidden sm:flex flex-col items-end mr-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kitchen Heartbeat</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Active Stream
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-200 group"
                title="Logout"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </header>

          {/* Mobile View Switcher */}
          <div className="sm:hidden flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mx-4 mt-3">
            <button
              onClick={() => setMainView('kitchen')}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                mainView === 'kitchen'
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'text-slate-400'
              }`}
            >
              <ChefHat size={14} /> Kitchen
            </button>
            <button
              onClick={() => setMainView('history')}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                mainView === 'history'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400'
              }`}
            >
              <History size={14} /> History
            </button>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8 flex flex-col scrollbar-custom">
            {mainView === 'kitchen' ? (
              /* ==================== KITCHEN VIEW ==================== */
              <div className="space-y-8 animate-fade-in flex-1 flex flex-col h-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tighter uppercase leading-none">Kitchen Operations</h1>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Live order display system</p>
                      <div className="h-[2px] w-12 bg-slate-200"></div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase italic border border-orange-100">
                        Auto-Refresh Enabled
                      </div>
                    </div>
                  </div>

                  {/* Kitchen Tab Switches - Visible only on mobile/tablet */}
                  <div className="flex md:hidden bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner w-full md:w-auto">
                    <button
                      onClick={() => setKitchenTab('Pending')}
                      className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Pending' ? 'bg-white text-slate-800 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Incoming ({activeOrders.filter(o => o.status === 'Pending').length})
                    </button>
                    <button
                      onClick={() => setKitchenTab('Preparing')}
                      className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Preparing' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Preparing ({activeOrders.filter(o => o.status === 'Preparing').length})
                    </button>
                    <button
                      onClick={() => setKitchenTab('Ready')}
                      className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Ready' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Ready ({activeOrders.filter(o => o.status === 'Ready').length})
                    </button>
                  </div>
                </div>

                <div className="flex-1 pb-4">
                  {/* DESKTOP VIEW - 3 Columns Grid */}
                  <div className="hidden md:grid grid-cols-3 gap-6 h-full min-w-full">
                    {/* 1. Pending Column */}
                    <div className="flex flex-col gap-5 bg-slate-200/50 backdrop-blur-sm p-6 rounded-[3rem] border border-slate-200/60 shadow-inner h-full">
                      <div className="flex items-center justify-between px-4">
                        <h2 className="font-bold text-slate-500 text-xs uppercase tracking-widest flex items-center gap-2">
                          <LayoutGrid size={14} className="text-slate-400" /> Incoming orders
                        </h2>
                        <span className="bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                          {activeOrders.filter(o => o.status === 'Pending').length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                        {activeOrders.filter(o => o.status === 'Pending').length === 0 && (
                          <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">No New Orders</span>
                          </div>
                        )}
                        {activeOrders.filter(o => o.status === 'Pending').map(order => (
                          <div key={order.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.01] transition-all group animate-slide-up">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="font-bold text-xl text-slate-800 tracking-tighter line-clamp-1">{order.orderId}</span>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                  {order.tableNumber ? `Dining • Table ${order.tableNumber}` : `${order.type} order`}
                                </p>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <ChefHat size={18} />
                              </div>
                            </div>
                            <ul className="space-y-2.5 mb-8">
                              {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                const catName = (it.categoryName || '').toLowerCase();
                                return !catName.includes('beverage') && !catName.includes('drink');
                              }).map((item: any, i: number) => {
                                const isItemReady = item.status === 'ready';
                                return (
                                  <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${isItemReady
                                      ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through'
                                      : 'bg-slate-50/50 text-slate-700 border-dotted border-slate-200'
                                    }`}>
                                    <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                      {isItemReady ? (
                                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                                      )}
                                      {item.name}
                                    </span>
                                    <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold text-xs brightness-90'}>
                                      x{item.quantity} {isItemReady && '(Ready)'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {order.instructions && (
                              <div className="mb-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Notes</p>
                                <p className="text-xs text-slate-600 italic font-medium">"{order.instructions}"</p>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <button
                                onClick={() => openCancelModal(order.orderId)}
                                className="flex-shrink-0 bg-red-50 border-2 border-red-200 text-red-500 px-4 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:border-red-500 hover:text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                title="Cancel Order"
                              >
                                <Ban size={16} /> Cancel
                              </button>
                              <button
                                onClick={() => updateStatus(order.orderId, 'Preparing')}
                                className="flex-1 bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-orange-600 hover:border-orange-600 transition-all active:scale-[0.97]"
                              >
                                Start Cooking
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Preparing Column */}
                    <div className="flex flex-col gap-5 bg-orange-100/40 backdrop-blur-sm p-6 rounded-[3rem] border border-orange-200/30 h-full">
                      <div className="flex items-center justify-between px-4">
                        <h2 className="font-bold text-orange-600 text-xs uppercase tracking-widest flex items-center gap-2">
                          In preparation
                        </h2>
                        <span className="bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm">
                          {activeOrders.filter(o => o.status === 'Preparing').length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                        {activeOrders.filter(o => o.status === 'Preparing').length === 0 && (
                          <div className="h-40 flex items-center justify-center border-2 border-dashed border-orange-200 rounded-3xl opacity-50">
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">No Orders Here</span>
                          </div>
                        )}
                        {activeOrders.filter(o => o.status === 'Preparing').map(order => (
                          <div key={order.id} className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-orange-500/5 border-l-8 border-orange-500 group animate-pulse-subtle">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="font-bold text-xl text-slate-800 tracking-tighter line-clamp-1">{order.orderId}</span>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Cooking • {order.chef || 'Chef'}</p>
                              </div>
                            </div>
                            <ul className="space-y-2 mb-8">
                              {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                const catName = (it.categoryName || '').toLowerCase();
                                return !catName.includes('beverage') && !catName.includes('drink');
                              }).map((item: any, i: number) => {
                                const isItemReady = item.status === 'ready';
                                return (
                                  <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2 rounded-xl ${isItemReady
                                      ? 'bg-slate-100/50 text-slate-400 border border-solid border-slate-200 line-through'
                                      : 'bg-orange-50/50 text-slate-700'
                                    }`}>
                                    <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                      {isItemReady && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
                                      {item.name}
                                    </span>
                                    <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold'}>
                                      x{item.quantity} {isItemReady && '(Ready)'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {order.instructions && (
                              <div className="mb-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Notes</p>
                                <p className="text-xs text-slate-600 italic font-medium">"{getCleanInstructions(order.instructions)}"</p>
                              </div>
                            )}
                            <button
                              onClick={() => updateStatus(order.orderId, 'Ready')}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
                            >
                              Food Ready
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Ready Column */}
                    <div className="flex flex-col gap-5 bg-emerald-100/30 backdrop-blur-sm p-6 rounded-[3rem] border border-emerald-200/20 h-full">
                      <div className="flex items-center justify-between px-4">
                        <h2 className="font-bold text-emerald-600 text-xs uppercase tracking-widest px-4">
                          Out to guest
                        </h2>
                        <span className="bg-white text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200 shadow-sm">
                          {activeOrders.filter(o => o.status === 'Ready').length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                        {activeOrders.filter(o => o.status === 'Ready').length === 0 && (
                          <div className="h-40 flex items-center justify-center border-2 border-dashed border-emerald-200 rounded-3xl opacity-50">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Nothing to Serve</span>
                          </div>
                        )}
                        {activeOrders.filter(o => o.status === 'Ready').map(order => (
                          <div key={order.id} className="bg-white/80 p-7 rounded-[2.5rem] shadow-sm border border-emerald-100 scale-95 opacity-80 filter grayscale-[0.5]">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-bold text-base text-emerald-600 uppercase tracking-tighter">{order.orderId}</span>
                              <Check size={16} className="text-emerald-500" />
                            </div>
                            <div className="bg-emerald-50 py-3 rounded-2xl text-center border border-emerald-100">
                              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Ready</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MOBILE/TABLET VIEW - Toggled View */}
                  <div className="h-full md:hidden">
                    {/* 1. Pending Column */}
                    {kitchenTab === 'Pending' && (
                      <div className="flex flex-col gap-5 bg-slate-200/50 backdrop-blur-sm p-6 md:p-10 rounded-[3rem] border border-slate-200/60 shadow-inner h-full animate-fade-in">
                        <div className="flex items-center justify-between px-4">
                          <h2 className="font-bold text-slate-500 text-xs uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid size={14} className="text-slate-400" /> Incoming orders
                          </h2>
                          <span className="bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                            {activeOrders.filter(o => o.status === 'Pending').length}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                          {activeOrders.filter(o => o.status === 'Pending').length === 0 && (
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">No New Orders</span>
                            </div>
                          )}
                          {activeOrders.filter(o => o.status === 'Pending').map(order => (
                            <div key={order.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.01] transition-all group animate-slide-up">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <span className="font-bold text-xl text-slate-800 tracking-tighter line-clamp-1">{order.orderId}</span>
                                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                    {order.tableNumber ? `Dining • Table ${order.tableNumber}` : `${order.type} order`}
                                  </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                  <ChefHat size={18} />
                                </div>
                              </div>

                              <ul className="space-y-2.5 mb-8">
                                {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                  const catName = (it.categoryName || '').toLowerCase();
                                  return !catName.includes('beverage') && !catName.includes('drink');
                                }).map((item: any, i: number) => {
                                  const isItemReady = item.status === 'ready';
                                  return (
                                    <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${isItemReady
                                        ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through'
                                        : 'bg-slate-50/50 text-slate-700 border-dotted border-slate-200'
                                      }`}>
                                      <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                        {isItemReady ? (
                                          <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                                        )}
                                        {item.name}
                                      </span>
                                      <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold text-xs brightness-90'}>
                                        x{item.quantity} {isItemReady && '(Ready)'}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                              {order.instructions && (
                                <div className="mb-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Notes</p>
                                  <p className="text-xs text-slate-600 italic font-medium">"{order.instructions}"</p>
                                </div>
                              )}
                              <div className="flex gap-3">
                                <button
                                  onClick={() => openCancelModal(order.orderId)}
                                  className="flex-shrink-0 bg-red-50 border-2 border-red-200 text-red-500 px-4 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:border-red-500 hover:text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                  title="Cancel Order"
                                >
                                  <Ban size={16} /> Cancel
                                </button>
                                <button
                                  onClick={() => updateStatus(order.orderId, 'Preparing')}
                                  className="flex-1 bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-orange-600 hover:border-orange-600 transition-all active:scale-[0.97]"
                                >
                                  Start Cooking
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Preparing Column */}
                    {kitchenTab === 'Preparing' && (
                      <div className="flex flex-col gap-5 bg-orange-100/40 backdrop-blur-sm p-6 md:p-10 rounded-[3rem] border border-orange-200/30 h-full animate-fade-in">
                        <div className="flex items-center justify-between px-4">
                          <h2 className="font-bold text-orange-600 text-xs uppercase tracking-widest flex items-center gap-2">
                            In preparation
                          </h2>
                          <span className="bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm">
                            {activeOrders.filter(o => o.status === 'Preparing').length}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                          {activeOrders.filter(o => o.status === 'Preparing').length === 0 && (
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-orange-200 rounded-3xl opacity-50">
                              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">No Orders Here</span>
                            </div>
                          )}
                          {activeOrders.filter(o => o.status === 'Preparing').map(order => (
                            <div key={order.id} className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-orange-500/5 border-l-8 border-orange-500 group animate-pulse-subtle">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <span className="font-bold text-xl text-slate-800 tracking-tighter line-clamp-1">{order.orderId}</span>
                                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Cooking • {order.chef || 'Chef'}</p>
                                </div>
                              </div>

                              <ul className="space-y-2 mb-8">
                                {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                  const catName = (it.categoryName || '').toLowerCase();
                                  return !catName.includes('beverage') && !catName.includes('drink');
                                }).map((item: any, i: number) => {
                                  const isItemReady = item.status === 'ready';
                                  return (
                                    <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2 rounded-xl ${isItemReady
                                        ? 'bg-slate-100/50 text-slate-400 border border-solid border-slate-200 line-through'
                                        : 'bg-orange-50/50 text-slate-700'
                                      }`}>
                                      <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                        {isItemReady && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
                                        {item.name}
                                      </span>
                                      <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold'}>
                                        x{item.quantity} {isItemReady && '(Ready)'}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                              {order.instructions && (
                                <div className="mb-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Notes</p>
                                  <p className="text-xs text-slate-600 italic font-medium">"{getCleanInstructions(order.instructions)}"</p>
                                </div>
                              )}
                              <button
                                onClick={() => updateStatus(order.orderId, 'Ready')}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
                              >
                                Food Ready
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Ready Column */}
                    {kitchenTab === 'Ready' && (
                      <div className="flex flex-col gap-5 bg-emerald-100/30 backdrop-blur-sm p-6 md:p-10 rounded-[3rem] border border-emerald-200/20 h-full animate-fade-in">
                        <div className="flex items-center justify-between px-4">
                          <h2 className="font-bold text-emerald-600 text-xs uppercase tracking-widest px-4">Out to guest</h2>
                          <span className="bg-white text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200 shadow-sm">
                            {activeOrders.filter(o => o.status === 'Ready').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                          {activeOrders.filter(o => o.status === 'Ready').length === 0 && (
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-emerald-200 rounded-3xl opacity-50">
                              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Nothing to Serve</span>
                            </div>
                          )}
                          {activeOrders.filter(o => o.status === 'Ready').map(order => (
                            <div key={order.id} className="bg-white/80 p-7 rounded-[2.5rem] shadow-sm border border-emerald-100 scale-95 opacity-80 filter grayscale-[0.5]">
                              <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-base text-emerald-600 uppercase tracking-tighter">{order.orderId}</span>
                                <Check size={16} className="text-emerald-500" />
                              </div>
                              <div className="bg-emerald-50 py-3 rounded-2xl text-center border border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Ready</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ==================== HISTORY VIEW ==================== */
              <div className="space-y-8 animate-fade-in flex-1 flex flex-col h-full">
                {/* Header */}
                <div>
                  <h1 className="text-4xl font-bold text-slate-800 tracking-tighter uppercase leading-none">My History & Stats</h1>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Your complete performance overview</p>
                    <div className="h-[2px] w-12 bg-slate-200"></div>
                    <button
                      onClick={loadHistory}
                      disabled={historyLoading}
                      className="flex items-center gap-2 text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full uppercase border border-violet-100 hover:bg-violet-100 transition-colors"
                    >
                      {historyLoading ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
                      Refresh Stats
                    </button>
                  </div>
                </div>

                {/* Stats Cards Grid */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Orders */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/10 group hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                          <TrendingUp size={18} className="text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{stats.totalOrders}</p>
                      </div>
                    </div>

                    {/* Completed / Delivered */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/20 group hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                          <Truck size={18} className="text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Delivered</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{stats.delivered}</p>
                      </div>
                    </div>

                    {/* Remaining (Active) */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-3xl shadow-xl shadow-orange-500/20 group hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                          <Clock size={18} className="text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest mb-1">Remaining</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{stats.remaining}</p>
                      </div>
                    </div>

                    {/* Cancelled */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-3xl shadow-xl shadow-red-500/20 group hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                          <XCircle size={18} className="text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest mb-1">Cancelled</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{stats.cancelled}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Status Breakdown */}
                {stats && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-2"></div>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.pending}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mx-auto mb-2"></div>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.preparing}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Preparing</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-2"></div>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.ready}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-2"></div>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.delivered}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Delivered</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2"></div>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.cancelled}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cancelled</p>
                    </div>
                  </div>
                )}

                {/* Filter Bar & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'] as const).map(filter => {
                      const filterColors: Record<string, string> = {
                        all: historyFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200',
                        Pending: historyFilter === 'Pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white text-slate-500 border border-slate-200',
                        Preparing: historyFilter === 'Preparing' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white text-slate-500 border border-slate-200',
                        Ready: historyFilter === 'Ready' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 border border-slate-200',
                        Delivered: historyFilter === 'Delivered' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-500 border border-slate-200',
                        Cancelled: historyFilter === 'Cancelled' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white text-slate-500 border border-slate-200',
                      };
                      return (
                        <button
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all hover:scale-105 ${filterColors[filter]}`}
                        >
                          {filter === 'all' ? 'All Orders' : filter}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>

                {/* Orders History List */}
                <div className="space-y-3 pb-8">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 size={32} className="animate-spin text-violet-500" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                      <AlertCircle size={40} className="text-slate-300 mb-4" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No orders found</p>
                    </div>
                  ) : (
                    filteredHistory.map(order => {
                      const sc = getStatusColor(order.status);
                      const isExpanded = expandedOrderId === order.orderId;
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                          {/* Order Row */}
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)}
                            className="w-full flex items-center justify-between px-6 py-4 text-left"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl ${sc.bg} ${sc.border} border flex items-center justify-center flex-shrink-0`}>
                                {order.status === 'Delivered' && <Truck size={16} className={sc.text} />}
                                {order.status === 'Cancelled' && <XCircle size={16} className={sc.text} />}
                                {order.status === 'Pending' && <Clock size={16} className={sc.text} />}
                                {order.status === 'Preparing' && <ChefHat size={16} className={sc.text} />}
                                {order.status === 'Ready' && <PackageCheck size={16} className={sc.text} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-800 tracking-tight">{order.orderId}</span>
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} ${sc.border} border`}>
                                    {order.status}
                                  </span>
                                  {order.status === 'Cancelled' && (
                                    (() => {
                                      const reason = getCancelReasonFromInstructions(order.instructions);
                                      return reason ? (
                                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                          Reason: {reason}
                                        </span>
                                      ) : null;
                                    })()
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                                  {order.customerName} • {order.type}{order.tableNumber ? ` • Table ${order.tableNumber}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">Rs. {order.total?.toFixed(0)}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{formatDate(order.timestamp)}</p>
                              </div>
                              {order.chef && (
                                <div className="hidden md:flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                  <ChefHat size={10} className="text-orange-500" />
                                  <span className="text-[9px] font-bold text-orange-600 uppercase">{order.chef}</span>
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-slate-400" />
                              ) : (
                                <ChevronDown size={16} className="text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-6 pb-5 pt-0 border-t border-slate-100 animate-fade-in">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 mt-4">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Customer</p>
                                  <p className="text-sm font-bold text-slate-700">{order.customerName}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Type</p>
                                  <p className="text-sm font-bold text-slate-700">{order.type}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Chef</p>
                                  <p className="text-sm font-bold text-slate-700">{order.chef || '—'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                                  <p className="text-sm font-bold text-slate-700">Rs. {order.total?.toFixed(0)}</p>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Items</p>
                              <ul className="space-y-1.5">
                                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                                  <li key={i} className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl text-sm">
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                    <span className="text-slate-500 font-bold text-xs">x{item.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                              {getCleanInstructions(order.instructions) && (
                                <div className="bg-slate-50 p-3.5 rounded-xl mt-3 border border-slate-100">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer/Order Notes</p>
                                  <p className="text-xs font-semibold text-slate-600 italic">"{getCleanInstructions(order.instructions)}"</p>
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                                <CalendarDays size={12} />
                                <span>{new Date(order.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
      {/* ==================== CANCEL REASON MODAL ==================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setCancelModalOpen(false); setCancelOrderId(null); }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageSquareWarning size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Cancel Order</h3>
                  <p className="text-red-100 text-xs font-medium mt-0.5">
                    Order {cancelOrderId} — Admin & Waiter will be notified
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Select a reason</p>

              <div className="grid grid-cols-1 gap-2.5">
                {DEFAULT_CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => { setCancelReason(reason); setCustomReason(''); }}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 font-medium text-sm transition-all ${
                      cancelReason === reason
                        ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        cancelReason === reason
                          ? 'border-red-500 bg-red-500'
                          : 'border-slate-300'
                      }`}>
                        {cancelReason === reason && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                      {reason}
                    </div>
                  </button>
                ))}

                {/* Custom reason */}
                <button
                  onClick={() => setCancelReason('__custom__')}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 font-medium text-sm transition-all ${
                    cancelReason === '__custom__'
                      ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      cancelReason === '__custom__'
                        ? 'border-red-500 bg-red-500'
                        : 'border-slate-300'
                    }`}>
                      {cancelReason === '__custom__' && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    Other (write your own reason)
                  </div>
                </button>

                {cancelReason === '__custom__' && (
                  <textarea
                    autoFocus
                    placeholder="Type your reason here..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    className="w-full mt-1 px-5 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50/50 text-sm font-medium text-slate-700 outline-none focus:border-red-400 resize-none h-24 placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { setCancelModalOpen(false); setCancelOrderId(null); }}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancelling || (!cancelReason || (cancelReason === '__custom__' && !customReason.trim()))}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
