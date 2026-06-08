'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Phone,
  AlertCircle,
  LayoutList,
  Users,
  ChevronDown,
  ChevronUp,
  Wallet,
  X,
  TrendingUp,
  TrendingDown,
  Receipt,
  BadgeCheck,
  CreditCard,
  Eye,
  Printer,
  ChefHat,
  Utensils,
  MapPin,
  MessageCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Employee {
  credit_customer_name: string;
  credit_company_name: string;
  credit_phone: string;
  total_ordered: number;
  total_paid: number;
  pending_balance: number;
  pending_orders_count: number;
  last_order_date: string | null;
  orders: any[];
}

interface Company {
  company_name: string;
  total_pending: number;
  employees: Employee[];
}

interface SettleModalData {
  employee: Employee;
}

// ─── Settle Modal ─────────────────────────────────────────────────────────────
function SettleModal({
  data,
  onClose,
  onSuccess,
}: {
  data: SettleModalData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { employee } = data;
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const shareSettlementViaWhatsApp = () => {
    const defaultPhone = employee.credit_phone || '';
    const phoneInput = prompt('Enter WhatsApp Number to send settlement confirmation (with Country Code, e.g. 923001234567):', defaultPhone);
    if (phoneInput === null) return;
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone) { alert('Invalid phone number.'); return; }

    const amt = parseFloat(amountPaid) || 0;
    const remaining = Math.max(0, employee.pending_balance - amt);
    const isFullPayment = amt >= employee.pending_balance;
    const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const message =
      `*DRIVE THRU EATS* 🍔🔥\n*Credit Account Settlement*\n---------------------------------------\n` +
      `*Customer:* ${employee.credit_customer_name || 'N/A'}\n` +
      `*Company:* ${employee.credit_company_name || 'Individual'}\n` +
      `*Phone:* ${employee.credit_phone}\n` +
      `---------------------------------------\n` +
      `*Total Pending:* ₹${employee.pending_balance.toFixed(2)}\n` +
      `*Amount Paid:* ₹${amt.toFixed(2)} via ${paymentMethod}\n` +
      `${transactionNumber ? `*Transaction #:* ${transactionNumber}\n` : ''}` +
      `*Remaining Balance:* ₹${remaining.toFixed(2)}\n` +
      `*Status:* ${isFullPayment ? '✅ Account CLEARED' : '⚠️ Partially Settled'}\n` +
      `---------------------------------------\n` +
      `*Date:* ${dateStr}\n` +
      `Thank you for your payment! ❤️`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyAccountNumber = () => {
    const accountNumbers: Record<string, string> = {
      'M-PAY - [AN# 013104012000330 | Title: Ishfaq Nazir]': '013104012000330',
      'G-PAY- [AN# +919682329952]': '+919682329952',
      'UPI - [AN# 9682329952@okbizaxis]': '9682329952@okbizaxis',
    };
    const num = accountNumbers[paymentMethod];
    if (num) {
      navigator.clipboard.writeText(num);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const remaining = employee.pending_balance - (parseFloat(amountPaid) || 0);
  const isFullPayment = parseFloat(amountPaid) >= employee.pending_balance;

  const handleSubmit = async () => {
    const amt = parseFloat(amountPaid);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (paymentMethod !== 'Cash' && !transactionNumber.trim()) {
      setError('Please enter the transaction number.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/credit-reports/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credit_customer_name: employee.credit_customer_name,
          credit_company_name: employee.credit_company_name,
          credit_phone: employee.credit_phone,
          amount_paid: amt,
          total_pending: employee.pending_balance,
          note,
          payment_method: paymentMethod,
          transaction_number: paymentMethod !== 'Cash' ? transactionNumber : '',
        }),
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to settle');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={20} className="text-yellow-400" />
                <h2 className="text-lg font-black">Settle Payment</h2>
              </div>
              <p className="text-white/60 text-sm font-medium">Record payment received from customer</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Customer Info */}
          <div className="mt-5 bg-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <User size={14} className="text-white/60" />
              <span>{employee.credit_customer_name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <Building2 size={14} className="text-white/40" />
              <span>{employee.credit_company_name || 'Individual'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <Phone size={14} className="text-white/40" />
              <span>{employee.credit_phone}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 pt-5 pb-2">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Total Pending</p>
              <p className="text-xl font-black text-red-600">₹{employee.pending_balance.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Already Paid</p>
              <p className="text-xl font-black text-green-600">₹{employee.total_paid.toFixed(2)}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">
              Amount Received (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder="0.00"
                min={0}
                max={employee.pending_balance}
                className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-lg font-black outline-none focus:border-brand-red transition-colors"
              />
            </div>
            {/* Quick Fill Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setAmountPaid(employee.pending_balance.toFixed(2))}
                className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 rounded-lg transition-colors"
              >
                Full Amount
              </button>
              <button
                onClick={() => setAmountPaid((employee.pending_balance / 2).toFixed(2))}
                className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-lg transition-colors"
              >
                Half (₹{(employee.pending_balance / 2).toFixed(0)})
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Payment Method
              </label>
              {paymentMethod !== 'Cash' && (
                <button
                  onClick={copyAccountNumber}
                  className={`text-[10px] font-bold underline transition-colors ${copySuccess ? 'text-green-600' : 'text-brand-red hover:text-rose-700'
                    }`}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy Account Number'}
                </button>
              )}
            </div>
            <select
              value={paymentMethod}
              onChange={e => { setPaymentMethod(e.target.value); setCopySuccess(false); }}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-red transition-colors"
            >
              <option value="Cash">Cash</option>
              <option value="M-PAY - [AN# 013104012000330 | Title: Ishfaq Nazir]">M-PAY - [AN# 013104012000330 | Title: Ishfaq Nazir]</option>
              <option value="G-PAY- [AN# +919682329952]">G-PAY- [AN# +919682329952]</option>
              <option value="UPI - [AN# 9682329952@okbizaxis]">UPI - [AN# 9682329952@okbizaxis]</option>
            </select>
          </div>

          {/* Transaction Number Input */}
          {paymentMethod !== 'Cash' && (
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">
                Transaction Number
              </label>
              <input
                type="text"
                value={transactionNumber}
                onChange={e => setTransactionNumber(e.target.value)}
                placeholder="Enter Transaction Number"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-red transition-colors font-mono"
              />
            </div>
          )}

          {/* Note Input */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Cash payment received on 23rd May"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {/* Balance Preview */}
          {parseFloat(amountPaid) > 0 && (
            <div className={`rounded-2xl p-3 mb-4 border ${isFullPayment ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isFullPayment ? (
                    <BadgeCheck size={16} className="text-green-600" />
                  ) : (
                    <TrendingDown size={16} className="text-orange-600" />
                  )}
                  <span className={`text-xs font-bold ${isFullPayment ? 'text-green-700' : 'text-orange-700'}`}>
                    {isFullPayment ? 'Full Payment — Account will be CLEARED' : 'Partial Payment — Balance remaining:'}
                  </span>
                </div>
                {!isFullPayment && (
                  <span className="text-sm font-black text-orange-700">₹{remaining.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 mb-4 text-sm font-semibold">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Sticky Footer — always visible */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !amountPaid}
            className="w-full py-3.5 bg-gradient-to-r from-brand-red to-rose-600 hover:from-rose-600 hover:to-brand-red disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-lg shadow-red-200 text-sm"
          >
            {isSubmitting ? 'Recording Payment...' : `Record ₹${parseFloat(amountPaid || '0').toFixed(2)} Payment`}
          </button>
          {parseFloat(amountPaid) > 0 && (
            <button
              type="button"
              onClick={shareSettlementViaWhatsApp}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle size={15} />
              Share Settlement via WhatsApp
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 text-gray-500 font-bold text-sm mt-2 hover:text-gray-700 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Details Modal ───────────────────────────────────────────────────────
interface LogDetailsModalData {
  order: any;
}

function LogDetailsModal({
  data,
  onClose,
}: {
  data: LogDetailsModalData;
  onClose: () => void;
}) {
  const { order } = data;
  const isPayment = order.total < 0;
  const absTotal = Math.abs(order.total);

  // Parse items if they are stringified
  let items = [];
  try {
    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  } catch (e) {
    items = [];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={20} className="text-yellow-400" />
                <h2 className="text-lg font-black">{isPayment ? 'Payment Details' : 'Credit Order Details'}</h2>
              </div>
              <p className="text-white/60 text-sm font-medium">Log ID: {order.orderId}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Customer Card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</h3>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <User size={14} className="text-gray-400" />
              <span>{order.credit_customer_name || order.customerName || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Building2 size={14} className="text-gray-400" />
              <span>{order.credit_company_name || 'Individual'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Phone size={14} className="text-gray-400" />
              <span>{order.credit_phone || order.phone || 'N/A'}</span>
            </div>
          </div>

          {/* Order Details (if not a simple payment settlement) */}
          {!isPayment && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100 animate-fade-in">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Info</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Order Type</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 capitalize">
                    <Utensils size={13} className="text-orange-500" />
                    <span>{order.type || 'Dining'} ({order.waiter ? 'Waiter' : 'Website'})</span>
                  </div>
                </div>
                {order.tableNumber && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Table</span>
                    <span className="text-xs font-bold text-gray-800">Table {order.tableNumber}</span>
                  </div>
                )}
                {order.waiter && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Served By</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <User size={13} className="text-blue-500" />
                      <span>{order.waiter}</span>
                    </div>
                  </div>
                )}
                {order.chef && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Prepared By</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <ChefHat size={13} className="text-red-500" />
                      <span>{order.chef}</span>
                    </div>
                  </div>
                )}
                {(order.deliveryArea || order.address) && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Delivery Details</span>
                    <div className="flex items-start gap-1.5 text-xs font-bold text-gray-800">
                      <MapPin size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        {order.deliveryArea ? `${order.deliveryArea} - ` : ''}{order.address || ''}
                      </span>
                    </div>
                  </div>
                )}
                {order.instructions && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Special Instructions</span>
                    <span className="text-xs font-medium text-gray-600 italic">{order.instructions}</span>
                  </div>
                )}
                {/* Items Ordered List directly inside Order Info */}
                <div className="col-span-2 border-t border-gray-200/60 pt-2.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Items Ordered</span>
                  <div className="space-y-1.5">
                    {items.map((it: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[#e63946] w-5 text-right">{it.quantity}×</span>
                          <span className="font-semibold text-gray-800">{it.name}</span>
                        </div>
                        {it.price != null && (
                          <span className="font-mono font-bold text-gray-500">₹{(it.price * it.quantity).toFixed(0)}</span>
                        )}
                      </div>
                    ))}
                    {items.length > 0 && (
                      <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-gray-200/60">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Total</span>
                        <span className="text-sm font-black text-[#e63946]">₹{absTotal}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log Specific Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${order.credit_status === 'cleared' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                {order.credit_status || 'pending'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase">Date & Time</span>
              <span className="text-xs font-bold text-gray-800">{order.order_date} at {order.order_time}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase">Payment Type</span>
              <span className="text-xs font-bold text-gray-800">{isPayment ? (order.paymentMethod || 'Cash') : 'Credit Account'}</span>
            </div>

            {isPayment && order.transactionNumber && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">Transaction ID</span>
                <span className="text-xs font-bold text-gray-800 font-mono">{order.transactionNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase font-bold">Amount</span>
              <span className={`text-lg font-black ${isPayment ? 'text-green-600' : 'text-red-600'}`}>
                {isPayment ? `+ ₹${absTotal}` : `₹${absTotal}`}
              </span>
            </div>
          </div>

          {/* Payment Note (only for payment transactions) */}
          {isPayment && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Payment Note
              </h3>
              <p className="text-sm font-semibold text-gray-700 italic">
                {items[0]?.name || 'Payment received.'}
              </p>
            </div>
          )}

          {/* Close button */}
          <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm">
            Close details
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Statement Modal ─────────────────────────────────────────────────
function CustomerStatementModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/credit-reports?search=${encodeURIComponent(employee.credit_phone)}&limit=200&page=1&status=All&startDate=&endDate=`);
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to load records');
        const data = await res.json();
        // Sort oldest first for running-balance computation
        const sorted = (data.orders || []).slice().sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
        // Running balance tracks cumulative pending amount
        let running = 0;
        const withBalance = sorted.map((o: any) => {
          running += o.total; // positive for orders, negative for payments
          return { ...o, runningBalance: Math.max(0, running) };
        });
        // Reverse to newest-first for display
        setRecords(withBalance.reverse());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [employee.credit_phone]);

  // Summary stats
  const totalOrdered = records.filter(r => r.total > 0).reduce((s, r) => s + r.total, 0);
  const totalPaid = records.filter(r => r.total < 0).reduce((s, r) => s + Math.abs(r.total), 0);
  const balanceDue = employee.pending_balance;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#e63946] flex items-center justify-center font-black text-lg">D</div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Drive-Thru Eats — Credit Ledger System</p>
                <h2 className="text-xl font-black">Credit Statement</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Customer + Summary row */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer box */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-[#e63946] uppercase tracking-widest mb-2">Customer Account Info</p>
              <div className="flex text-sm"><span className="w-32 text-white/50 font-semibold">Customer Name</span><span className="font-bold">{employee.credit_customer_name}</span></div>
              <div className="flex text-sm"><span className="w-32 text-white/50 font-semibold">Company</span><span className="font-bold">{employee.credit_company_name || 'Individual'}</span></div>
              <div className="flex text-sm"><span className="w-32 text-white/50 font-semibold">Phone Number</span><span className="font-bold font-mono">{employee.credit_phone}</span></div>
            </div>

            {/* Stats boxes */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Credit</p>
                <p className="text-base font-black">₹{totalOrdered.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-base font-black text-green-300">₹{totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-red-500/30 border border-red-400/30 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-red-200 uppercase tracking-widest mb-1">Balance Due</p>
                <p className="text-base font-black text-red-100">₹{balanceDue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3 text-gray-400">
              <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-sm">Loading statement...</span>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-500 font-bold">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                  <th className="p-4 whitespace-nowrap">Date &amp; Time</th>
                  <th className="p-4 whitespace-nowrap">Order ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Items Ordered</th>
                  <th className="p-4 text-right whitespace-nowrap">Amount</th>
                  <th className="p-4 text-right whitespace-nowrap">Balance</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r, i) => {
                  const isPayment = r.total < 0;
                  let parsedItems: any[] = [];
                  let itemsStr = '';
                  try {
                    parsedItems = Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]');
                    itemsStr = parsedItems.map((it: any) => `${it.quantity}x ${it.name}`).join(' • ');
                  } catch { itemsStr = ''; }

                  const dateObj = new Date(r.timestamp);
                  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${r.credit_status === 'cleared' ? 'opacity-60' : ''}`}>
                      <td className="p-4 align-middle whitespace-nowrap">
                        <p className="text-xs font-bold text-gray-700">{dateStr}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{timeStr}</p>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="font-mono text-[11px] text-gray-500">{r.orderId}</span>
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${isPayment
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-orange-50 text-orange-700 border border-orange-100'
                          }`}>
                          {isPayment ? <TrendingUp size={9} /> : <Receipt size={9} />}
                          {isPayment ? 'Payment' : (r.type || 'Order')}
                        </span>
                      </td>
                      <td className="p-4 align-top min-w-[180px]">
                        {isPayment ? (
                          <p className="text-xs font-semibold text-emerald-700 italic">
                            {itemsStr || 'Payment received'}
                          </p>
                        ) : parsedItems.length > 0 ? (
                          <div className="space-y-0.5">
                            {parsedItems.slice(0, 4).map((it: any, idx: number) => (
                              <div key={idx} className="flex items-baseline gap-1.5 text-xs text-gray-700">
                                <span className="font-black text-[#e63946] w-5 text-right flex-shrink-0">{it.quantity}×</span>
                                <span className="font-semibold">{it.name}</span>
                                {it.price != null && (
                                  <span className="text-gray-400 font-mono text-[10px] ml-auto">₹{(it.price * it.quantity).toFixed(0)}</span>
                                )}
                              </div>
                            ))}
                            {parsedItems.length > 4 && (
                              <p className="text-[10px] text-gray-400 font-semibold pl-6">+{parsedItems.length - 4} more items</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right whitespace-nowrap">
                        <span className={`text-sm font-black ${isPayment ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPayment ? `− ₹${Math.abs(r.total).toFixed(2)}` : `₹${r.total.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right whitespace-nowrap">
                        <span className={`text-sm font-bold ${r.runningBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{r.runningBalance.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-center whitespace-nowrap">
                        <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${r.credit_status === 'cleared'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {r.credit_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 flex items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-semibold">Computer-generated credit statement &copy; {new Date().getFullYear()} Drive-Thru Eats</p>
          <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({
  company,
  onSettle,
  onExport,
  onView,
}: {
  company: Company;
  onSettle: (emp: Employee) => void;
  onExport: (phone: string, format: string) => void;
  onView: (emp: Employee) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeDropdownPhone, setActiveDropdownPhone] = useState<string | null>(null);

  const shareStatementViaWhatsApp = (emp: Employee) => {
    const defaultPhone = emp.credit_phone || '';
    const phoneInput = prompt('Enter WhatsApp Number to share credit statement (with Country Code, e.g. 923001234567):', defaultPhone);
    if (phoneInput === null) return;
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone) { alert('Invalid phone number.'); return; }

    const statementUrl = `${window.location.origin}/api/admin/export/credit-statement/pdf?phone=${encodeURIComponent(emp.credit_phone)}`;
    const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

    const message =
      `*DRIVE THRU EATS* 🍔🔥\n*Credit Account Statement*\n---------------------------------------\n` +
      `*Customer:* ${emp.credit_customer_name || 'N/A'}\n` +
      `*Company:* ${emp.credit_company_name || 'Individual'}\n` +
      `*Phone:* ${emp.credit_phone}\n` +
      `---------------------------------------\n` +
      `*Total Credit Used:* ₹${emp.total_ordered.toFixed(2)}\n` +
      `*Total Paid:* ₹${emp.total_paid.toFixed(2)}\n` +
      `*Outstanding Balance:* ₹${emp.pending_balance.toFixed(2)}\n` +
      `*Pending Orders:* ${emp.pending_orders_count}\n` +
      `---------------------------------------\n` +
      `📄 Download Full Statement: ${statementUrl}\n` +
      `*Date:* ${dateStr}\n` +
      `Please clear your dues at the earliest. Thank you! ❤️`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      {/* Company Header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-gray-900">{company.company_name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{company.employees.length} employee{company.employees.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Pending</p>
            <p className="text-lg font-black text-brand-red">₹{company.total_pending.toFixed(2)}</p>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Employee List */}
      {isOpen && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {company.employees.map((emp, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-gray-50/30 transition-colors">
              {/* Employee Info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{emp.credit_customer_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {emp.credit_phone}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {emp.pending_orders_count} pending order{emp.pending_orders_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance & Actions */}
              <div className="flex items-center gap-3 sm:gap-4 ml-12 sm:ml-0">
                <div className="text-right">
                  {emp.total_paid > 0 && (
                    <p className="text-[10px] font-bold text-green-500">₹{emp.total_paid.toFixed(2)} paid</p>
                  )}
                  <p className={`text-base font-black ${emp.pending_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{emp.pending_balance.toFixed(2)}
                  </p>
                  {emp.pending_balance <= 0 && (
                    <span className="text-[10px] font-bold text-green-500">CLEARED</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Eye / View Statement button — always shown */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onView(emp); }}
                    className="flex items-center justify-center bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 p-2.5 rounded-xl transition-all flex-shrink-0"
                    title="View Full Statement"
                  >
                    <Eye size={14} />
                  </button>

                  {emp.pending_balance > 0 && (
                    <button
                      onClick={() => onSettle(emp)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-brand-red to-rose-600 hover:from-rose-600 hover:to-brand-red text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-red-200"
                    >
                      <Wallet size={13} /> Settle
                    </button>
                  )}

                  {/* Dropdown for Statement Export */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdownPhone(activeDropdownPhone === emp.credit_phone ? null : emp.credit_phone)}
                      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
                    >
                      <FileSpreadsheet size={13} /> Report <ChevronDown size={11} className={`transition-transform duration-200 ${activeDropdownPhone === emp.credit_phone ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdownPhone === emp.credit_phone && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownPhone(null)} />
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in text-left">
                          <button
                            onClick={() => {
                              onExport(emp.credit_phone, 'xlsx');
                              setActiveDropdownPhone(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FileSpreadsheet size={13} className="text-green-600" />
                            <span>Excel Statement</span>
                          </button>
                          <button
                            onClick={() => {
                              onExport(emp.credit_phone, 'csv');
                              setActiveDropdownPhone(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FileSpreadsheet size={13} className="text-blue-500" />
                            <span>CSV Statement</span>
                          </button>
                          <button
                            onClick={() => {
                              onExport(emp.credit_phone, 'pdf');
                              setActiveDropdownPhone(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Printer size={13} className="text-red-500" />
                            <span>PDF Statement</span>
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              shareStatementViaWhatsApp(emp);
                              setActiveDropdownPhone(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageCircle size={13} className="text-emerald-600" />
                            <span>Share via WhatsApp</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreditReportsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'logs' | 'balances'>('logs');

  // ── Detailed Logs State ──
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Balances State ──
  const [companies, setCompanies] = useState<Company[]>([]);
  const [balancesSearch, setBalancesSearch] = useState('');
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState('');
  const [totalCustomers, setTotalCustomers] = useState(0);

  // ── Settle Modal ──
  const [settleModal, setSettleModal] = useState<SettleModalData | null>(null);

  // ── View Modal (Detailed Logs) ──
  const [viewModal, setViewModal] = useState<LogDetailsModalData | null>(null);

  // ── Statement Modal (Customer Balances) ──
  const [statementModal, setStatementModal] = useState<Employee | null>(null);

  // ── Fetch Detailed Logs ──
  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams({ search, status, startDate, endDate, page: page.toString(), limit: limit.toString() });
      const res = await fetch(`/api/admin/credit-reports?${queryParams.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch credit reports');
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [search, status, startDate, endDate, page, limit]);

  // ── Fetch Balances ──
  const fetchBalances = useCallback(async (silent = false) => {
    if (!silent) setBalancesLoading(true);
    setBalancesError('');
    try {
      const res = await fetch(`/api/admin/credit-reports/balances?search=${encodeURIComponent(balancesSearch)}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch balances');
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotalCustomers(data.total_customers || 0);
    } catch (err: any) {
      setBalancesError(err.message);
    } finally {
      if (!silent) setBalancesLoading(false);
    }
  }, [balancesSearch]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchReports(false);
      const interval = setInterval(() => fetchReports(true), 10000);
      return () => clearInterval(interval);
    }
  }, [fetchReports, activeTab]);

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances(false);
      const interval = setInterval(() => fetchBalances(true), 10000);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, activeTab]);

  const handleClearCredit = async (orderId: string) => {
    if (!confirm('Mark this credit order as cleared?')) return;
    try {
      const res = await fetch(`/api/admin/credit-reports/${orderId}/clear`, { method: 'PATCH' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to clear credit');
      fetchReports();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteCredit = async (orderId: string) => {
    if (!confirm('Remove this credit record from view?')) return;
    try {
      const res = await fetch(`/api/admin/credit-reports/${orderId}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to delete');
      fetchReports();
    } catch (err: any) { alert(err.message); }
  };

  const [activeExportDropdown, setActiveExportDropdown] = useState<string | null>(null);

  useEffect(() => {
    setActiveExportDropdown(null);
  }, [activeTab]);

  const handleExportById = (orderId: string, format = 'xlsx') => {
    let url = `/api/admin/export/credit/${orderId}`;
    if (format === 'csv') url += '/csv';
    if (format === 'pdf') url += '/pdf';
    window.open(url, '_blank');
  };

  const handleExportByPhone = (phone: string, format = 'xlsx') => {
    let url = `/api/admin/export/credit-statement`;
    if (format === 'csv') url += '/csv';
    if (format === 'pdf') url += '/pdf';
    url += `?phone=${encodeURIComponent(phone)}`;
    window.open(url, '_blank');
  };

  const totalPendingGrand = companies.reduce((s, c) => s + c.total_pending, 0);
  const totalPaidGrand = companies.reduce((s, c) => s + c.employees.reduce((es, emp) => es + emp.total_paid, 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Credit Reports</h1>
          <p className="text-[#6c757d] font-medium mt-1">Monitor, settle, and export customer credit logs.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <LayoutList size={15} /> Detailed Logs
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'balances' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Users size={15} /> Customer Balances
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* DETAILED LOGS TAB                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search Customer/Company/Phone..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none w-full sm:w-64"
                />
              </div>

              <div className="relative flex-grow sm:flex-grow-0">
                <button
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Calendar size={16} className={startDate || endDate ? 'text-brand-red' : 'text-gray-400'} />
                  <span>{startDate || endDate ? 'Date Filtered' : 'Filter by Date'}</span>
                </button>
                {isDateDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDateDropdownOpen(false)} />
                    <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Date Range</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">From Date</label>
                          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">To Date</label>
                          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none text-gray-700 font-bold focus:border-brand-red" />
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        {startDate || endDate ? (
                          <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); setIsDateDropdownOpen(false); }} className="text-xs text-red-500 font-bold hover:text-red-700">Clear Range</button>
                        ) : <div />}
                        <button onClick={() => setIsDateDropdownOpen(false)} className="text-xs bg-brand-text hover:bg-brand-red text-white font-bold px-5 py-2 rounded-lg transition-colors">Apply</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1" />

              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none flex-grow sm:flex-grow-0">
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>

            <div className="text-sm font-bold text-gray-500">
              Total Credit Records: <span className="text-[#212529] font-black">{total}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                    <th className="p-6">Order Info</th>
                    <th className="p-6">Customer Info</th>
                    <th className="p-6">Items & Amount</th>
                    <th className="p-6 text-center">Status</th>
                    <th className="p-6 text-right w-[280px] min-w-[280px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
                          <span>Loading credit reports...</span>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">
                        No credit records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-6 align-top">
                          <p className="font-bold text-gray-900">{order.orderId}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">{order.order_date} at {order.order_time}</p>
                          <span className="mt-2 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                            {order.type || 'dining'}
                          </span>
                        </td>
                        <td className="p-6 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><User size={14} className="text-gray-400" /><span>{order.credit_customer_name || 'N/A'}</span></div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Building2 size={14} className="text-gray-400" /><span>{order.credit_company_name || 'N/A'}</span></div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Phone size={14} className="text-gray-400" /><span>{order.credit_phone || 'N/A'}</span></div>
                          </div>
                        </td>
                        <td className="p-6 align-top">
                          <div className="max-w-[220px] mb-2 space-y-0.5 max-h-[80px] overflow-y-auto pr-1">
                            {(Array.isArray(order.items) ? order.items : []).map((it: any, i: number) => (
                              <div key={i} className="text-xs font-bold text-gray-600">{it.quantity}x {it.name}</div>
                            ))}
                          </div>
                          <p className="text-lg font-black text-brand-red">₹{order.total}</p>
                        </td>
                        <td className="p-6 align-middle text-center">
                          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm border ${order.credit_status === 'cleared' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {order.credit_status || 'pending'}
                          </span>
                        </td>
                        <td className="p-6 align-middle w-[260px] min-w-[260px]">
                          <div className="flex items-center justify-between">
                            {/* Fixed icon group — always on the left */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button type="button" onClick={(e) => { e.stopPropagation(); setViewModal({ order }); }} className="flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all" title="View Details">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => handleDeleteCredit(order.orderId)} className="flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl transition-all" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {/* Variable action button — always on the right */}
                            <div className="flex-shrink-0">
                              {order.total < 0 ? (
                                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap">
                                  <Wallet size={13} /> Received
                                </span>
                              ) : order.credit_status === 'cleared' ? (
                                <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap">
                                  <CheckCircle size={13} /> Cleared
                                </span>
                              ) : (
                                <button onClick={() => handleClearCredit(order.orderId)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm whitespace-nowrap">
                                  <CheckCircle size={13} /> Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                <div className="text-xs font-semibold text-gray-500">
                  Showing Page <span className="text-[#212529] font-bold">{page}</span> of <span className="text-[#212529] font-bold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CUSTOMER BALANCES TAB                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'balances' && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <CreditCard size={22} className="text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Outstanding</p>
                <p className="text-2xl font-black text-red-600">₹{totalPendingGrand.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={22} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Returned</p>
                <p className="text-2xl font-black text-emerald-600">₹{totalPaidGrand.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Companies</p>
                <p className="text-2xl font-black text-gray-900">{companies.length}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Users size={22} className="text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customers</p>
                <p className="text-2xl font-black text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, company, or phone..."
                value={balancesSearch}
                onChange={e => setBalancesSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none w-full"
              />
            </div>
            <div className="text-sm font-bold text-gray-500 whitespace-nowrap">
              <Receipt size={14} className="inline mr-1 text-gray-400" />
              {totalCustomers} customer{totalCustomers !== 1 ? 's' : ''}
            </div>
          </div>

          {balancesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-semibold">{balancesError}</span>
            </div>
          )}

          {/* Company Cards */}
          {balancesLoading ? (
            <div className="bg-white rounded-3xl p-20 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
                <span className="font-bold">Loading customer balances...</span>
              </div>
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center text-gray-400 font-bold">
              No pending credit accounts found.
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company, idx) => (
                <CompanyCard
                  key={idx}
                  company={company}
                  onSettle={emp => setSettleModal({ employee: emp })}
                  onExport={handleExportByPhone}
                  onView={emp => setStatementModal(emp)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Settle Modal */}
      {settleModal && (
        <SettleModal
          data={settleModal}
          onClose={() => setSettleModal(null)}
          onSuccess={() => {
            fetchBalances();
            fetchReports();
          }}
        />
      )}

      {/* View Details Modal */}
      {viewModal && (
        <LogDetailsModal
          data={viewModal}
          onClose={() => setViewModal(null)}
        />
      )}

      {/* Customer Statement Modal */}
      {statementModal && (
        <CustomerStatementModal
          employee={statementModal}
          onClose={() => setStatementModal(null)}
        />
      )}
    </div>
  );
}
