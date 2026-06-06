'use client';
import { useState, useEffect } from 'react';
import { Package, MapPin, ChevronRight, Play, Star, ShieldCheck, Zap } from 'lucide-react';

export default function Hero() {
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [activePromo, setActivePromo] = useState<{ code: string, discount: number } | null>(null);

  useEffect(() => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const active = data.filter(c => c.isActive).sort((a, b) => b.discount - a.discount)[0];
          if (active) setActivePromo(active);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20">
      {/* Background Ornamentation */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FAFAFA] -skew-x-12 translate-x-1/4 hidden lg:block" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-red/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Decorative Icons (Subtle) */}
      <div className="absolute top-[15%] left-[5%] text-brand-red/10 animate-float opacity-50 hidden md:block">
        <Star size={48} fill="currentColor" />
      </div>
      <div className="absolute bottom-[20%] left-[45%] text-brand-orange/10 animate-float opacity-50 delay-700 hidden md:block">
        <Zap size={32} fill="currentColor" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-16 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Content (Text & Form) */}
          <div className="lg:col-span-7 space-y-10 animate-slide-up z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-brand-bg border border-brand-border rounded-2xl px-4 py-2 shadow-soft group hover:border-brand-red/30 transition-all cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
                <span className="text-brand-text text-[9px] font-bold uppercase tracking-[0.2em]">The Future of Drive-Thru</span>
              </div>

              <div className="relative">
                <h1 className="text-4xl md:text-6xl lg:text-[6.5rem] font-bold text-brand-text leading-[0.9] tracking-tighter mix-blend-multiply">
                  Satisfy Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-orange relative">
                    Cravings.
                    <div className="absolute -bottom-1 left-0 w-full h-2 bg-brand-red/5 -rotate-1 -z-10" />
                  </span>
                </h1>
              </div>

              <div className="flex flex-col gap-4 max-w-lg">
                <p className="text-brand-muted text-sm md:text-base leading-relaxed font-medium">
                  Experience the pinnacle of drive-thru excellence. Fast, fresh, and exceptionally delicious—crafted to satisfy your cravings instantly.
                </p>

                {activePromo ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gradient-to-r from-brand-orange/10 to-brand-red/5 border border-brand-orange/20 px-5 py-3 rounded-2xl shadow-soft hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">🎉</span>
                      </div>
                      <p className="text-sm font-medium text-brand-text leading-snug">
                        <span className="text-brand-orange font-bold">Great news!</span> Use code <span className="inline-block bg-white text-brand-red font-bold px-2.5 py-1 rounded-lg shadow-sm border border-brand-border mx-1">{activePromo.code}</span> for an instant <span className="font-bold text-brand-red">{activePromo.discount}% OFF</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('savedCoupon', activePromo.code);
                        alert(`Coupon ${activePromo.code} applied! It will be automatically used at checkout.`);
                      }}
                      className="whitespace-nowrap bg-[#f06d2e] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      Apply Coupon
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-red/5 to-brand-orange/5 border border-brand-red/10 px-5 py-3 rounded-2xl shadow-soft hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">🎁</span>
                    </div>
                    <p className="text-sm font-medium text-brand-text leading-snug">
                      <span className="font-bold text-brand-red">Craving a deal?</span> Don&apos;t forget to check for <span className="font-bold underline decoration-brand-orange/50 underline-offset-4">exclusive coupons</span> to grab our legendary specials!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a
                href="https://drive-thrueats.online/dte-app.apk"
                className="group flex items-center gap-3 text-brand-text hover:text-brand-red transition-all bg-white border border-brand-border px-4 py-2 rounded-2xl shadow-premium hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-bg border-2 border-brand-border flex items-center justify-center group-hover:border-brand-red group-hover:bg-brand-red group-hover:text-white group-hover:-rotate-6 transition-all shadow-soft">
                  <Play size={16} className="fill-current ml-1" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest leading-tight">Get the App</p>
                  <p className="text-xs font-bold uppercase tracking-tight">Android APK</p>
                </div>
              </a>
            </div>

            <div className="glass p-2 md:p-2 rounded-[2rem] border-white shadow-premium max-w-2xl group flex flex-col md:flex-row items-stretch gap-2 transition-transform hover:scale-[1.01]">
              <div className="flex bg-brand-bg p-1 rounded-2xl gap-1 shrink-0">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${orderType === 'pickup' ? 'bg-white text-brand-red shadow-premium' : 'text-brand-muted hover:text-brand-text'
                    }`}
                >
                  <Package size={14} /> Pickup
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${orderType === 'delivery' ? 'bg-white text-brand-red shadow-premium' : 'text-brand-muted hover:text-brand-text'
                    }`}
                >
                  <MapPin size={14} /> Delivery
                </button>
              </div>

              <div className="flex-1 relative flex items-center min-h-[50px]">
                {orderType === 'delivery' ? (
                  <div className="flex-1 relative animate-fade-in group/input h-full flex items-center">
                    <MapPin size={16} className="absolute left-5 text-brand-red transition-transform group-focus-within/input:scale-110" />
                    <input
                      type="text"
                      placeholder="Enter delivery address..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full h-full bg-transparent border-none pl-12 pr-6 py-3 text-brand-text placeholder-brand-muted focus:outline-none font-bold text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex-1 px-5 animate-fade-in flex items-center" />
                )}

                <button
                  onClick={() => {
                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-brand-red hover:bg-red-700 text-white w-12 md:w-auto md:px-6 h-12 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/25 shrink-0 m-1 group/btn"
                >
                  <span className="hidden md:block font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Order Now</span>
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Content (Visuals) */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-red/20 to-brand-orange/10 rounded-full blur-[100px] scale-90 animate-pulse pointer-events-none" />

            <div className="relative z-10">
              {/* Floating Badges */}
              <div className="absolute top-0 -right-2 glass px-4 py-3 rounded-2xl shadow-premium animate-bounce-soft z-20 border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-orange to-brand-red rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-brand-muted uppercase tracking-wider">Fast Delivery</p>
                    <p className="text-[10px] font-bold text-brand-text">Under 20 Mins</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 -left-4 glass px-4 py-3 rounded-2xl shadow-premium animate-float z-20 delay-500 border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-brand-muted uppercase tracking-wider">Top Rated</p>
                    <p className="text-[10px] font-bold text-brand-text">100% Verified</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-brand-red/5 rounded-full scale-110 -rotate-6 animate-pulse" />
                <img
                  src="https://drive-thrueats.online/combo-img.png"
                  alt="Delicious Burger Combo"
                  className="relative w-[110%] -ml-[5%] object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,0.15)] transition-all duration-1000 group-hover:scale-105 group-hover:-rotate-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80';
                  }}
                />
              </div>

              {/* Price Tag Overlay */}
              <div className="absolute top-1/2 -right-4 lg:-right-8 translate-y-[-50%] bg-brand-text text-white p-5 rounded-[2rem] shadow-premium rotate-12 group-hover:rotate-0 transition-all duration-500">
                <p className="text-[8px] font-bold text-brand-orange uppercase tracking-widest text-center mb-0.5">Value Meal</p>
                <div className="flex items-baseline gap-0.5 justify-center">
                  <span className="text-xs font-bold opacity-70 leading-none">₹</span>
                  <span className="text-3xl font-bold tracking-tighter leading-none">1299</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
