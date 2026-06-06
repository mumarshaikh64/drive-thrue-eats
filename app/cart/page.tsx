'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, ArrowLeft, Info, HelpCircle, CheckCircle2, ChevronRight, MapPin, Phone, User, Mail, CreditCard, Tag, Truck, ShoppingBasket, Utensils, Upload, X } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';

const DELIVERY_ZONES = [
  { area: "Handwara Town", fee: 0 },
  { area: "Herpora Handwara", fee: 0 },
  { area: "Braripora Handwara", fee: 0 },
  { area: "Kulangam Handwara", fee: 0 },
  { area: "Chotipora Handwara", fee: 0 },
  { area: "By Pass Handwara", fee: 0 },
  { area: "Chogaul Handwara", fee: 0 },
  { area: "Haran chogul", fee: 20 },
  { area: "Kargama", fee: 20 },
  { area: "Maritgam", fee: 20 },
  { area: "Baghatpora Handwara", fee: 20 },
  { area: "Vadpora Handwara", fee: 20 },
  { area: "Totigund Handwara", fee: 20 },
  { area: "Gund Kohru", fee: 20 },
  { area: "Darashpora", fee: 20 },
  { area: "Langate", fee: 50 },
  { area: "Wadipora Rajwar", fee: 50 },
  { area: "Kawari", fee: 50 },
  { area: "Nutnoosa", fee: 50 },
  { area: "Sagipora", fee: 50 },
  { area: "Pohrupeth", fee: 50 },
  { area: "Hanga mawar", fee: 50 },
  { area: "Magam Handwara", fee: 50 }
];

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const router = useRouter();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form States
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dining'>('delivery');
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Credit Form States
  const [creditName, setCreditName] = useState('');
  const [creditCompany, setCreditCompany] = useState('');
  const [creditPhone, setCreditPhone] = useState('');

  useEffect(() => {
    if (paymentMethod === 'Credit') {
      if (!creditName) setCreditName(name);
      if (!creditPhone) setCreditPhone(phone);
    }
  }, [paymentMethod, name, phone]);

  useEffect(() => {
    fetch('/api/tables')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTablesList(data);
      });
      
    // Check for saved coupon from Hero section
    const savedCoupon = localStorage.getItem('savedCoupon');
    if (savedCoupon) {
      setCoupon(savedCoupon);
      fetch('/api/coupons')
        .then(res => res.json())
        .then(coupons => {
          const validCoupon = coupons.find((c: any) => c.code === savedCoupon.toUpperCase() && c.isActive);
          if (validCoupon) {
            setDiscount(validCoupon.discount);
          }
        })
        .catch(console.error);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    const match = text.match(/\[AN#\s*([^\|\]\s]+)/);
    const toCopy = match ? match[1] : text;
    navigator.clipboard.writeText(toCopy);
    alert('Account Number Copid to Clipboard!');
  };

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const res = await fetch('/api/coupons');
      const coupons = await res.json();
      const validCoupon = coupons.find((c: any) => c.code === coupon.toUpperCase() && c.isActive);
      
      if (validCoupon) {
        setDiscount(validCoupon.discount);
      } else {
        setDiscount(0);
        setCouponError('Invalid or expired coupon');
        setTimeout(() => setCouponError(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setDiscount(0);
    }
  };

  const discountAmount = Math.round(totalPrice * discount / 100);
  const currentDeliveryFee = orderType === 'delivery' ? (DELIVERY_ZONES.find(d => d.area === deliveryArea)?.fee || 0) : 0;
  const finalPrice = totalPrice - discountAmount + currentDeliveryFee;

  const [isRestaurantClosed, setIsRestaurantClosed] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) return;
        if (!data.isOpen) {
          setIsRestaurantClosed(true);
          return;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = (data.openTime || '09:00').split(':').map(Number);
        const [closeH, closeM] = (data.closeTime || '23:00').split(':').map(Number);
        const openTotal = openH * 60 + openM;
        const closeTotal = closeH * 60 + closeM;

        if (openTotal < closeTotal) {
          if (!(currentTime >= openTotal && currentTime < closeTotal)) {
            setIsRestaurantClosed(true);
          }
        } else {
          if (!(currentTime >= openTotal || currentTime < closeTotal)) {
            setIsRestaurantClosed(true);
          }
        }
      });
  }, []);

  const placeOrder = () => {
    if (isRestaurantClosed) {
      alert("Sorry jani! Restaurant is currently CLOSED. We cannot accept orders right now.");
      return;
    }
    if (!name.trim() || !phone.trim()) return alert("Please enter Name and Phone!");
    if (phone.length !== 11) return alert("Mobile Number must be exactly 11 digits!");
    if (orderType === 'dining' && !selectedTable) return alert("Please select a Table Number!");

    const isOnlinePayment = paymentMethod !== 'Credit' && paymentMethod !== 'Cash On Delivery' && paymentMethod !== '';
    if (isOnlinePayment) {
      if (!transactionNumber.trim()) {
        return alert("Please enter the Transaction Number/ID!");
      }
      if (!screenshot) {
        return alert("Please upload a screenshot of your transaction!");
      }
    }

    if (paymentMethod === 'Credit') {
      if (!creditName.trim() || !creditCompany.trim() || !creditPhone.trim()) {
        return alert("Please fill in all Credit form fields (Full Name, Company Name, and Phone Number)!");
      }
      if (creditPhone.length !== 11) {
        return alert("Credit Phone Number must be exactly 11 digits!");
      }
    }

    const newOrder = {
      customerName: name,
      email,
      phone,
      type: orderType,
      tableNumber: orderType === 'dining' ? selectedTable : '',
      deliveryArea,
      address: orderType === 'delivery' ? address : '',
      instructions,
      paymentMethod,
      transactionNumber: paymentMethod === 'Credit' ? '' : transactionNumber,
      screenshot: isOnlinePayment ? screenshot : '',
      items: items,
      total: finalPrice,
      status: 'Pending',
      // Credit payment details
      payment_type: paymentMethod === 'Credit' ? 'credit' : undefined,
      credit_customer_name: paymentMethod === 'Credit' ? creditName : undefined,
      credit_company_name: paymentMethod === 'Credit' ? creditCompany : undefined,
      credit_phone: paymentMethod === 'Credit' ? creditPhone : undefined,
      credit_status: paymentMethod === 'Credit' ? 'pending' : undefined,
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        setOrderPlaced(true);
        clearCart();
        localStorage.removeItem('savedCoupon');
      } else {
        alert('Order Failed: ' + (data.detail || data.error || 'Unknown Error'));
      }
    })
    .catch(err => {
      alert('Network Error: Could not reach server');
      console.error(err);
    });
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 animate-bounce transition-all">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold text-brand-text mb-4 tracking-tighter">Order <span className="text-brand-red">Confirmed!</span></h1>
        <p className="text-brand-muted max-w-md font-medium text-lg leading-relaxed">
          Your legendary meal is being prepared. Grab a seat, relax, and get ready for a taste explosion!
        </p>
        <Link href="/" className="btn-primary mt-12 py-5 px-12 text-lg shadow-premium">
          ORDER MORE FOOD
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="w-32 h-32 bg-brand-bg rounded-full flex items-center justify-center mb-10 text-brand-muted/30">
          <ShoppingBasket size={64} />
        </div>
        <h2 className="text-3xl font-bold text-brand-text mb-4 tracking-tight">Your tray is empty.</h2>
        <p className="text-brand-muted mb-10 font-medium tracking-wide">Looks like you haven&apos;t added any legendary specials yet.</p>
        <Link href="/" className="btn-primary flex items-center gap-2 py-4 px-8 shadow-premium">
          <ArrowLeft size={18} /> START ORDERING
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 lg:pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <Link href="/" className="group inline-flex items-center gap-2 text-brand-muted hover:text-brand-red transition-all font-bold text-sm mb-4">
            <ArrowLeft size={16} /> Back to Menu
          </Link>
          <h1 className="text-4xl lg:text-6xl font-bold text-brand-text tracking-tighter">
            Finalize Your <span className="text-brand-red">Order.</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* LEFT: FORM */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-premium">
              {/* Service Selection */}
              <div className="flex flex-wrap items-center gap-8 mb-12 px-2">
                {[
                  { id: 'delivery', label: 'Delivery' },
                  { id: 'pickup', label: 'Take Away' }
                ].map((type) => (
                  <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="orderType"
                        checked={orderType === type.id}
                        onChange={() => setOrderType(type.id as any)}
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-brand-red transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-brand-red rounded-full opacity-0 peer-checked:opacity-100 transition-all scale-0 peer-checked:scale-100"></div>
                    </div>
                    <span className={`font-bold text-sm tracking-tight transition-all ${orderType === type.id ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-10">
                {orderType === 'dining' && (
                  <div className="p-8 bg-brand-red/5 rounded-3xl border border-brand-red/10 animate-fade-in">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-4 block ml-2">Select Your Table Spot</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {tablesList.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTable(t.number)}
                          className={`py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                            selectedTable === t.number
                              ? 'bg-brand-red border-brand-red text-white shadow-lg'
                              : 'bg-white border-brand-border text-brand-text hover:border-brand-red/30'
                          }`}
                        >
                          Table {t.number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. rahul.sharma@gmail.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" />
                  </div>
                </div>

                {orderType === 'delivery' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Delivery Area</label>
                        <div className="relative">
                          <select value={deliveryArea} onChange={e => setDeliveryArea(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm appearance-none cursor-pointer">
                            <option value="">Select Delivery Area</option>
                            {DELIVERY_ZONES.map(z => (
                              <option key={z.area} value={z.area}>{z.area}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRight size={16} className="rotate-90 text-slate-400" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Mobile Number</label>
                        <input 
                          type="tel" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} 
                          maxLength={11} 
                          placeholder="e.g. 9876543210" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Delivery Address</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. House No. 12, Main Bazar, Handwara" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Mobile Number</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} 
                      maxLength={11} 
                      placeholder="e.g. 9876543210" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" 
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Any Instructions</label>
                  <input type="text" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Deliver near main gate / Make it extra spicy" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all font-medium shadow-sm" />
                </div>

                <div className="pt-6">
                  <label className="text-xs font-bold text-slate-500 mb-3 block">Coupon Code# <span className="text-slate-800">(Apply Coupon Code After Quentity Selection.)</span></label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      placeholder="Enter Coupon Code"
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none shadow-sm"
                    />
                    <button onClick={applyCoupon} className="bg-[#f06d2e] text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-tight shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all">Apply Code</button>
                  </div>
                  {couponError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2">{couponError}</p>}
                  {discount > 0 && <p className="text-green-500 text-[10px] font-bold mt-2 ml-2">Coupon Applied: {discount}% OFF</p>}
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <label className="text-xs font-bold text-slate-500">Payment Method | <button onClick={() => copyToClipboard(paymentMethod)} className="underline hover:text-brand-red">Copy Account Number</button></label>
                  </div>
                  <div className="relative">
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-white border-2 border-orange-100 rounded-2xl px-6 py-5 text-slate-800 font-medium focus:outline-none focus:border-orange-200 transition-all appearance-none shadow-sm">
                      <option value="">Select Payment Method</option>
                      <option value="M-PAY - [AN# 013104012000330 | Title: Ishfaq Nazir]">M-PAY - [AN# 013104012000330 | Title: Ishfaq Nazir]</option>
                      <option value="G-PAY- [AN# +919682329952]">G-PAY- [AN# +919682329952]</option>
                      <option value="UPI - [AN# 9682329952@okbizaxis]">UPI - [AN# 9682329952@okbizaxis]</option>
                      <option value="Cash On Delivery">Cash On Delivery</option>
                      <option value="Credit">Credit</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight size={20} className="rotate-90 text-slate-400" />
                    </div>
                  </div>
                </div>

                {paymentMethod === 'Credit' && (
                  <div className="p-8 bg-orange-50/10 rounded-[2rem] border border-orange-200/20 space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Credit Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={creditName}
                          onChange={e => setCreditName(e.target.value)}
                          placeholder="e.g. Ishfaq Nazir"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:border-brand-red transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={creditCompany}
                          onChange={e => setCreditCompany(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:border-brand-red transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={creditPhone}
                          onChange={e => setCreditPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          maxLength={11}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:border-brand-red transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod !== 'Credit' && paymentMethod !== 'Cash On Delivery' && paymentMethod !== '' && (
                  <div className="space-y-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Transaction Number *</label>
                      <input 
                        type="text" 
                        value={transactionNumber} 
                        onChange={e => setTransactionNumber(e.target.value)} 
                        placeholder="Enter Transaction Number/ID" 
                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red/20 transition-all shadow-sm font-medium" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Upload Transaction Screenshot *</label>
                      
                      {!screenshot ? (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:bg-white hover:border-brand-red/40 transition-all group bg-white/50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <Upload size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 mb-1">Click to upload screenshot</p>
                            <p className="text-[10px] text-slate-400 font-medium">PNG, JPG or JPEG (Max 5MB)</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      ) : (
                        <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white p-2 flex items-center gap-4 animate-fade-in">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={screenshot} alt="Screenshot Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">Screenshot uploaded</p>
                            <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 size={12} /> Ready to submit
                            </p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setScreenshot('')} 
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors mr-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-50 rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-[10px] text-slate-800 uppercase tracking-tight mb-1">{item.quantity} X {item.name}</h4>
                      <p className="font-bold text-xs text-slate-400 font-mono tracking-tighter">₹{item.price}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-[#f06d2e] flex items-center justify-center text-white"><Plus size={14} /></button>
                        <span className="font-bold text-sm min-w-4 text-center">{item.quantity}</span>
                        <button onClick={() => { if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1); else removeFromCart(item.id); }} className="w-6 h-6 rounded-md bg-[#f06d2e] flex items-center justify-center text-white"><Minus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-800">Delivery Fee:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{currentDeliveryFee}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-800">Discount:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{discountAmount}</span>
                </div>
                <div className="flex justify-between items-center px-1 pt-2">
                  <span className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Grand Total:</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">₹{finalPrice}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <Link href="/" className="w-full bg-[#f06d2e] text-white py-4 rounded-xl font-bold uppercase tracking-tight text-center shadow-lg shadow-orange-500/10 hover:scale-[1.01] transition-all">Add More Item</Link>
                 <button 
                  onClick={placeOrder} 
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-tight shadow-xl transition-all ${
                    isRestaurantClosed 
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-70 shadow-none' 
                      : 'bg-[#f06d2e] text-white shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isRestaurantClosed ? 'Restaurant Closed' : 'Place Order'}
                </button>
              </div>
            </div>

            <div className="p-8 glass border-brand-border/50 rounded-[2rem] text-center">
              <HelpCircle size={24} className="mx-auto mb-3 text-brand-muted/50" />
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Safe & Secure Payments</p>
              <p className="text-[8px] font-medium text-brand-muted/70 mt-1 uppercase tracking-widest leading-relaxed">
                By placing an order, you agree to our <br />
                Terms of Service & Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
