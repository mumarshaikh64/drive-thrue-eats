'use client';
import { useState, useEffect } from 'react';
import {
  ShoppingBag, Utensils, LayoutGrid, Plus, Minus,
  Search, X, Check, ArrowLeft, LogOut, Loader2
} from 'lucide-react';
import { resolveMenuImage } from '@/lib/image-helper';


export default function WaiterPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [waiter, setWaiter] = useState<any>(null);
  const [sid, setSid] = useState('');
  const [pin, setPin] = useState('');

  const [step, setStep] = useState<'tables' | 'menu' | 'review'>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [existingOrderItems, setExistingOrderItems] = useState<any[]>([]);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'credit'>('cash');
  const [accountType, setAccountType] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [kitchenTab, setKitchenTab] = useState<'Pending' | 'Preparing' | 'Ready'>('Pending');

  // Credit payment states
  const [creditName, setCreditName] = useState('');
  const [creditCompany, setCreditCompany] = useState('');
  const [creditPhone, setCreditPhone] = useState('');

  const fetchExistingOrder = async (tableNum: number) => {
    try {
      const oRes = await fetch('/api/orders');
      const oData = await oRes.json();
      const active = oData.find((o: any) => o.tableNumber == tableNum && o.status !== 'Delivered' && o.status !== 'Cancelled');

      if (active) {
        const items = Array.isArray(active.items) ? active.items : JSON.parse(active.items || '[]');
        setExistingOrderItems(items);
        setExistingOrderId(active.orderId || active.id);
      } else {
        setExistingOrderItems([]);
        setExistingOrderId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTableSelect = (t: any) => {
    setSelectedTable(t);
    fetchExistingOrder(t.number);
    setStep('menu');
  };

  const loadInitialData = async () => {
    const tRes = await fetch('/api/tables');
    const tData = await tRes.json();
    setTables(tData);

    const oRes = await fetch('/api/orders');
    const oData = await oRes.json();
    if (Array.isArray(oData)) {
      setActiveOrders(oData.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled'));
    } else {
      setActiveOrders([]);
    }

    const mRes = await fetch('/api/menu');
    const mData = await mRes.json();
    if (Array.isArray(mData)) setCategories(mData);
  };

  useEffect(() => {
    const saved = localStorage.getItem('dte_waiter_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sid) {
          setWaiter(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Session restore error", e);
        localStorage.removeItem('dte_waiter_session');
      }
    }

    loadInitialData();
    const interval = setInterval(loadInitialData, 3000); // 3 seconds for better real-time feel
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
        const isAuthorized = staff.role === 'Waiter' ||
          staff.role === 'Manager' ||
          staff.role.toLowerCase().includes('waiter');

        if (isAuthorized) {
          setWaiter(staff);
          setIsLoggedIn(true);
          localStorage.setItem('dte_waiter_session', JSON.stringify(staff));
          loadInitialData();
        } else {
          alert(`Access Denied: Role '${staff.role}' is not authorized for the Waiter Portal.`);
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

  const addToCart = (item: any) => {
    const exists = cart.find(c => c.id === item.id);
    if (exists) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const isBeverage = (item: any) => {
    const cat = (item.categoryName || item.category || '').toLowerCase();
    return cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') ||
      cat.includes('shake') || cat.includes('water') || cat.includes('shakes') ||
      cat.includes('juices') || cat.includes('ice cream');
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const updateExistingQty = async (itemId: string, itemStatus: string, delta: number) => {
    if (!existingOrderId) return;

    const newItems = existingOrderItems.map((c: any) => {
      if (c.id === itemId && c.status === itemStatus) return { ...c, quantity: Math.max(0, c.quantity + delta) };
      return c;
    }).filter((c: any) => c.quantity > 0);

    setExistingOrderItems(newItems);
    const newTotal = newItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);

    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingOrderId,
          updates: {
            items: JSON.stringify(newItems),
            total: newTotal
          }
        })
      });
      loadInitialData();
    } catch (e) {
      console.error('Failed to update DB quantity', e);
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const ordersRes = await fetch('/api/orders');
      const orders = await ordersRes.json();
      const activeOrder = orders.find((o: any) =>
        o.tableNumber == selectedTable.number &&
        o.type === 'dining' &&
        o.status !== 'Delivered' &&
        o.status !== 'Cancelled'
      );

      if (activeOrder) {
        const existingItems = Array.isArray(activeOrder.items) ? activeOrder.items : JSON.parse(activeOrder.items || '[]');
        const updatedExisting = existingItems.map((it: any) => ({
          ...it,
          status: it.status || 'ready'
        }));
        const newCartItems = cart.map((it: any) => ({
          ...it,
          status: 'pending'
        }));
        
        // Merge items with the same id and status to avoid duplicates
        const mergedItems: any[] = [];
        
        updatedExisting.forEach((existingItem: any) => {
          const duplicate = mergedItems.find(it => it.id === existingItem.id && it.status === existingItem.status);
          if (duplicate) {
            duplicate.quantity += existingItem.quantity;
          } else {
            mergedItems.push({ ...existingItem });
          }
        });

        newCartItems.forEach((cartItem: any) => {
          const duplicate = mergedItems.find(it => it.id === cartItem.id && it.status === cartItem.status);
          if (duplicate) {
            duplicate.quantity += cartItem.quantity;
          } else {
            mergedItems.push({ ...cartItem });
          }
        });

        const newTotal = activeOrder.total + cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        const kitchenItems = cart.filter(it => !isBeverage(it));
        const kitchenStatus = kitchenItems.length > 0 ? 'Pending' : activeOrder.status;

        const updates: any = {
          items: JSON.stringify(mergedItems),
          total: newTotal,
          status: kitchenStatus
        };

        const patchRes = await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeOrder.orderId, updates })
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json();
          throw new Error(errData.detail || errData.error || 'Server error');
        }
        alert(kitchenItems.length > 0 ? 'Items added to existing Table Order!' : 'Beverages added to bill!');
      } else {
        const kitchenItems = cart.filter(it => !isBeverage(it));
        const orderData: any = {
          customerName: `Table ${selectedTable.number} Guest`,
          phone: 'N/A',
          type: 'dining',
          tableNumber: String(selectedTable.number),
          items: cart,
          total: cart.reduce((sum, it) => sum + (it.price * it.quantity), 0),
          paymentMethod: paymentMethod === 'credit' ? 'Credit' : paymentMethod,
          status: kitchenItems.length > 0 ? 'Pending' : 'Delivered',
          waiter: waiter.name,
          payment_type: paymentMethod === 'cash' ? 'cash' : paymentMethod === 'credit' ? 'credit' : 'upi',
          ...(paymentMethod === 'credit' && {
            credit_customer_name: creditName,
            credit_company_name: creditCompany,
            credit_phone: creditPhone,
            credit_status: 'pending',
          }),
        };

        const postRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        if (!postRes.ok) {
          const errData = await postRes.json();
          throw new Error(errData.detail || errData.error || 'Server error');
        }
        alert(kitchenItems.length > 0 ? 'Order sent to kitchen!' : 'Beverages added to bill!');
      }

      setCart([]);
      setShowCart(false);
      await loadInitialData();
      if (selectedTable) {
        await fetchExistingOrder(selectedTable.number);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const shareBillViaWhatsApp = () => {
    const defaultPhone = creditPhone || '';
    const phoneInput = prompt("Enter Customer WhatsApp Phone Number (with Country Code, e.g., 923001234567 or 919876543210):", defaultPhone);
    if (phoneInput === null) return;

    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone) {
      alert("Invalid phone number. Please enter a numeric phone number with country code.");
      return;
    }

    const dateStr = new Date().toLocaleString();
    const tableNum = selectedTable?.number || 'N/A';
    const waiterName = waiter?.name || 'Staff';
    const orderId = existingOrderId || 'New Order';

    const allItems = [...existingOrderItems, ...cart];
    if (allItems.length === 0) {
      alert("There are no items in the bill to share.");
      return;
    }

    const totalBill = allItems.reduce((s, it) => s + (it.price * it.quantity), 0);
    const shareUrl = `${window.location.origin}/receipt/${orderId}`;

    const message = `*DRIVE THRU EATS* 🍔🔥\n*Burger Arena - Premium Flavors*\n---------------------------------------\nYour premium visual bill is ready! Click the link below to view, print, or download your receipt:\n\n👉 ${shareUrl}\n\n*Bill Summary:*\n• *Order ID:* #${orderId}\n• *Table Number:* Table ${tableNum}\n• *Waiter:* ${waiterName}\n• *Date:* ${dateStr}\n• *Total Bill Amount:* *₹${totalBill}*\n---------------------------------------\nThank you for dining with us! ❤️`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-red/10 overflow-hidden">
      {!isLoggedIn ? (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Animated Background Decor */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

          <div className="max-w-md w-full backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative z-10 animate-fade-in">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-red to-orange-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-lg shadow-brand-red/20 rotate-3">
                <Utensils className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Waiter Portal</h1>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-[0.2em]">Secure Hardware Access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="group relative">
                <input
                  required
                  type="text"
                  placeholder="STAFF ID"
                  value={sid}
                  onChange={e => setSid(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-brand-red/50 focus:bg-white/10 transition-all text-center placeholder:text-slate-500"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold tracking-[1em] outline-none focus:border-brand-red/50 focus:bg-white/10 transition-all text-center placeholder:text-slate-500 placeholder:tracking-normal"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-red to-orange-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-brand-red/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-red to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-red/20">
                  {waiter?.name?.[0] || 'W'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">{waiter?.name || 'Staff'}</h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-500 rounded uppercase tracking-tighter border border-slate-200">{waiter?.role || 'Staff'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {step !== 'tables' && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative group flex items-center gap-3 px-4 md:px-6 py-2.5 md:py-3 bg-brand-red text-white rounded-xl md:rounded-2xl shadow-lg shadow-brand-red/20 transition-all hover:scale-105 active:scale-95"
                >
                  <ShoppingBag size={18} />
                  <span className="hidden sm:inline font-bold text-[10px] md:text-xs uppercase tracking-widest text-white">View Order</span>
                  {(cart.length > 0 || existingOrderItems.length > 0) && (
                    <span className="absolute -top-2 -right-2 bg-white text-brand-red text-[10px] font-bold rounded-full h-5 md:h-6 px-1.5 md:px-2 flex items-center justify-center border-2 border-brand-red shadow-soft">
                      {cart.reduce((sum, item) => sum + (item.quantity || 0), 0) + existingOrderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    </span>
                  )}
                </button>
              )}

              <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4">
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</p>
                <p className="text-[8px] md:text-[10px] font-bold text-green-500 uppercase flex items-center gap-1 md:gap-1.5">
                  <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live Tracking
                </p>
              </div>
              <button
                onClick={() => { localStorage.removeItem('dte_waiter_session'); setIsLoggedIn(false); }}
                className="p-2.5 md:p-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-brand-red rounded-xl transition-all border border-slate-200 group"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8 flex flex-col scrollbar-custom">
            {waiter?.role === 'Kitchen Staff' ? (
              <div className="space-y-8 animate-fade-in flex-1 flex flex-col h-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tighter uppercase leading-none">Kitchen Operations</h1>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Preparation Heartbeat</p>
                      <div className="h-[2px] w-12 bg-slate-200"></div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-red bg-brand-red/5 px-3 py-1 rounded-full uppercase italic">
                        Live Update Stream
                      </div>
                    </div>
                  </div>

                  {/* Kitchen Toggle Buttons - Visible only on mobile/tablet */}
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
                                <p className="text-[10px] font-bold text-brand-red/50 uppercase tracking-widest mt-1">
                                  {order.tableNumber ? `Dining • Table ${order.tableNumber}` : `${order.type} order`}
                                </p>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-brand-red group-hover:text-white transition-colors">
                                <Utensils size={18} />
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
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping flex-shrink-0" />
                                      )}
                                      {item.name}
                                    </span>
                                    <span className={isItemReady ? 'text-slate-400' : 'text-brand-red font-bold text-xs brightness-90'}>
                                      x{item.quantity} {isItemReady && '(Ready)'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            <button
                              onClick={async () => {
                                await fetch('/api/orders', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: order.orderId, updates: { status: 'Preparing', chef: waiter?.name || 'Chef' } })
                                });
                                loadInitialData();
                              }}
                              className="w-full bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-brand-red hover:border-brand-red transition-all active:scale-[0.97]"
                            >
                              Make Order
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
                              onClick={async () => {
                                await fetch('/api/orders', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: order.orderId, updates: { status: 'Ready' } })
                                });
                                loadInitialData();
                              }}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
                            >
                              Complete Task
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Ready Column */}
                    <div className="flex flex-col gap-5 bg-emerald-100/30 backdrop-blur-sm p-6 rounded-[3rem] border border-emerald-200/20 h-full">
                      <h2 className="font-bold text-emerald-600 text-xs uppercase tracking-widest px-4">Out to guest</h2>
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
                                  <p className="text-[10px] font-bold text-brand-red/50 uppercase tracking-widest mt-1">
                                    {order.tableNumber ? `Dining • Table ${order.tableNumber}` : `${order.type} order`}
                                  </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-brand-red group-hover:text-white transition-colors">
                                  <Utensils size={18} />
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
                                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping flex-shrink-0" />
                                        )}
                                        {item.name}
                                      </span>
                                      <span className={isItemReady ? 'text-slate-400' : 'text-brand-red font-bold text-xs brightness-90'}>
                                        x{item.quantity} {isItemReady && '(Ready)'}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>

                              <button
                                onClick={async () => {
                                  await fetch('/api/orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: order.orderId, updates: { status: 'Preparing', chef: waiter?.name || 'Chef' } })
                                  });
                                  loadInitialData();
                                }}
                                className="w-full bg-slate-900 border-2 border-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-brand-red hover:border-brand-red transition-all active:scale-[0.97]"
                              >
                                Make Order
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
                                onClick={async () => {
                                  await fetch('/api/orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: order.orderId, updates: { status: 'Ready' } })
                                  });
                                  loadInitialData();
                                }}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
                              >
                                Complete Task
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Ready Column */}
                    {kitchenTab === 'Ready' && (
                      <div className="flex flex-col gap-5 bg-emerald-100/30 backdrop-blur-sm p-6 md:p-10 rounded-[3rem] border border-emerald-200/20 h-full animate-fade-in">
                        <h2 className="font-bold text-emerald-600 text-xs uppercase tracking-widest px-4">Out to guest</h2>
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
              <div className="flex-1 flex flex-col h-full animate-fade-in relative z-10">
                {step === 'tables' && (
                  <div className="space-y-12 max-w-6xl mx-auto w-full pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-5xl font-bold text-slate-800 tracking-tighter uppercase leading-none">Floor Map</h1>
                        <div className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                          Restaurant Intelligence System <div className="w-8 h-[1px] bg-slate-200"></div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm group hover:border-brand-red transition-all">
                          <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white group-hover:bg-brand-red transition-colors"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Seats</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm group hover:border-orange-500 transition-all">
                          <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white animate-pulse"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Sessions</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                      {tables.map((t, idx) => {
                        const isOccupied = activeOrders.some((o: any) => o.tableNumber == t.number);
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleTableSelect(t)}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className={`relative bg-white aspect-square rounded-[2rem] md:rounded-[3.5rem] border-2 transition-all p-4 md:p-10 flex flex-col items-center justify-center gap-3 md:gap-5 shadow-sm group animate-slide-up ${isOccupied
                              ? 'border-orange-500 ring-4 md:ring-8 ring-orange-500/5 shadow-orange-500/10'
                              : 'border-transparent hover:border-brand-red hover:shadow-2xl hover:shadow-brand-red/10'
                              }`}
                          >
                            {isOccupied && (
                              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                                <div className="bg-orange-500 text-white text-[7px] md:text-[8px] font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/30">Busy</div>
                              </div>
                            )}
                            <div className={`p-4 md:p-6 rounded-xl md:rounded-[2rem] transition-all transform group-hover:scale-110 group-hover:rotate-6 ${isOccupied ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-300 group-hover:bg-brand-red group-hover:text-white'
                              }`}>
                              <Utensils size={24} className="md:w-[32px] md:h-[32px]" />
                            </div>
                            <div className="text-center">
                              <p className={`font-bold text-xl md:text-3xl tracking-tighter ${isOccupied ? 'text-orange-600' : 'text-slate-800'}`}>T-{t.number}</p>
                              <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.seats} SEATS</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 'menu' && (
                  <div className="flex flex-col h-full animate-fade-in overflow-hidden relative">
                    {/* Full Width Menu Area */}
                    <div className="w-full h-full flex flex-col gap-8 pb-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStep('tables')}
                          className="flex items-center gap-3 text-slate-400 hover:text-slate-800 font-bold text-[10px] uppercase tracking-widest transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50">
                            <ArrowLeft size={16} />
                          </div>
                          Return to floor
                        </button>
                        <div className="bg-slate-900 shadow-xl shadow-slate-200 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest border border-white/10">
                          Editing Table {selectedTable?.number}
                        </div>
                      </div>

                      <div className="relative group max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors" size={20} />
                        <input
                          type="text"
                          placeholder="Search for dishes, categories, or keywords..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-sm shadow-sm focus:shadow-xl focus:shadow-brand-red/5 focus:border-brand-red/20 transition-all outline-none"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-10 scrollbar-custom pr-4">
                        {categories.map((cat, cIdx) => {
                          const filteredItems = (cat.items || []).filter((it: any) => (it.name || '').toLowerCase().includes(search.toLowerCase()));
                          if (filteredItems.length === 0) return null;
                          return (
                            <div key={cat.id} style={{ animationDelay: `${cIdx * 100}ms` }} className="animate-fade-in">
                              <h3 className="font-bold text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-4 ml-2">
                                {cat.name} <div className="h-[1px] flex-1 bg-slate-100"></div>
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredItems.map((it: any) => (
                                  <div key={it.id} className="bg-white p-4 rounded-3xl shadow-sm border border-transparent flex justify-between items-center group hover:border-brand-red/20 hover:shadow-xl hover:shadow-brand-red/5 hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500 shadow-inner">
                                        <img src={resolveMenuImage(it.image)} alt={it.name || "Menu item"} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                      </div>
                                      <div>
                                        <p className="font-bold text-xs text-slate-800 uppercase leading-none mb-1.5">{it.name}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-brand-red text-xs">₹{it.price}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => addToCart(it)}
                                      className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-brand-red hover:text-white hover:rotate-90 shadow-sm transition-all flex items-center justify-center flex-shrink-0 active:scale-75"
                                    >
                                      <Plus size={20} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Floating Side Panel for Order Tracking */}
                    {showCart && (
                      <div className="absolute inset-0 z-[100] flex justify-end animate-fade-in">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
                        <div className="w-full max-w-md bg-white h-full shadow-2xl relative animate-slide-left flex flex-col">
                          <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-2xl text-slate-800 tracking-tighter uppercase">Bill Details</h3>
                              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Table {selectedTable?.number} Session
                              </p>
                            </div>
                            <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand-red hover:text-white transition-all">
                              <X size={20} />
                            </button>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 scrollbar-custom">
                            {/* Existing Items */}
                            {existingOrderItems.length > 0 && (
                              <div className="space-y-4">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
                                  Already Ordered <div className="h-[1px] flex-1 bg-slate-100"></div>
                                </div>
                                <div className="space-y-3 mt-4">
                                  {existingOrderItems.map((item, i) => (
                                    <div key={i} className="group/item flex justify-between items-center gap-5 bg-slate-50 p-3 px-4 rounded-[1.5rem] border border-slate-100/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all">
                                      <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <h4 className="font-bold text-[10px] text-slate-500 uppercase truncate">{item.name}</h4>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                                          <button disabled className="w-6 h-6 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed">
                                            <Minus size={12} />
                                          </button>
                                          <span className="font-bold text-xs w-5 text-center text-slate-800">{item.quantity}</span>
                                          <button onClick={() => updateExistingQty(item.id, item.status || 'ready', 1)} className="w-6 h-6 rounded-lg bg-slate-50/50 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 flex items-center justify-center transition-all">
                                            <Plus size={12} />
                                          </button>
                                        </div>
                                        <p className="font-mono text-xs font-bold text-slate-500 tracking-wider w-12 text-right">₹{item.price * item.quantity}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* New Items */}
                            {cart.length > 0 ? (
                              <div className="space-y-4">
                                <div className="text-[9px] font-bold text-brand-red uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                                  New Selection <div className="h-[1px] flex-1 bg-brand-red/10"></div>
                                </div>
                                <div className="space-y-4">
                                  {cart.map(item => (
                                    <div key={item.id} className="group/item flex justify-between items-center gap-5 bg-white p-4 rounded-[2rem] border border-brand-red/10 shadow-lg shadow-brand-red/5 hover:-translate-y-0.5 transition-all">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs text-slate-800 uppercase truncate mb-1">{item.name}</h4>
                                        <p className="font-mono text-[10px] font-bold text-brand-red/60 tracking-wider">₹{item.price * item.quantity}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-xl bg-white text-slate-400 hover:text-brand-red shadow-sm flex items-center justify-center transition-all">
                                          <Minus size={14} />
                                        </button>
                                        <span className="font-bold text-sm w-6 text-center text-slate-800">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-xl bg-white text-slate-400 hover:text-brand-red shadow-sm flex items-center justify-center transition-all">
                                          <Plus size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              existingOrderItems.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32 grayscale">
                                  <ShoppingBag size={40} className="text-slate-300 mb-4" />
                                  <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Cart is Empty</p>
                                </div>
                              )
                            )}

                            {/* Payment Method Selection */}
                            {(cart.length > 0 || existingOrderItems.length > 0) && (
                              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`py-2.5 rounded-xl font-bold text-[9px] transition-all border-2 ${paymentMethod === 'cash'
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                      }`}
                                  >
                                    CASH
                                  </button>
                                  <button
                                    onClick={() => setPaymentMethod('online')}
                                    className={`py-2.5 rounded-xl font-bold text-[9px] transition-all border-2 ${paymentMethod === 'online'
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                      }`}
                                  >
                                    ONLINE
                                  </button>
                                  <button
                                    onClick={() => setPaymentMethod('credit')}
                                    className={`py-2.5 rounded-xl font-bold text-[9px] transition-all border-2 ${paymentMethod === 'credit'
                                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                                      : 'bg-white text-slate-400 border-slate-100 hover:border-orange-300'
                                      }`}
                                  >
                                    CREDIT
                                  </button>
                                </div>

                                {paymentMethod === 'online' && (
                                  <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
                                    <div className="space-y-1.5">
                                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Account</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. JazzCash"
                                        value={accountType}
                                        onChange={(e) => setAccountType(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:border-brand-red/50 shadow-sm transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">TRX ID</label>
                                      <input
                                        type="text"
                                        placeholder="ID"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold font-mono outline-none focus:border-brand-red/50 shadow-sm transition-all"
                                      />
                                    </div>
                                  </div>
                                )}

                                {paymentMethod === 'credit' && (
                                  <div className="space-y-4 pt-2 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                      <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Credit Customer Info</p>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Full Name *</label>
                                      <input
                                        type="text"
                                        placeholder="Customer Full Name"
                                        value={creditName}
                                        onChange={(e) => setCreditName(e.target.value)}
                                        className="w-full bg-white border border-orange-200/60 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:border-orange-400/70 shadow-sm transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Company Name *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Acme Corp"
                                        value={creditCompany}
                                        onChange={(e) => setCreditCompany(e.target.value)}
                                        className="w-full bg-white border border-orange-200/60 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:border-orange-400/70 shadow-sm transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Phone Number *</label>
                                      <input
                                        type="text"
                                        placeholder="Numeric Phone"
                                        value={creditPhone}
                                        onChange={(e) => setCreditPhone(e.target.value)}
                                        className="w-full bg-white border border-orange-200/60 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:border-orange-400/70 shadow-sm transition-all"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] mb-1 block">Total Bill Amount</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tighter leading-none">
                                  ₹{existingOrderItems.reduce((s, it) => s + (it.price * it.quantity), 0) + cart.reduce((s, it) => s + (it.price * it.quantity), 0)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {cart.some(it => !isBeverage(it)) && (
                                <button
                                  onClick={submitOrder}
                                  disabled={loading}
                                  className="bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-red/10 tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
                                >
                                  {loading ? <Loader2 className="animate-spin" /> : <><Check size={16} /> Send to Kitchen</>}
                                </button>
                              )}
                              {cart.length > 0 && cart.every(it => isBeverage(it)) && (
                                <button
                                  onClick={submitOrder}
                                  disabled={loading}
                                  className="bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
                                >
                                  {loading ? <Loader2 className="animate-spin" /> : <><Check size={16} /> Add to Bill</>}
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  if (paymentMethod === 'online' && (!accountType || !transactionId)) {
                                    alert("Please enter Account Type and Transaction ID.");
                                    return;
                                  }
                                  if (paymentMethod === 'credit' && (!creditName.trim() || !creditCompany.trim() || !creditPhone.trim())) {
                                    alert("Please fill in Credit customer's Full Name, Company Name, and Phone Number.");
                                    return;
                                  }
                                  if (confirm("Finalize transaction and clear table status?")) {
                                    try {
                                      const updates: any = {
                                        status: 'Delivered',
                                        paymentMethod: paymentMethod === 'online'
                                          ? `Online (${accountType})`
                                          : paymentMethod === 'credit'
                                            ? 'Credit'
                                            : 'Cash',
                                        transactionNumber: paymentMethod === 'online' ? transactionId : null,
                                        payment_type: paymentMethod === 'cash' ? 'cash' : paymentMethod === 'credit' ? 'credit' : 'upi',
                                        ...(paymentMethod === 'credit' && {
                                          credit_customer_name: creditName,
                                          credit_company_name: creditCompany,
                                          credit_phone: creditPhone,
                                          credit_status: 'pending',
                                        }),
                                      };

                                      await fetch('/api/orders', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: existingOrderId, updates })
                                      });
                                      alert(paymentMethod === 'credit' ? `Credit recorded for ${creditName}!` : "Bill Finalized!");
                                      setTimeout(() => {
                                        window.print();
                                        setStep('tables');
                                        setShowCart(false);
                                        setPaymentMethod('cash');
                                        setAccountType('');
                                        setTransactionId('');
                                        setCreditName('');
                                        setCreditCompany('');
                                        setCreditPhone('');
                                      }, 500);
                                    } catch (err) {
                                      alert("Error finalizing bill");
                                    }
                                  }
                                }}
                                disabled={!existingOrderId || loading}
                                className={`font-bold py-3.5 rounded-2xl tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 transition-all border ${
                                  paymentMethod === 'credit'
                                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                                    : 'bg-white text-slate-400 hover:bg-slate-900 hover:text-white border-slate-200'
                                }`}
                              >
                                <ShoppingBag size={16} />
                                {paymentMethod === 'credit' ? 'Record Credit & Close' : 'Close & Finalize Bill'}
                              </button>

                              {(existingOrderItems.length > 0 || cart.length > 0) && (
                                <button
                                  type="button"
                                  onClick={shareBillViaWhatsApp}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/10 tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                                  </svg>
                                  Share via WhatsApp
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Receipt for Printing (Thermal Style) */}
      <div id="receipt-print" className="hidden print:block p-8 bg-white text-black font-mono text-sm max-w-[80mm] mx-auto border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase">Drive Thru Eats</h2>
          <p className="text-xs">Burger Arena - Premium Flavors</p>
          <div className="border-b border-dashed border-gray-400 my-4" />
          <p className="text-[10px] uppercase font-bold">Sales Receipt</p>
          <p className="text-[10px]" suppressHydrationWarning>Date: {new Date().toLocaleString()}</p>
          {existingOrderId && <p className="text-[10px]">Order ID: {existingOrderId}</p>}
          <p className="text-[10px]">Server: {waiter?.name || 'Staff'}</p>
          <p className="text-[10px]">Table: {selectedTable?.number}</p>
        </div>

        <div className="border-b border-dashed border-gray-400 mb-4" />

        <table className="w-full text-[11px] mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-bold uppercase">Item</th>
              <th className="text-center py-2 font-bold uppercase">Qty</th>
              <th className="text-right py-2 font-bold uppercase">Price</th>
            </tr>
          </thead>
          <tbody>
            {[...existingOrderItems, ...cart].map((item, i) => (
              <tr key={i}>
                <td className="py-2 uppercase font-medium">{item.name}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-gray-400 pt-4 space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase">
            <span>Subtotal</span>
            <span>₹{existingOrderItems.reduce((s, it) => s + (it.price * it.quantity), 0) + cart.reduce((s, it) => s + (it.price * it.quantity), 0)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase">
            <span>Tax (0%)</span>
            <span>₹0</span>
          </div>
          <div className="flex justify-between text-lg font-bold uppercase pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>₹{existingOrderItems.reduce((s, it) => s + (it.price * it.quantity), 0) + cart.reduce((s, it) => s + (it.price * it.quantity), 0)}</span>
          </div>

          {/* Payment Info on Receipt */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-400 space-y-1">
            <div className="flex justify-between text-[10px] uppercase">
              <span>Payment Mode</span>
              <span className="font-bold">
                {paymentMethod === 'online' ? `Online (${accountType})` : paymentMethod === 'credit' ? 'Credit (Udhaar)' : 'Cash'}
              </span>
            </div>
            {paymentMethod === 'online' && (
              <div className="flex justify-between text-[10px] uppercase">
                <span>Transaction ID</span>
                <span className="font-bold">{transactionId}</span>
              </div>
            )}
            {paymentMethod === 'credit' && (
              <>
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Credit Name</span>
                  <span className="font-bold">{creditName}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Company</span>
                  <span className="font-bold">{creditCompany}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Credit Phone</span>
                  <span className="font-bold">{creditPhone}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-10 text-center text-[10px] space-y-2">
          <div className="border-b border-dashed border-gray-400 my-4" />
          <p className="font-bold">THANK YOU FOR DINING WITH US!</p>
          <p className="italic">Hope to see you again soon.</p>
        </div>
      </div>

      {/* Global CSS for Animations and Printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            display: block !important;
          }
          @page { size: auto; margin: 0; }
        }

        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes pulse-subtle { 0%, 100% { opacity: 1; } 50% { opacity: 0.95; transform: scale(0.995); } }
        
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slide-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
        .animate-shimmer { animation: shimmer 1.5s infinite; }

        .scrollbar-custom::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
    </div>
  );
}
