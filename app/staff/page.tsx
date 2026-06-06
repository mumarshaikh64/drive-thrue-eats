'use client';
import { useState, useEffect } from 'react';
import { 
  User, Lock, ShoppingBag, CheckCircle, Clock, IndianRupee, 
  LogOut, ChevronRight, Utensils, LayoutGrid, ChefHat, Plus,
  Search, ClipboardList, Wallet, Check
} from 'lucide-react';
import { resolveMenuImage } from '@/lib/image-helper';


type View = 'dashboard' | 'pos' | 'tables' | 'kitchen';

export default function StaffPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffData, setStaffData] = useState<any>(null);
  const [sid, setSid] = useState('');
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<View>('dashboard');
  const [categories, setCategories] = useState<any[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  
  // POS State
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [posOrderType, setPosOrderType] = useState('dining');
  const [posTable, setPosTable] = useState('');
  const [posPayment, setPosPayment] = useState('cash');
  const [kitchenTab, setKitchenTab] = useState<'Pending' | 'Preparing' | 'Ready'>('Pending');

  useEffect(() => {
    const saved = localStorage.getItem('dte_staff_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStaffData(parsed);
      setIsLoggedIn(true);
      if (parsed.role === 'Kitchen Staff') setActiveTab('kitchen');
    }

    const loadCoreData = async () => {
      try {
        const [menuRes, tablesRes, resRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/tables'),
          fetch('/api/reservations')
        ]);

        const [menuData, tablesData, resData] = await Promise.all([
          menuRes.json(),
          tablesRes.json(),
          resRes.json()
        ]);

        if (Array.isArray(menuData)) {
          setCategories(menuData);
          setAllMenuItems(menuData.flatMap(cat => cat.items || []));
        }
        if (Array.isArray(tablesData)) setTables(tablesData);
        if (Array.isArray(resData)) setReservations(resData);
      } catch (err) {
        console.error("Core data fetch failed:", err);
      }
    };
    
    loadCoreData();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      // Poll faster but only for active orders (thanks to API optimization)
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const [oRes, rRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/reservations')
      ]);
      const oData = await oRes.json();
      const rData = await rRes.json();
      
      if (Array.isArray(oData)) setOrders(oData);
      if (Array.isArray(rData)) setReservations(rData);
    } catch (err) {
      console.error(err);
    }
  };

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
        setStaffData(data.staff);
        setIsLoggedIn(true);
        localStorage.setItem('dte_staff_session', JSON.stringify(data.staff));
        if (data.staff.role.toLowerCase().includes('kitchen') || 
            data.staff.role.toLowerCase().includes('chef') ||
            data.staff.role.toLowerCase().includes('cook')) {
          setActiveTab('kitchen');
        }
      } else {
        alert('Invalid ID or PIN');
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          updates: { 
            status: newStatus,
            chef: staffData.role === 'Kitchen Staff' ? staffData.name : undefined,
            waiter: staffData.role === 'Waiter' ? staffData.name : undefined
          } 
        })
      });
      fetchOrders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handlePOSOrder = async () => {
    if (cart.length === 0) return;
    if (posOrderType === 'dining' && !posTable) return alert("Please select a Table Number!");

    setLoading(true);
    const orderData = {
      id: 'STAFF-' + Date.now(),
      customerName: 'DINE-IN GUEST',
      phone: 'N/A',
      type: posOrderType,
      tableNumber: posTable,
      items: cart, // API will JSON.stringify
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      paymentMethod: posPayment,
      status: 'Pending',
      waiter: staffData.name
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Order Placed Successfully!');
        setCart([]);
        setPosTable('');
        setActiveTab('dashboard');
        fetchOrders();
      } else {
        alert('Order Failed: ' + (data.detail || data.error || 'Server Error'));
      }
    } catch (err) {
      alert('Network Error: Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dte_staff_session');
    setStaffData(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-4xl shadow-premium overflow-hidden border-white">
          <div className="bg-brand-red p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h1 className="text-3xl font-bold text-white tracking-tighter">Portal Login</h1>
            <p className="text-red-100 text-xs mt-1 font-bold uppercase tracking-widest">Identify Yourself</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">Staff ID Code</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                <input 
                  required 
                  type="text" 
                  value={sid}
                  onChange={e => setSid(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm uppercase tracking-wider"
                  placeholder="E.G. ST-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">Secure Entry PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                <input 
                  required 
                  type="password" 
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-lg tracking-[0.8em]"
                  placeholder="****"
                  maxLength={4}
                />
              </div>
            </div>
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all shadow-premium active:scale-[0.98] mt-4"
            >
              {loading ? 'AUTHENTICATING...' : 'GAIN ACCESS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter(o => 
    (staffData.role === 'Kitchen Staff' && (o.status === 'Pending' || o.status === 'Preparing')) ||
    (staffData.role === 'Waiter' && o.waiter === staffData.name) ||
    (staffData.role === 'Manager')
  );

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar Nav */}
      <aside className="w-24 md:w-64 bg-brand-text text-white flex flex-col p-4 border-r border-brand-border h-screen sticky top-0">
        <div className="mb-12 text-center md:text-left px-2">
          <img src="https://drive-thrueats.online/logo.png" alt="Logo" className="h-8 w-auto mx-auto md:mx-0 invert" />
        </div>

        <nav className="flex-1 space-y-3">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === 'dashboard' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <ClipboardList size={20} className={activeTab === 'dashboard' ? 'animate-bounce-soft' : ''} />
            <span className="hidden md:block font-bold text-xs uppercase tracking-widest">Worklog</span>
            {activeTab === 'dashboard' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
          </button>

          {(staffData.role === 'Manager' || staffData.role === 'Waiter') && (
            <>
              <button 
                onClick={() => setActiveTab('pos')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === 'pos' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Plus size={20} className={activeTab === 'pos' ? 'rotate-90 transition-transform' : ''} />
                <span className="hidden md:block font-bold text-xs uppercase tracking-widest">New Order</span>
                {activeTab === 'pos' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('tables')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === 'tables' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <LayoutGrid size={20} />
                <span className="hidden md:block font-bold text-xs uppercase tracking-widest">Floor Map</span>
                {activeTab === 'tables' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
              </button>
            </>
          )}

          {(staffData.role === 'Manager' || staffData.role === 'Kitchen Staff') && (
            <button 
              onClick={() => setActiveTab('kitchen')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === 'kitchen' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <ChefHat size={20} />
              <span className="hidden md:block font-bold text-xs uppercase tracking-widest">KDS / Kitchen</span>
              {activeTab === 'kitchen' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
            </button>
          )}
        </nav>

        <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all mb-4">
          <LogOut size={20} />
          <span className="hidden md:block font-bold text-xs uppercase tracking-widest">Logout</span>
        </button>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-brand-text tracking-tighter uppercase">My Dashboard</h1>
                <p className="text-brand-muted font-bold text-xs tracking-widest uppercase mt-1">{staffData.role} • {staffData.name}</p>
              </div>
              {staffData.role === 'Manager' && (
                <a href="/admin" className="btn-secondary group">
                  ADMIN PANEL <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              )}
            </div>

            {/* Orders Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-brand-border flex flex-col justify-between gap-6 hover:shadow-2xl hover:shadow-brand-red/5 hover:-translate-y-1 transition-all group relative overflow-hidden">
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    order.status === 'Ready' ? 'bg-emerald-500' : 
                    order.status === 'Preparing' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center font-bold text-brand-red shadow-inner">
                        {order.orderId.slice(-3)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-text tracking-tight">Order {order.orderId}</h3>
                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">{order.customerName}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-xl ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 
                      order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="py-4 border-y border-dashed border-brand-border/60">
                    <div className="flex justify-between items-center text-xs font-bold text-brand-muted uppercase tracking-widest">
                      <span>Type</span>
                      <span className="text-brand-text">{order.type}</span>
                    </div>
                    {order.tableNumber && (
                      <div className="flex justify-between items-center text-xs font-bold text-brand-muted uppercase tracking-widest mt-2">
                        <span>Table</span>
                        <span className="text-brand-red">T-{order.tableNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-1">Total Due</p>
                      <p className="text-2xl font-bold text-brand-text tracking-tighter leading-none">₹{order.total}</p>
                    </div>
                    
                    {order.status === 'Ready' && (
                      <button 
                        onClick={() => updateOrderStatus(order.orderId, 'Delivered')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                      >
                        <CheckCircle size={14} /> Deliver
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {myOrders.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-brand-border border-dashed">
                  <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ClipboardList size={32} className="text-brand-border" />
                  </div>
                  <p className="text-brand-muted font-bold text-sm uppercase tracking-[0.3em]">No tasks assigned to you</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Menu Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-brand-text tracking-tight uppercase">Order Terminal</h2>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em] mt-1">Efficient Service Engine</p>
                </div>
                <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-red transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search dishes..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-white border border-brand-border rounded-2xl pl-11 pr-4 py-4 text-sm font-bold w-full md:w-80 shadow-sm focus:shadow-xl focus:shadow-brand-red/5 focus:border-brand-red transition-all outline-none" 
                  />
                </div>
              </div>

              {/* Category Quick Filters */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <button 
                  onClick={() => setSearchQuery('')}
                  className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${searchQuery === '' ? 'bg-brand-text text-white border-brand-text shadow-lg' : 'bg-white text-brand-muted border-brand-border hover:border-brand-red hover:text-brand-red'}`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSearchQuery(cat.name)}
                    className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${searchQuery === cat.name ? 'bg-brand-text text-white border-brand-text shadow-lg' : 'bg-white text-brand-muted border-brand-border hover:border-brand-red hover:text-brand-red'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {allMenuItems.filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).map(item => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      const exists = cart.find(c => c.id === item.id);
                      if (exists) {
                        setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
                      } else {
                        setCart([...cart, {...item, quantity: 1}]);
                      }
                    }}
                    className="bg-white p-3 md:p-5 rounded-[2rem] border border-brand-border text-left hover:border-brand-red hover:shadow-2xl hover:shadow-brand-red/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    <div className="aspect-[4/3] rounded-3xl bg-brand-bg overflow-hidden mb-4 relative">
                      <img src={resolveMenuImage(item.image)} alt={item.name || "Menu item"} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="px-1">
                      <p className="font-bold text-[11px] md:text-xs text-brand-text uppercase leading-tight line-clamp-1 mb-1">{item.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-brand-red text-sm">₹{item.price}</p>
                        <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart & Checkout */}
            <div className="glass p-8 rounded-4xl border-white h-fit sticky top-10 space-y-6">
              <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 uppercase">
                <ShoppingBag /> Current Order
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-brand-border">
                    <div>
                      <p className="font-bold text-xs uppercase">{item.name}</p>
                      <p className="text-xs font-bold text-brand-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-brand-red">₹{item.price * item.quantity}</p>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center py-10 text-brand-muted font-bold text-xs uppercase">Cart is Empty</p>}
              </div>

              <div className="pt-6 border-t border-brand-border space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-brand-bg p-4 rounded-2xl">
                    <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Table #</label>
                    <input 
                      type="text" 
                      value={posTable}
                      onChange={e => setPosTable(e.target.value)}
                      placeholder="E.G. 12"
                      className="w-full bg-transparent outline-none font-bold"
                    />
                  </div>
                  <select 
                    value={posPayment}
                    onChange={e => setPosPayment(e.target.value)}
                    className="bg-brand-bg p-4 rounded-2xl font-bold text-[10px] uppercase outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                
                <div className="flex justify-between items-center px-2">
                  <div>
                    <span className="font-bold text-[10px] uppercase text-brand-muted block mb-1">Total Bill</span>
                    <span className="text-3xl font-bold text-brand-text tracking-tighter leading-none">₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-red">
                    <Wallet size={24} />
                  </div>
                </div>

                <button 
                  onClick={handlePOSOrder}
                  disabled={loading || cart.length === 0}
                  className="w-full btn-primary py-5 uppercase tracking-[0.2em] shadow-premium disabled:opacity-50"
                >
                  Confirm & Place Order
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-10">
            <h1 className="text-4xl font-bold text-brand-text tracking-tighter uppercase">Table Occupancy</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tables.map(table => {
                const isOccupied = orders.some(o => o.type === 'dining' && o.tableNumber == table.number && o.status !== 'Delivered') ||
                                  reservations.some(r => {
                                    if (r.tableId !== table.id) return false;
                                    const now = new Date();
                                    const resTime = new Date(`${r.date}T${r.time}`);
                                    const end = new Date(resTime.getTime() + 2 * 60 * 60 * 1000);
                                    return now >= resTime && now < end;
                                  });

                return (
                  <div key={table.id} className={`glass p-8 rounded-4xl border-white text-center hover:shadow-premium transition-all border-2 ${isOccupied ? 'border-brand-red bg-red-50/50' : 'border-transparent'}`}>
                    <Utensils size={32} className={`mx-auto mb-4 ${isOccupied ? 'text-brand-red' : 'text-green-500'}`} />
                    <p className="font-bold text-xl text-brand-text uppercase tracking-tight">T-{table.number}</p>
                    {isOccupied ? (
                      <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Occupied</span>
                    ) : (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Free</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'kitchen' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-brand-text tracking-tighter uppercase">Kitchen Queue</h1>
                <div className="flex items-center gap-2 bg-brand-red/10 px-4 py-2 rounded-xl text-brand-red animate-pulse mt-2">
                  <div className="w-2 h-2 rounded-full bg-brand-red" />
                  <span className="text-xs font-bold uppercase tracking-widest">Live Updates</span>
                </div>
              </div>

              {/* Kitchen Toggle Buttons - Visible only on mobile/tablet */}
              <div className="flex md:hidden bg-brand-bg p-1.5 rounded-[2rem] border border-brand-border shadow-inner w-full md:w-auto">
                <button 
                  onClick={() => setKitchenTab('Pending')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Pending' ? 'bg-brand-red text-white shadow-lg' : 'text-brand-muted hover:text-brand-text'}`}
                >
                  Incoming ({orders.filter(o => o.status === 'Pending').length})
                </button>
                <button 
                  onClick={() => setKitchenTab('Preparing')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Preparing' ? 'bg-blue-500 text-white shadow-lg' : 'text-brand-muted hover:text-brand-text'}`}
                >
                  Preparing ({orders.filter(o => o.status === 'Preparing').length})
                </button>
                <button 
                  onClick={() => setKitchenTab('Ready')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${kitchenTab === 'Ready' ? 'bg-emerald-500 text-white shadow-lg' : 'text-brand-muted hover:text-brand-text'}`}
                >
                  Ready ({orders.filter(o => o.status === 'Ready').length})
                </button>
              </div>
            </div>

            <div className="flex-1">
              {/* DESKTOP VIEW - 3 Columns Grid */}
              <div className="hidden md:grid grid-cols-3 gap-8">
                {['Pending', 'Preparing', 'Ready'].map((status) => (
                  <div key={status} className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <h2 className={`font-bold text-xs uppercase tracking-[0.2em] ${
                        status === 'Pending' ? 'text-orange-500' : 
                        status === 'Preparing' ? 'text-blue-500' : 'text-emerald-500'
                      }`}>
                        {status === 'Pending' ? 'Incoming' : status === 'Ready' ? 'Completed' : status}
                      </h2>
                      <span className="bg-brand-bg text-brand-text text-[10px] font-bold px-2 py-0.5 rounded-lg border border-brand-border">
                        {orders.filter(o => o.status === status).length}
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      {orders.filter(o => o.status === status).map(order => (
                        <div key={order.id} className="bg-white rounded-[2.5rem] border border-brand-border p-6 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                          <div className={`absolute top-0 left-0 w-full h-1.5 ${
                            status === 'Ready' ? 'bg-emerald-500' : 
                            status === 'Preparing' ? 'bg-blue-500' : 'bg-orange-500'
                          }`} />
                          
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center font-bold text-brand-red text-xs">
                                {order.orderId.slice(-2)}
                              </div>
                              <h3 className="font-bold text-sm text-brand-text uppercase tracking-tight">#{order.orderId}</h3>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-6">
                            {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).map((item: any, i: number) => {
                              const isItemReady = item.status === 'ready';
                              return (
                                <div key={i} className={`flex justify-between items-center text-[11px] font-bold p-2 rounded-xl border ${
                                  isItemReady 
                                    ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through' 
                                    : 'bg-brand-bg/30 text-brand-text border-brand-bg/10'
                                }`}>
                                  <span className="truncate mr-2 flex items-center gap-1">
                                    {isItemReady && <Check size={12} className="text-emerald-500 flex-shrink-0" />}
                                    {item.name}
                                  </span>
                                  <span className={isItemReady ? 'text-slate-400' : 'text-brand-red whitespace-nowrap'}>
                                    x{item.quantity} {isItemReady && '(Ready)'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-4 border-t border-dashed border-brand-border">
                            {status === 'Pending' && (
                              <button 
                                 onClick={() => updateOrderStatus(order.orderId, 'Preparing')}
                                 className="w-full bg-brand-text text-white font-bold py-3 rounded-xl hover:bg-black transition-all uppercase text-[9px] tracking-widest shadow-lg active:scale-95"
                              >
                                 Start
                              </button>
                            )}
                            {status === 'Preparing' && (
                              <button 
                                onClick={() => updateOrderStatus(order.orderId, 'Ready')}
                                className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-all uppercase text-[9px] tracking-widest shadow-lg active:scale-95"
                              >
                                 Ready
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE/TABLET VIEW - Toggled View */}
              <div className="grid grid-cols-1 md:hidden gap-8">
                {orders.filter(o => o.status === kitchenTab).map(order => (
                  <div key={order.id} className="bg-white rounded-[3rem] border border-brand-border p-8 hover:shadow-2xl hover:shadow-brand-red/5 hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden group animate-fade-in">
                  {/* Priority Indicator */}
                  <div className={`absolute top-0 left-0 w-full h-2 ${
                    order.status === 'Ready' ? 'bg-emerald-500' : 
                    order.status === 'Preparing' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center font-bold text-brand-red shadow-inner">
                        {order.orderId.slice(-2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-text uppercase tracking-tight">#{order.orderId}</h3>
                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">{order.type}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 
                      order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-8">
                    <div className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                      Order Items <div className="h-[1px] flex-1 bg-brand-bg" />
                    </div>
                    <div className="space-y-3">
                       {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).map((item: any, i: number) => {
                         const isItemReady = item.status === 'ready';
                         return (
                           <div key={i} className={`flex justify-between items-center text-sm font-bold p-3 rounded-2xl border ${
                             isItemReady 
                               ? 'bg-slate-100/50 text-slate-400 border-solid border-slate-200 line-through' 
                               : 'bg-brand-bg/50 text-brand-text border-brand-bg/20'
                           }`}>
                             <span className="text-brand-text flex items-center gap-1.5 truncate">
                               {isItemReady && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
                               {item.name}
                             </span>
                             <span className={isItemReady ? 'text-slate-400' : 'text-brand-red bg-white px-2 py-1 rounded-lg text-[10px] shadow-sm'}>
                               x{item.quantity} {isItemReady && '(Ready)'}
                             </span>
                           </div>
                         );
                       })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-brand-border">
                    {order.status === 'Pending' && (
                      <button 
                         onClick={() => updateOrderStatus(order.orderId, 'Preparing')}
                         className="w-full bg-brand-text text-white font-bold py-4 rounded-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-text/10 active:scale-95 flex items-center justify-center gap-2"
                      >
                         <ChefHat size={16} /> Start Preparing
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button 
                        onClick={() => updateOrderStatus(order.orderId, 'Ready')}
                        className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                         <CheckCircle size={16} /> Mark as Ready
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <div className="py-4 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ready for Delivery</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status === kitchenTab).length === 0 && (
                <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-brand-border border-dashed animate-fade-in">
                    <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-subtle">
                      <ChefHat size={48} className="text-brand-border opacity-50" />
                    </div>
                    <p className="text-brand-muted font-bold uppercase tracking-[0.5em] text-sm">Kitchen is Clear</p>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

      </main>
    </div>
  );
}
