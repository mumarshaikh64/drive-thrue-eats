'use client';
import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Filter, X, Trash2, Edit2, CheckCircle, Clock, Eye, Info, Calendar, Plus, Minus, Utensils, AlertTriangle, Bell } from 'lucide-react';
import { resolveMenuImage } from '@/lib/image-helper';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // New states for placing order from admin panel
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [notifiedCancelledOrders, setNotifiedCancelledOrders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dte_notified_cancelled_orders');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [cancellationAlerts, setCancellationAlerts] = useState<{orderId: string, tableNumber: string | null, reason: string}[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dte_cancellation_alerts');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dte_cancellation_alerts', JSON.stringify(cancellationAlerts));
      } catch (e) {
        console.error(e);
      }
    }
  }, [cancellationAlerts]);

  // Form states for new order
  const [newOrderCustomerName, setNewOrderCustomerName] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderType, setNewOrderType] = useState<'dining' | 'pickup' | 'delivery'>('dining');
  const [newOrderTable, setNewOrderTable] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderInstructions, setNewOrderInstructions] = useState('');
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState<'cash' | 'online' | 'credit'>('cash');
  const [newOrderCreditName, setNewOrderCreditName] = useState('');
  const [newOrderCreditCompany, setNewOrderCreditCompany] = useState('');
  const [newOrderCreditPhone, setNewOrderCreditPhone] = useState('');

  const fetchOrders = () => {
    // Audio Notification Sound (Royalty Free Bell)
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const latestId = data[0].id;
            if (lastOrderId && latestId !== lastOrderId) {
              notificationSound.play().catch(e => console.log('Audio play blocked:', e));
            }
            setLastOrderId(latestId);
          }
          setOrders(data);

          // Check for newly chef-cancelled orders
          data.filter((o: any) => o.status === 'Cancelled' && o.instructions?.startsWith('[CANCELLED_BY_CHEF:')).forEach((order: any) => {
            const uniqueId = order.orderId || order.id;
            setNotifiedCancelledOrders(prevNotified => {
              if (!prevNotified.includes(uniqueId)) {
                let reason = 'Out of Stock';
                const inst = order.instructions || '';
                const idx = inst.indexOf(']');
                if (idx > -1) {
                  reason = inst.substring('[CANCELLED_BY_CHEF:'.length, idx).trim();
                }

                // Add to cancellationAlerts with duplicate checking
                setCancellationAlerts(prevAlerts => {
                  if (prevAlerts.some(a => a.orderId === uniqueId)) {
                    return prevAlerts;
                  }
                  return [
                    ...prevAlerts,
                    { orderId: uniqueId, tableNumber: order.tableNumber, reason }
                  ];
                });

                // Play notification bell audio
                notificationSound.play().catch(e => console.log('Audio blocked:', e));

                const next = [...prevNotified, uniqueId];
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem('dte_notified_cancelled_orders', JSON.stringify(next));
                  } catch (e) {
                    console.error(e);
                  }
                }
                return next;
              }
              return prevNotified;
            });
          });
        }
      })
      .catch(err => console.error("Fetch failed", err));
  };

  const fetchMenuAndTables = async () => {
    try {
      const mRes = await fetch('/api/menu');
      const mData = await mRes.json();
      if (Array.isArray(mData)) setMenuCategories(mData);

      const tRes = await fetch('/api/tables');
      const tData = await tRes.json();
      if (Array.isArray(tData)) setTables(tData);
    } catch (e) {
      console.error("Failed to load menu or tables", e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastOrderId]);

  useEffect(() => {
    if (isOrderModalOpen) {
      fetchMenuAndTables();
    }
  }, [isOrderModalOpen]);

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(o => {
    const matchesSearch = (o.orderId || o.id || "").toLowerCase().includes(search.toLowerCase()) ||
                         (o.customerName || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesType = typeFilter === 'All' || o.type === typeFilter;
    
    let matchesDate = true;
    const orderDate = new Date(o.timestamp);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of the day
      if (orderDate < start) matchesDate = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      if (orderDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const updateStatus = (orderId: string, newStatus: string) => {
    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, updates: { status: newStatus } })
    }).then(() => fetchOrders());
  };

  const cancelOrder = (orderId: string) => {
    if (!confirm('Are you sure you want to delete/cancel this order permanently?')) return;
    fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId })
    }).then(() => fetchOrders());
  };

  const shareOrderViaWhatsApp = (order: any) => {
    if (!order) return;
    const defaultPhone = order.phone && order.phone !== 'N/A' ? order.phone : '';
    const phoneInput = prompt("Enter Customer WhatsApp Phone Number (with Country Code, e.g. 923001234567 or 919876543210):", defaultPhone);
    if (phoneInput === null) return; // User cancelled

    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone) {
      alert("Invalid phone number. Please enter a numeric phone number with country code.");
      return;
    }

    const dateStr = new Date(order.timestamp).toLocaleString();
    const tableNum = order.tableNumber || 'N/A';
    const waiterName = order.waiter || 'Staff';
    const orderId = order.orderId || order.id;

    const totalBill = order.total;
    const shareUrl = `${window.location.origin}/receipt/${orderId}`;

    const message = `*DRIVE THRU EATS* 🍔🔥\n*Burger Arena - Premium Flavors*\n---------------------------------------\nYour premium visual bill is ready! Click the link below to view, print, or download your receipt:\n\n👉 ${shareUrl}\n\n*Bill Summary:*\n• *Order ID:* #${orderId}\n• *Type:* ${order.type.toUpperCase()}${tableNum !== 'N/A' ? ` (Table ${tableNum})` : ''}\n• *Waiter:* ${waiterName}\n• *Date:* ${dateStr}\n• *Total Bill Amount:* *₹${totalBill}*\n---------------------------------------\nThank you for dining with us! ❤️`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Cart operations
  const handleAddToCart = (item: any) => {
    const exists = cart.find(c => c.id === item.id);
    if (exists) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add at least one item to the cart.");
      return;
    }

    if (newOrderType === 'dining' && !newOrderTable) {
      alert("Please select a table number.");
      return;
    }

    if (newOrderType === 'delivery' && !newOrderAddress) {
      alert("Please enter a delivery address.");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData: any = {
        customerName: newOrderCustomerName || (newOrderType === 'dining' ? `Table ${newOrderTable} Guest` : 'Admin Guest'),
        phone: newOrderPhone || 'N/A',
        type: newOrderType,
        tableNumber: newOrderType === 'dining' ? String(newOrderTable) : null,
        address: newOrderType === 'delivery' ? newOrderAddress : null,
        instructions: newOrderInstructions || null,
        items: cart.map(it => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          categoryName: it.categoryName,
          status: 'pending'
        })),
        total: cart.reduce((sum, it) => sum + (it.price * it.quantity), 0),
        paymentMethod: newOrderPaymentMethod === 'credit' ? 'Credit' : newOrderPaymentMethod === 'online' ? 'Online' : 'Cash',
        payment_type: newOrderPaymentMethod,
        status: 'Pending',
        waiter: 'Admin',
        ...(newOrderPaymentMethod === 'credit' && {
          credit_customer_name: newOrderCreditName,
          credit_company_name: newOrderCreditCompany,
          credit_phone: newOrderCreditPhone,
          credit_status: 'pending',
        })
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Order placed successfully!");
        setIsOrderModalOpen(false);
        // Reset states
        setCart([]);
        setNewOrderCustomerName('');
        setNewOrderPhone('');
        setNewOrderTable('');
        setNewOrderAddress('');
        setNewOrderInstructions('');
        setNewOrderPaymentMethod('cash');
        setNewOrderCreditName('');
        setNewOrderCreditCompany('');
        setNewOrderCreditPhone('');
        fetchOrders();
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong placing the order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Advanced Orders</h1>
          <p className="text-[#6c757d] font-medium mt-1">Manage, filter, and modify live restaurant orders.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Chef Cancellation Notification Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center active:scale-95 ${
                cancellationAlerts.length > 0 
                  ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100 shadow-sm shadow-red-100/50 animate-pulse' 
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
              }`}
              title="Chef Rejection Notifications"
            >
              <Bell size={18} />
              {cancellationAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 border-2 border-white text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-soft">
                  {cancellationAlerts.length}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-5 z-50 animate-fade-in max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-500" /> Chef Rejections
                    </h3>
                    {cancellationAlerts.length > 0 && (
                      <button
                        onClick={() => {
                          setCancellationAlerts([]);
                          setIsNotificationOpen(false);
                        }}
                        className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {cancellationAlerts.length === 0 ? (
                      <div className="py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        No cancellation notifications
                      </div>
                    ) : (
                      cancellationAlerts.map((alert, idx) => (
                        <div key={idx} className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl flex flex-col gap-2 relative group text-left">
                          <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                            Order {alert.orderId} {alert.tableNumber ? `(Table ${alert.tableNumber})` : ''}
                          </div>
                          <div className="text-[10px] font-medium text-red-600 leading-tight">
                            Cancelled by Chef: "{alert.reason}"
                          </div>
                          <button
                            onClick={() => {
                              setCancellationAlerts(prev => prev.filter((_, i) => i !== idx));
                              if (cancellationAlerts.length <= 1) setIsNotificationOpen(false);
                            }}
                            className="absolute top-3 right-3 text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Place Order Button */}
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-[#c52c31] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Place New Order</span>
          </button>

          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none w-full sm:w-48"
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <button 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Calendar size={16} className={startDate || endDate ? "text-brand-red" : "text-gray-400"} />
              <span>{(startDate || endDate) ? 'Date Filtered' : 'Filter by Date'}</span>
            </button>
            
            {isDateDropdownOpen && (
              <>
                <div 
                   className="fixed inset-0 z-40" 
                   onClick={() => setIsDateDropdownOpen(false)} 
                />
                <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Date Range</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">From Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">To Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red"
                      />
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    {(startDate || endDate) ? (
                      <button 
                        onClick={() => { setStartDate(''); setEndDate(''); setIsDateDropdownOpen(false); }}
                        className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors"
                      >
                        Clear Range
                      </button>
                    ) : <div></div>}
                    <button 
                      onClick={() => setIsDateDropdownOpen(false)}
                      className="text-xs bg-brand-text hover:bg-brand-red text-white font-bold px-5 py-2 rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>
          
          {/* Status & Types */}
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none flex-grow sm:flex-grow-0"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Delivered">Delivered</option>
          </select>
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none flex-grow sm:flex-grow-0"
          >
            <option value="All">All Types</option>
            <option value="dining">Dining</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <th className="p-6">Order</th>
                <th className="p-6">Customer</th>
                <th className="p-6">Items</th>
                <th className="p-6 text-center">Summary</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">
                    No orders matching your filters.
                  </td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 align-top">
                    <p className="font-bold text-gray-900">{order.orderId}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                      {new Date(order.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.type === 'dining' ? 'bg-orange-100 text-orange-600' :
                      order.type === 'delivery' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {order.type} {order.tableNumber ? `#${order.tableNumber}` : ''}
                    </div>
                  </td>
                  <td className="p-6 align-top">
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-xs font-semibold text-gray-400">{order.phone}</p>
                    {order.email && <p className="text-[10px] text-gray-400">{order.email}</p>}
                    {order.address && <p className="text-[10px] text-gray-500 mt-2 max-w-[150px] line-clamp-2">{order.address}</p>}
                  </td>
                  <td className="p-6 align-top">
                    <div className="space-y-1">
                      {(Array.isArray(order.items) ? order.items : []).map((it: any, i: number) => (
                        <div key={i} className="text-xs font-bold text-gray-600 flex justify-between gap-4">
                          <span>{it.quantity}x {it.name}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 align-top text-center">
                    <p className="text-xl font-bold text-brand-red">₹{order.total}</p>
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm ${
                        order.status === 'Pending' ? 'bg-red-50 text-red-600 border border-red-100' :
                        order.status === 'Preparing' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        order.status === 'Ready' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                        'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 align-top text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2.5 rounded-xl transition-all text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="View Full Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => cancelOrder(order.orderId)}
                        disabled={order.status !== 'Pending'}
                        className={`p-2.5 rounded-xl transition-all ${
                          order.status === 'Pending' 
                            ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' 
                            : 'text-gray-100 cursor-not-allowed opacity-30'
                        }`}
                        title={order.status === 'Pending' ? "Cancel/Delete Order" : "Cannot cancel once preparation starts"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      
      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-premium relative my-auto">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Info className="text-brand-red" /> Order Details
                </h2>
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">ID: {selectedOrder.orderId}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time</p>
                  <p className="font-bold text-sm text-gray-900">{new Date(selectedOrder.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}</p>
                  <p className="text-[10px] font-medium text-gray-500">{new Date(selectedOrder.timestamp).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      selectedOrder.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                      selectedOrder.status === 'Preparing' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                  <p className="font-bold text-sm text-gray-900 capitalize">{selectedOrder.paymentMethod || 'Cash'}</p>
                  <p className="text-[10px] font-medium text-gray-500 min-h-[14px] truncate">{selectedOrder.transactionNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="font-bold text-sm text-brand-red uppercase">{selectedOrder.type}</p>
                  {selectedOrder.tableNumber && <p className="text-[10px] font-bold text-gray-500">Table: {selectedOrder.tableNumber}</p>}
                </div>
              </div>

              {/* Customer & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Customer Info</h3>
                  <p className="font-bold text-gray-700">{selectedOrder.customerName}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.phone}</p>
                  {selectedOrder.email && <p className="text-xs text-gray-500">{selectedOrder.email}</p>}
                  {selectedOrder.address && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery Address</p>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">{selectedOrder.address} {selectedOrder.deliveryArea ? `(${selectedOrder.deliveryArea})` : ''}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Staff Assigned</h3>
                   <div className="space-y-2">
                     <p className="text-sm">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12 inline-block">Waiter:</span> 
                       <span className="font-bold text-gray-700">{selectedOrder.waiter || 'Unassigned'}</span>
                     </p>
                   </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Order Items</h3>
                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-brand-red text-xs">
                          {it.quantity}x
                        </div>
                        <span className="font-bold text-sm text-gray-700">{it.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">₹{parseFloat(it.price) * parseInt(it.quantity)}</span>
                    </div>
                  ))}
                  {selectedOrder.instructions && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mb-1">Cooking Instructions</p>
                      <p className="text-sm text-red-900 italic">&quot;{selectedOrder.instructions}&quot;</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                   <span className="text-lg font-bold text-gray-900 uppercase tracking-tight">Total Bill</span>
                   <span className="text-2xl font-black text-brand-red">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex justify-between items-center">
              <button
                type="button"
                onClick={() => shareOrderViaWhatsApp(selectedOrder)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 text-xs uppercase tracking-wider"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                Share via WhatsApp
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-8 text-sm font-bold rounded-xl transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Place Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] shadow-premium relative flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-6 flex-shrink-0">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <Utensils className="text-brand-red" /> Place New Order (Admin)
                </h2>
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Create an order on behalf of a guest</span>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)} 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Two Columns */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Column: Menu Items & Search */}
              <div className="w-full lg:w-3/5 p-6 border-r border-gray-100 flex flex-col overflow-hidden">
                <div className="mb-4 relative flex-shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                {/* Categorized list of items */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-custom">
                  {menuCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold">
                      <Clock className="animate-spin mb-3 text-brand-red" size={32} />
                      <span>Loading menu items...</span>
                    </div>
                  ) : (
                    menuCategories.map((cat: any) => {
                      const filteredItems = (cat.items || []).filter((it: any) =>
                        it.name.toLowerCase().includes(menuSearch.toLowerCase())
                      );
                      if (filteredItems.length === 0) return null;

                      return (
                        <div key={cat.id} className="space-y-3">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span>{cat.name}</span>
                            <span className="h-px bg-gray-100 flex-1"></span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredItems.map((it: any) => (
                              <div 
                                key={it.id} 
                                className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 relative shadow-inner">
                                    <img 
                                      src={resolveMenuImage(it.image)} 
                                      alt={it.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-800 uppercase line-clamp-1">{it.name}</h4>
                                    <p className="text-xs font-bold text-brand-red mt-0.5">₹{it.price}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(it)}
                                  className="w-8 h-8 rounded-xl bg-white text-gray-400 hover:bg-brand-red hover:text-white hover:rotate-90 shadow-sm transition-all flex items-center justify-center flex-shrink-0"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Order Form & Cart */}
              <form onSubmit={handlePlaceOrderSubmit} className="w-full lg:w-2/5 p-6 bg-gray-50 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-custom">
                  {/* Order Type Toggle */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Order Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['dining', 'pickup', 'delivery'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewOrderType(type)}
                          className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all border ${
                            newOrderType === type 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields based on Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Customer Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newOrderCustomerName}
                        onChange={e => setNewOrderCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 03001234567"
                        maxLength={11}
                        value={newOrderPhone}
                        onChange={e => setNewOrderPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                      />
                    </div>
                  </div>

                  {newOrderType === 'dining' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Table Number *</label>
                      <select
                        value={newOrderTable}
                        onChange={e => setNewOrderTable(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none font-bold"
                      >
                        <option value="">Select Table...</option>
                        {tables.map((t: any) => (
                          <option key={t.id} value={t.number}>Table {t.number} ({t.seats} Seats - {t.status})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newOrderType === 'delivery' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Delivery Address *</label>
                      <textarea
                        rows={2}
                        placeholder="Enter full address details..."
                        value={newOrderAddress}
                        onChange={e => setNewOrderAddress(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                      />
                    </div>
                  )}

                  {/* Payment Method Toggle */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Payment Method *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'online', 'credit'] as const).map(pm => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setNewOrderPaymentMethod(pm)}
                          className={`py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all border ${
                            newOrderPaymentMethod === pm 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newOrderPaymentMethod === 'credit' && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Credit Account Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Credit User Name *"
                          value={newOrderCreditName}
                          onChange={e => setNewOrderCreditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={newOrderCreditCompany}
                          onChange={e => setNewOrderCreditCompany(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Credit Phone Number *"
                        maxLength={11}
                        value={newOrderCreditPhone}
                        onChange={e => setNewOrderCreditPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Cooking / Order Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Extra spicy, no onions"
                      value={newOrderInstructions}
                      onChange={e => setNewOrderInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none"
                    />
                  </div>

                  {/* Cart Section */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Order Items ({cart.reduce((sum, c) => sum + c.quantity, 0)})</span>
                      {cart.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => setCart([])} 
                          className="text-red-500 font-bold hover:underline capitalize"
                        >
                          Clear all
                        </button>
                      )}
                    </h4>

                    {cart.length === 0 ? (
                      <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-400 font-bold text-xs uppercase tracking-wider">
                        Cart is empty
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div 
                            key={item.id} 
                            className="bg-white p-3 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-gray-800 uppercase truncate">{item.name}</h5>
                              <p className="text-[10px] font-bold text-brand-red mt-0.5">₹{item.price * item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-brand-red"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold w-5 text-center text-gray-800">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-brand-red"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtotal & Action */}
                <div className="border-t border-gray-200/80 pt-4 mt-4 bg-transparent flex-shrink-0 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-brand-red">
                      ₹{cart.reduce((sum, it) => sum + (it.price * it.quantity), 0)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={placingOrder || cart.length === 0}
                    className="w-full py-4 bg-brand-red hover:bg-[#c52c31] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-brand-red/20 transition-all flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <Clock className="animate-spin" size={16} />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Submit & Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
