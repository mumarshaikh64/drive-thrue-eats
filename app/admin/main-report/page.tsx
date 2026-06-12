'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
  Globe,
  UtensilsCrossed,
  Filter,
  X,
  AlertCircle,
  MessageCircle,
  Eye,
  Info,
} from 'lucide-react';

export default function MainReportPage() {
  // KPI Summary state
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCash: 0,
    totalUPI: 0,
    totalCredit: 0,
    pendingCredit: 0,
    clearedCredit: 0,
    todaySales: 0,
    monthSales: 0
  });

  // Table state
  const [orders, setOrders] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentType, setPaymentType] = useState('All');
  const [source, setSource] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // UI state
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchMainReport = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        paymentType,
        source,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/admin/main-report?${queryParams.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch master report data');
      }
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalOrdersCount(data.pagination?.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while fetching reports.');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [startDate, endDate, paymentType, source, page, limit]);

  useEffect(() => {
    fetchMainReport(false);
    const interval = setInterval(() => fetchMainReport(true), 10000);
    return () => clearInterval(interval);
  }, [fetchMainReport]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPaymentType('All');
    setSource('All');
    setPage(1);
  };

  const handleExportReport = () => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    window.open(`/api/admin/export/main-report?${queryParams.toString()}`, '_blank');
  };

  const handleShareViaWhatsApp = () => {
    const phoneInput = prompt('Enter WhatsApp Number to share the report summary (with Country Code, e.g. 923001234567):');
    if (phoneInput === null) return;
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone) { alert('Invalid phone number.'); return; }

    const dateRangeStr = startDate && endDate
      ? `${startDate} to ${endDate}`
      : startDate
      ? `From ${startDate}`
      : endDate
      ? `Up to ${endDate}`
      : 'All Time';

    const reportUrl = `${window.location.origin}/api/admin/export/main-report${startDate || endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`;
    const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const message =
      `*DRIVE THRU EATS* \u{1F354}\u{1F525}\n*Master Sales Report*\n---------------------------------------\n` +
      `*Report Period:* ${dateRangeStr}\n` +
      `---------------------------------------\n` +
      `*Total Sales:* \u{20B9}${Math.round(summary.totalSales)}\n` +
      `*Total Orders:* ${summary.totalOrders}\n` +
      `*Cash Received:* \u{20B9}${Math.round(summary.totalCash)}\n` +
      `*UPI Received:* \u{20B9}${Math.round(summary.totalUPI)}\n` +
      `*Credit Given:* \u{20B9}${Math.round(summary.totalCredit)}\n` +
      `*Cleared Credit:* \u{20B9}${Math.round(summary.clearedCredit)}\n` +
      `*Pending Credit:* \u{20B9}${Math.round(summary.pendingCredit)}\n` +
      `*Today\u2019s Sales:* \u{20B9}${Math.round(summary.todaySales)}\n` +
      `*Month\u2019s Sales:* \u{20B9}${Math.round(summary.monthSales)}\n` +
      `---------------------------------------\n` +
      `\u{1F4C4} Full Report: ${reportUrl}\n` +
      `*Generated:* ${dateStr}\n` +
      `Drive-Thru Eats — Restaurant Management System`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOrderViaWhatsApp = (order: any) => {
    if (!order) return;
    const defaultPhone = order.phone && order.phone !== 'N/A' ? order.phone : '';
    const phoneInput = prompt("Enter Customer WhatsApp Phone Number (with Country Code, e.g. 923001234567 or 919876543210):", defaultPhone);
    if (phoneInput === null) return;

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Master Reports</h1>
          <p className="text-[#6c757d] font-medium mt-1">Comprehensive restaurant financial analytics, sales records, and payment distributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShareViaWhatsApp}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-sm whitespace-nowrap"
          >
            <MessageCircle size={17} /> Share via WhatsApp
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-[#f06d2e] hover:bg-[#d85c20] text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm whitespace-nowrap"
          >
            <FileSpreadsheet size={18} /> Export Master Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md">
            <IndianRupee size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Sales</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.totalSales)}</p>
          </div>
        </div>

        {/* Cash Received */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-md">
            <IndianRupee size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cash Received</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.totalCash)}</p>
          </div>
        </div>

        {/* UPI Received */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UPI Received</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.totalUPI)}</p>
          </div>
        </div>

        {/* Credit Given */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credit Given</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.totalCredit)}</p>
          </div>
        </div>

        {/* Cleared Credit */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cleared Credit</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.clearedCredit)}</p>
          </div>
        </div>

        {/* Pending Credit */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Credit</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.pendingCredit)}</p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-md">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today&apos;s Sales</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.todaySales)}</p>
          </div>
        </div>

        {/* Month's Sales */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Month&apos;s Sales</p>
            <p className="text-xl font-black text-brand-text tracking-tight">₹{Math.round(summary.monthSales)}</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
            <p className="text-xl font-black text-brand-text tracking-tight">{summary.totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Table Filters Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
                        onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">To Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red"
                      />
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    {(startDate || endDate) ? (
                      <button 
                        onClick={() => { setStartDate(''); setEndDate(''); setPage(1); setIsDateDropdownOpen(false); }}
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

          {/* Payment Type Filter */}
          <select 
            value={paymentType} 
            onChange={e => { setPaymentType(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none flex-grow sm:flex-grow-0"
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Credit">Credit</option>
          </select>

          {/* Source Filter */}
          <select 
            value={source} 
            onChange={e => { setSource(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none flex-grow sm:flex-grow-0"
          >
            <option value="All">All Sources</option>
            <option value="User Website">User Website</option>
            <option value="Waiter">Waiter</option>
          </select>

          {/* Clear Filters Button */}
          {(startDate || endDate || paymentType !== 'All' || source !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-xs px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-all"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        <div className="text-sm font-bold text-gray-500">
          Filtered Orders Count: <span className="text-[#212529] font-black">{totalOrdersCount}</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Detailed Table Card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-text tracking-tight flex items-center gap-2">
            <Filter className="text-brand-red animate-pulse" size={18} /> Detailed Sales Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <th className="p-6 w-16">S.No</th>
                <th className="p-6">Order ID</th>
                <th className="p-6">Source</th>
                <th className="p-6">Customer Details</th>
                <th className="p-6">Items Ordered</th>
                <th className="p-6">Payment Method</th>
                <th className="p-6">Date & Time</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-gray-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading sales entries...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-gray-400 font-bold">
                    No orders match your current filters.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                    {/* S.No */}
                    <td className="p-6 text-sm font-bold text-gray-400">
                      {(page - 1) * limit + index + 1}
                    </td>

                    {/* Order ID */}
                    <td className="p-6">
                      <p className="font-bold text-gray-900">{order.orderId}</p>
                    </td>

                    {/* Source */}
                    <td className="p-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        {order.source === 'Waiter' ? (
                          <>
                            <UtensilsCrossed size={14} className="text-orange-500" />
                            <span>Waiter</span>
                          </>
                        ) : (
                          <>
                            <Globe size={14} className="text-blue-500" />
                            <span>Website</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="p-6 text-sm">
                      <p className="font-bold text-gray-900">{order.credit_customer_name || order.customerName || 'Walk-in'}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5">{order.credit_phone || order.phone || 'N/A'}</p>
                    </td>

                    {/* Items Ordered */}
                    <td className="p-6 text-xs font-semibold text-gray-600 max-w-[200px]">
                      <div className="space-y-0.5 max-h-[80px] overflow-y-auto pr-1">
                        {(Array.isArray(order.items) ? order.items : []).map((it: any, i: number) => (
                          <div key={i}>
                            {it.quantity}x {it.name}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="p-6">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        order.normalizedPayment === 'Credit'
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : order.normalizedPayment === 'UPI'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {order.normalizedPayment} {order.normalizedPayment === 'Credit' ? `(${order.credit_status || 'pending'})` : ''}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="p-6 text-xs text-gray-600">
                      <p className="font-bold">{order.order_date}</p>
                      <p className="text-gray-400 font-semibold mt-0.5">{order.order_time}</p>
                    </td>

                    {/* Amount */}
                    <td className="p-6 text-right text-base font-black text-brand-text">
                      ₹{order.total}
                    </td>

                    {/* Actions */}
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                        title="View Order Details"
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

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="text-xs font-semibold text-gray-500">
              Showing Page <span className="text-[#212529] font-bold">{page}</span> of <span className="text-[#212529] font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-premium relative my-auto">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div className="flex flex-col flex-grow text-left">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Info className="text-brand-red" size={20} /> Order Details
                </h2>
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">ID: {selectedOrder.orderId || selectedOrder.id}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8 text-left">
              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time</p>
                  <p className="font-bold text-sm text-gray-900">{selectedOrder.order_time}</p>
                  <p className="text-[10px] font-medium text-gray-500">{selectedOrder.order_date}</p>
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
                  <p className="font-bold text-gray-700">{selectedOrder.credit_customer_name || selectedOrder.customerName || 'Walk-in'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.credit_phone || selectedOrder.phone || 'N/A'}</p>
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
    </div>
  );
}
