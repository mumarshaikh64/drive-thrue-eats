'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ChefHat, Utensils, LayoutGrid, Check, LogOut, Loader2, ArrowLeft,
  History, TrendingUp, Clock, PackageCheck, Truck, XCircle, AlertCircle,
  ChevronDown, ChevronUp, CalendarDays, Search, Filter, Ban, MessageSquareWarning,
  Eye, X, Bell
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

  // Notifications State
  const [kitchenAlerts, setKitchenAlerts] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const isFirstLoadAlertsRef = useRef(true);

  // Sync kitchenAlerts to localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('dte_chef_alerts', JSON.stringify(kitchenAlerts));
    }
  }, [kitchenAlerts, isLoggedIn]);

  // History state
  const [mainView, setMainView] = useState<'kitchen' | 'history'>('kitchen');
  const [stats, setStats] = useState<any>(null);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Delivered' | 'Cancelled' | 'Pending' | 'Preparing' | 'Ready'>('all');
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('all');
  const [historyFilterCustomDate, setHistoryFilterCustomDate] = useState<string>('');
  const [historyFilterOrderId, setHistoryFilterOrderId] = useState<string>('all');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const lastOrderIdRef = useRef<string | null>(null);
  const activeOrdersRef = useRef<any[]>([]);

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

        // Check if we should play a sound
        let shouldPlaySound = false;
        const newAlerts: any[] = [];

        if (activeOrdersRef.current.length > 0) {
          for (const newOrder of active) {
            // We only care about pending orders/items triggering sound
            if (newOrder.status === 'Pending') {
              const prevOrder = activeOrdersRef.current.find((o: any) => (o.orderId || o.id) === (newOrder.orderId || newOrder.id));
              
              if (!prevOrder) {
                // Completely new order
                shouldPlaySound = true;
                const newItemsQty = Array.isArray(newOrder.items) ? newOrder.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) : 0;
                newAlerts.push({
                  id: `${newOrder.orderId || newOrder.id}-${Date.now()}-${Math.random()}`,
                  orderId: newOrder.orderId || newOrder.id,
                  tableNumber: newOrder.tableNumber,
                  type: 'new_order',
                  message: `New Order #${newOrder.orderId || newOrder.id} received for Table ${newOrder.tableNumber || 'Takeaway'} (${newItemsQty} items)`,
                  timestamp: new Date().toISOString(),
                  read: false
                });
              } else {
                // Existing order, check if status changed back to Pending from Preparing/Ready
                const statusChangedToPending = prevOrder.status !== 'Pending' && newOrder.status === 'Pending';
                
                // Check if items count or quantity increased
                const prevItems = Array.isArray(prevOrder.items) ? prevOrder.items : [];
                const newItems = Array.isArray(newOrder.items) ? newOrder.items : [];
                
                const prevQty = prevItems.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
                const newQty = newItems.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
                
                const quantityIncreased = newQty > prevQty;

                if (statusChangedToPending || quantityIncreased) {
                  shouldPlaySound = true;
                  let updateMsg = `Order #${newOrder.orderId || newOrder.id} updated by waiter.`;
                  if (quantityIncreased) {
                    updateMsg = `Order #${newOrder.orderId || newOrder.id} updated: Waiter added ${newQty - prevQty} items (Table ${newOrder.tableNumber || 'Takeaway'}).`;
                  } else if (statusChangedToPending) {
                    updateMsg = `Order #${newOrder.orderId || newOrder.id} status changed back to Pending (Table ${newOrder.tableNumber || 'Takeaway'}).`;
                  }
                  newAlerts.push({
                    id: `${newOrder.orderId || newOrder.id}-${Date.now()}-${Math.random()}`,
                    orderId: newOrder.orderId || newOrder.id,
                    tableNumber: newOrder.tableNumber,
                    type: 'order_updated',
                    message: updateMsg,
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                }
              }
            }
          }
        } else if (oData.length > 0) {
          // Fallback legacy check for first load / simple edge cases
          const latestId = oData[0].id;
          const prevLatestId = lastOrderIdRef.current;
          if (prevLatestId && latestId !== prevLatestId) {
            const isNewActive = active.some((o: any) => o.id === latestId && o.status === 'Pending');
            if (isNewActive) {
              const matchingOrder = active.find((o: any) => o.id === latestId);
              shouldPlaySound = true;
              if (matchingOrder) {
                const newItemsQty = Array.isArray(matchingOrder.items) ? matchingOrder.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) : 0;
                newAlerts.push({
                  id: `${matchingOrder.orderId || matchingOrder.id}-${Date.now()}-${Math.random()}`,
                  orderId: matchingOrder.orderId || matchingOrder.id,
                  tableNumber: matchingOrder.tableNumber,
                  type: 'new_order',
                  message: `New Order #${matchingOrder.orderId || matchingOrder.id} received for Table ${matchingOrder.tableNumber || 'Takeaway'} (${newItemsQty} items)`,
                  timestamp: new Date().toISOString(),
                  read: false
                });
              }
            }
          }
        }

        if (isFirstLoadAlertsRef.current) {
          isFirstLoadAlertsRef.current = false;
        } else {
          if (shouldPlaySound) {
            notificationSound.play().catch(e => console.log('Audio play blocked:', e));
          }
          if (newAlerts.length > 0) {
            setKitchenAlerts(prev => {
              const combined = [...newAlerts, ...prev];
              return combined.slice(0, 50); // cap at 50
            });
          }
        }

        // Keep last order ID ref updated for legacy checks
        if (oData.length > 0) {
          lastOrderIdRef.current = oData[0].id;
        }

        // Store active orders for next comparisons
        activeOrdersRef.current = active;
      } else {
        setActiveOrders([]);
        activeOrdersRef.current = [];
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

    const savedAlerts = localStorage.getItem('dte_chef_alerts');
    if (savedAlerts) {
      try {
        setKitchenAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Failed to parse alerts", e);
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

  // Cancel order with reason (only uncooked/pending items, keeping ready/preparing/beverage items)
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
      if (!targetOrder) {
        alert('Order not found');
        return;
      }

      const items = Array.isArray(targetOrder.items) ? targetOrder.items : [];

      // Cancelled items: only chef items with status 'pending' (or no status)
      const cancelledItems = items.filter((it: any) => {
        const catName = (it.categoryName || '').toLowerCase();
        const isBeverage = catName.includes('beverage') || catName.includes('drink');
        return !isBeverage && (it.status === 'pending' || !it.status);
      });

      // Remaining items: all beverages, ready chef items, and preparing chef items
      const remainingItems = items.filter((it: any) => {
        const catName = (it.categoryName || '').toLowerCase();
        const isBeverage = catName.includes('beverage') || catName.includes('drink');
        return isBeverage || it.status === 'ready' || it.status === 'preparing';
      });

      const cancelledDesc = cancelledItems.map((it: any) => `${it.quantity}x ${it.name}`).join(', ');
      const reasonText = cancelledDesc ? `${reason} (Cancelled: ${cancelledDesc})` : reason;

      const originalInstructions = targetOrder.instructions || '';
      const formattedReason = `[CANCELLED_BY_CHEF:${reasonText}]`;
      const newInstructions = originalInstructions 
        ? `${formattedReason} ${originalInstructions}` 
        : formattedReason;

      if (remainingItems.length === 0) {
        // If no items are left, cancel the whole order
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
      } else {
        // Recalculate status based on remaining items
        const chefItems = remainingItems.filter((it: any) => {
          const catName = (it.categoryName || '').toLowerCase();
          return !catName.includes('beverage') && !catName.includes('drink');
        });

        let newStatus = 'Ready';
        if (chefItems.length > 0) {
          if (chefItems.some((it: any) => it.status === 'preparing')) {
            newStatus = 'Preparing';
          } else if (chefItems.some((it: any) => it.status === 'pending' || !it.status)) {
            newStatus = 'Pending';
          } else {
            newStatus = 'Ready';
          }
        }

        // If items remain, update order with remaining items and recalculate total
        const newTotal = remainingItems.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
        await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cancelOrderId,
            updates: {
              items: JSON.stringify(remainingItems),
              total: newTotal,
              status: newStatus,
              chef: chef?.name || 'Chef',
              instructions: newInstructions
            }
          })
        });
      }

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
  const uniqueOrderIds = Array.from(
    new Set(historyOrders.map(o => o.orderId || o.id))
  ).filter(Boolean).sort((a: any, b: any) => String(b).localeCompare(String(a)));

  const filteredHistory = historyOrders.filter(o => {
    // 1. Status Filter
    const matchesFilter = historyFilter === 'all' || o.status === historyFilter;
    if (!matchesFilter) return false;

    // 2. Order ID Filter
    if (historyFilterOrderId !== 'all' && (o.orderId || o.id) !== historyFilterOrderId) {
      return false;
    }

    // 3. Date Filter
    if (historyFilterDate !== 'all') {
      const orderDate = o.timestamp ? new Date(o.timestamp) : new Date();
      const today = new Date();
      
      if (historyFilterDate === 'today') {
        const isToday = orderDate.getFullYear() === today.getFullYear() &&
                        orderDate.getMonth() === today.getMonth() &&
                        orderDate.getDate() === today.getDate();
        if (!isToday) return false;
      } else if (historyFilterDate === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = orderDate.getFullYear() === yesterday.getFullYear() &&
                            orderDate.getMonth() === yesterday.getMonth() &&
                            orderDate.getDate() === yesterday.getDate();
        if (!isYesterday) return false;
      } else if (historyFilterDate === 'last7') {
        const diffTime = today.getTime() - orderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (historyFilterDate === 'custom' && historyFilterCustomDate) {
        const [year, month, day] = historyFilterCustomDate.split('-').map(Number);
        const isCustomDate = orderDate.getFullYear() === year &&
                             (orderDate.getMonth() + 1) === month &&
                             orderDate.getDate() === day;
        if (!isCustomDate) return false;
      }
    }

    return true;
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

              {/* Notification Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`relative p-3 rounded-xl border transition-all flex items-center justify-center active:scale-95 ${
                    kitchenAlerts.some((a: any) => !a.read)
                      ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100 shadow-sm shadow-orange-100/50'
                      : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                  }`}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {kitchenAlerts.some((a: any) => !a.read) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-orange-600 border-2 border-white text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-soft">
                      {kitchenAlerts.filter((a: any) => !a.read).length}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-5 z-50 animate-fade-in max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Bell size={14} className="text-orange-500" /> Notifications
                        </h3>
                        {kitchenAlerts.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setKitchenAlerts(prev => prev.map(a => ({ ...a, read: true })));
                              }}
                              className="text-[9px] font-bold text-orange-500 hover:underline uppercase"
                            >
                              Read All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => {
                                setKitchenAlerts([]);
                                setIsNotificationOpen(false);
                              }}
                              className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {kitchenAlerts.length === 0 ? (
                          <div className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            No notifications
                          </div>
                        ) : (
                          kitchenAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              onClick={() => {
                                setKitchenAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
                              }}
                              className={`p-3 rounded-2xl flex flex-col gap-1.5 relative group text-left cursor-pointer border transition-all ${
                                alert.read
                                  ? 'bg-slate-50 border-slate-100 text-slate-400'
                                  : 'bg-orange-50/40 border-orange-100 text-slate-800 hover:bg-orange-50/70'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                <span className="text-[9px] font-bold uppercase tracking-wide">
                                  {alert.type === 'new_order' ? 'New Order' : 'Order Updated'}
                                </span>
                                <span className="text-[8px] text-slate-400 font-bold ml-auto">{formatDate(alert.timestamp)}</span>
                              </div>
                              <div className="text-[10px] font-medium leading-tight pr-4">
                                {alert.message}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKitchenAlerts(prev => prev.filter(a => a.id !== alert.id));
                                }}
                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors p-1"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
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
                                  {order.waiter && ` • Waiter: ${order.waiter}`}
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
                                const isPreparing = item.status === 'preparing';
                                return (
                                  <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${
                                    isItemReady
                                      ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through'
                                      : isPreparing
                                        ? 'bg-orange-50/70 text-orange-700 border-solid border-orange-200 shadow-sm'
                                        : 'bg-slate-50/50 text-slate-700 border-dotted border-slate-200'
                                    }`}>
                                    <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                      {isItemReady ? (
                                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                      ) : isPreparing ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                                      )}
                                      {item.name}
                                    </span>
                                    <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold text-xs brightness-90'}>
                                      x{item.quantity} {isItemReady && '(Ready)'} {isPreparing && '(Already Cooking)'}
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
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                  Cooking • {order.chef || 'Chef'}
                                  {order.waiter && ` • Waiter: ${order.waiter}`}
                                </p>
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
                            
                            <ul className="space-y-2 mb-4">
                              {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                const catName = (it.categoryName || '').toLowerCase();
                                return !catName.includes('beverage') && !catName.includes('drink');
                              }).map((item: any, i: number) => {
                                return (
                                  <li key={i} className="text-xs font-semibold text-slate-500 flex justify-between items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="uppercase tracking-tight truncate flex items-center gap-1.5">
                                      <Check size={12} className="text-emerald-500 flex-shrink-0" />
                                      {item.name}
                                    </span>
                                    <span className="text-slate-400 font-bold">
                                      x{item.quantity}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>

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
                                    {order.waiter && ` • Waiter: ${order.waiter}`}
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
                                  const isPreparing = item.status === 'preparing';
                                  return (
                                    <li key={i} className={`text-sm font-bold flex justify-between items-center px-4 py-2.5 rounded-xl border ${
                                      isItemReady
                                        ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through'
                                        : isPreparing
                                          ? 'bg-orange-50/70 text-orange-700 border-solid border-orange-200 shadow-sm'
                                          : 'bg-slate-50/50 text-slate-700 border-dotted border-slate-200'
                                      }`}>
                                      <span className="uppercase tracking-tight truncate flex items-center gap-2">
                                        {isItemReady ? (
                                          <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                        ) : isPreparing ? (
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                                        )}
                                        {item.name}
                                      </span>
                                      <span className={isItemReady ? 'text-slate-400' : 'text-orange-600 font-bold text-xs brightness-90'}>
                                        x{item.quantity} {isItemReady && '(Ready)'} {isPreparing && '(Already Cooking)'}
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
                                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                    Cooking • {order.chef || 'Chef'}
                                    {order.waiter && ` • Waiter: ${order.waiter}`}
                                  </p>
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

                              <ul className="space-y-2 mb-4">
                                {(Array.isArray(order.items) ? order.items : []).filter((it: any) => {
                                  const catName = (it.categoryName || '').toLowerCase();
                                  return !catName.includes('beverage') && !catName.includes('drink');
                                }).map((item: any, i: number) => {
                                  return (
                                    <li key={i} className="text-xs font-semibold text-slate-500 flex justify-between items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <span className="uppercase tracking-tight truncate flex items-center gap-1.5">
                                        <Check size={12} className="text-emerald-500 flex-shrink-0" />
                                        {item.name}
                                      </span>
                                      <span className="text-slate-400 font-bold">
                                        x{item.quantity}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>

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
              <div className="space-y-8 animate-fade-in flex-1 flex flex-col max-w-6xl mx-auto w-full pt-4">
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

                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Total Orders */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Orders</p>
                      <p className="text-3xl font-black text-slate-800">{stats.totalOrders}</p>
                    </div>

                    {/* Delivered */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Delivered</p>
                      <p className="text-3xl font-black text-green-600">{stats.delivered}</p>
                    </div>

                    {/* Remaining */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Remaining</p>
                      <p className="text-3xl font-black text-orange-500">{stats.remaining}</p>
                    </div>

                    {/* Cancelled */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cancelled</p>
                      <p className="text-3xl font-black text-red-500">{stats.cancelled}</p>
                    </div>
                  </div>
                )}

                {/* Premium Filter Bar */}
                <div className="bg-white/80 border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-wrap gap-6 items-end animate-fade-in">
                  {/* Order ID Filter */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order ID</label>
                    <select
                      value={historyFilterOrderId}
                      onChange={(e) => setHistoryFilterOrderId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
                    >
                      <option value="all">All Order IDs</option>
                      {uniqueOrderIds.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex-1 min-w-[200px] flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                      <select
                        value={historyFilterDate}
                        onChange={(e) => {
                          setHistoryFilterDate(e.target.value);
                          if (e.target.value !== 'custom') {
                            setHistoryFilterCustomDate('');
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last7">Last 7 Days</option>
                        <option value="custom">Select Specific Date...</option>
                      </select>
                    </div>
                    {historyFilterDate === 'custom' && (
                      <div className="flex-1 animate-fade-in">
                        <input
                          type="date"
                          value={historyFilterCustomDate}
                          onChange={(e) => setHistoryFilterCustomDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                    <select
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(historyFilterOrderId !== 'all' || historyFilterDate !== 'all' || historyFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setHistoryFilterOrderId('all');
                        setHistoryFilterDate('all');
                        setHistoryFilterCustomDate('');
                        setHistoryFilter('all');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all active:scale-95"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* History Table */}
                {historyLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-violet-500" />
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <th className="py-5 px-8">Order ID</th>
                            <th className="py-5 px-6">Table</th>
                            <th className="py-5 px-6">Date & Time</th>
                            <th className="py-5 px-6">Items Served</th>
                            <th className="py-5 px-6 text-right">Amount</th>
                            <th className="py-5 px-8 text-center">Status</th>
                            <th className="py-5 px-6 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredHistory.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                No orders found matching the filter criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredHistory.map((order) => (
                              <tr key={order.orderId || order.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-5 px-8 font-black text-sm text-slate-800">{order.orderId || order.id}</td>
                                <td className="py-5 px-6">
                                  <span className="font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600">
                                    {order.tableNumber ? `Table ${order.tableNumber}` : order.type}
                                  </span>
                                </td>
                                <td className="py-5 px-6 text-xs font-semibold text-slate-500">
                                  {new Date(order.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td className="py-5 px-6">
                                  <div className="max-w-[250px] space-y-0.5 max-h-[60px] overflow-y-auto pr-1">
                                    {(Array.isArray(order.items) ? order.items : []).map((it: any, i: number) => (
                                      <div key={i} className="text-xs text-slate-600 font-medium">
                                        <span className="font-bold text-orange-500">{it.quantity}x</span> {it.name}
                                      </div>
                                    ))}
                                    {getCleanInstructions(order.instructions) && (
                                      <div className="text-[10px] text-amber-600 font-bold italic mt-1.5">
                                        Note: "{getCleanInstructions(order.instructions)}"
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-5 px-6 text-right font-black text-slate-800 text-sm">Rs. {order.total?.toFixed(0)}</td>
                                <td className="py-5 px-8 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                      order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                      order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                      order.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      'bg-orange-50 text-orange-500 border-orange-100'
                                    }`}>
                                      {order.status}
                                    </span>
                                    {order.status === 'Cancelled' && (
                                      (() => {
                                        const reason = getCancelReasonFromInstructions(order.instructions);
                                        return reason ? (
                                          <span className="text-[9px] font-semibold text-red-500 max-w-[150px] truncate leading-tight">
                                            Reason: {reason}
                                          </span>
                                        ) : null;
                                      })()
                                    )}
                                  </div>
                                </td>
                                <td className="py-5 px-6 text-center">
                                  <button
                                    onClick={() => setSelectedHistoryOrder(order)}
                                    className="p-2 bg-slate-100 hover:bg-violet-100 text-slate-500 hover:text-violet-600 rounded-xl transition-all"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {selectedHistoryOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in text-left">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedHistoryOrder(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white relative">
              <button
                onClick={() => setSelectedHistoryOrder(null)}
                className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <X size={18} />
              </button>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest leading-none mb-2">Order Information</p>
              <h3 className="text-2xl font-black tracking-tight">{selectedHistoryOrder.orderId || selectedHistoryOrder.id}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/20 bg-white/10`}>
                  {selectedHistoryOrder.status}
                </span>
                <span className="text-xs font-semibold text-violet-100 flex items-center gap-1.5">
                  <History size={12} />
                  {new Date(selectedHistoryOrder.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 scrollbar-custom text-left">
              {/* Order Meta Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Customer Details</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedHistoryOrder.customerName || 'Walk-in Guest'}</p>
                  <p className="text-slate-500 font-medium mt-0.5">{selectedHistoryOrder.phone !== 'N/A' ? selectedHistoryOrder.phone : 'No Phone Number'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Service Details</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedHistoryOrder.tableNumber ? `Table ${selectedHistoryOrder.tableNumber}` : 'Takeaway / Drive-Thru'}
                  </p>
                  <p className="text-slate-500 font-medium mt-0.5">
                    Type: <span className="capitalize">{selectedHistoryOrder.type || 'Dining'}</span>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Kitchen Staff</p>
                  <p className="font-bold text-slate-700">{selectedHistoryOrder.chef || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Waiter</p>
                  <p className="font-bold text-slate-700">{selectedHistoryOrder.waiter || 'Not Assigned'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-3">Items Ordered</p>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(Array.isArray(selectedHistoryOrder.items) ? selectedHistoryOrder.items : []).map((it: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">{it.name}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">x{it.quantity}</td>
                          <td className="py-3 px-4 text-right text-slate-600">Rs. {it.price?.toFixed(0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">Rs. {(it.price * it.quantity)?.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedHistoryOrder.instructions && (
                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-left">
                  <p className="font-bold text-amber-600 uppercase tracking-widest text-[9px] mb-1">Notes & Instructions</p>
                  <p className="text-slate-600 italic font-medium">"{getCleanInstructions(selectedHistoryOrder.instructions)}"</p>
                  {getCancelReasonFromInstructions(selectedHistoryOrder.instructions) && (
                    <div className="mt-2 text-red-600 font-bold">
                      Rejection Reason: "{getCancelReasonFromInstructions(selectedHistoryOrder.instructions)}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Grand Total</p>
                <p className="text-2xl font-black text-slate-800">Rs. {selectedHistoryOrder.total?.toFixed(0)}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryOrder(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
