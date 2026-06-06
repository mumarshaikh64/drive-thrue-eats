'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Users, Utensils, IndianRupee, TrendingUp, Clock, CheckCircle2, ChevronRight, LayoutGrid, Power } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    preparedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadDashboard = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const total = data.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
          const pending = data.filter(o => o.status === 'Pending').length;
          const prepared = data.filter(o => o.status === 'Delivered').length;
          
          setStats({
            totalOrders: data.length,
            totalSales: Math.round(total),
            pendingOrders: pending,
            preparedOrders: prepared
          });
          setRecentOrders(data.slice(0, 5));
        }
      });
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-5xl font-bold text-brand-text tracking-tighter">
            Dashboard <span className="text-brand-red">Overview.</span>
          </h1>
          <p className="text-brand-muted font-medium mt-1">Real-time performance and analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
            View All Orders <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag size={24} />, color: 'bg-blue-500' },
          { label: 'Total Sales', value: `₹${stats.totalSales}`, icon: <IndianRupee size={24} />, color: 'bg-green-500' },
          { label: 'Pending', value: stats.pendingOrders, icon: <Clock size={24} />, color: 'bg-orange-500' },
          { label: 'Completed', value: stats.preparedOrders, icon: <CheckCircle2 size={24} />, color: 'bg-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 group hover:scale-[1.02] transition-all">
            <div className={`w-14 h-14 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-brand-text tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-text tracking-tight flex items-center gap-3">
              <TrendingUp className="text-brand-red" size={20} /> Latest Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-bold text-brand-red hover:underline uppercase tracking-widest">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-brand-text">{order.orderId}</td>
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold text-brand-text">{order.customerName}</p>
                      <p className="text-[10px] text-brand-muted font-medium uppercase tracking-tighter">{order.type}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                        order.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                        order.status === 'Preparing' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-black text-brand-text">₹{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
