'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ChefHat, Utensils, LayoutGrid, Check, LogOut, Loader2, ArrowLeft
} from 'lucide-react';

export default function ChefPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chef, setChef] = useState<any>(null);
  const [sid, setSid] = useState('');
  const [pin, setPin] = useState('');

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kitchenTab, setKitchenTab] = useState<'Pending' | 'Preparing' | 'Ready'>('Pending');

  const lastOrderIdRef = useRef<string | null>(null);

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

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-4">
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

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8 flex flex-col scrollbar-custom">
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
                                <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${
                                  isItemReady 
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
                          <button
                            onClick={() => updateStatus(order.orderId, 'Preparing')}
                            className="w-full bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-orange-600 hover:border-orange-600 transition-all active:scale-[0.97]"
                          >
                            Start Cooking
                          </button>
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
                                <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2 rounded-xl ${
                                  isItemReady 
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
                                  <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${
                                    isItemReady 
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

                            <button
                              onClick={() => updateStatus(order.orderId, 'Preparing')}
                              className="w-full bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-orange-600 hover:border-orange-600 transition-all active:scale-[0.97]"
                            >
                              Start Cooking
                            </button>
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
                                  <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2 rounded-xl ${
                                    isItemReady 
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
          </main>
        </div>
      )}
    </div>
  );
}
