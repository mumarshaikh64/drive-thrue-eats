'use client';
import Link from 'next/link';
import { ShoppingCart, Phone, Menu, X, LogOut, Heart, User, BookOpen } from 'lucide-react';
import { useCart } from './CartContext';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRestaurantClosed, setIsRestaurantClosed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) return;
          setIsRestaurantClosed(data.isOpen === false);
        })
        .catch(error => console.error('Failed to fetch settings:', error));
    };

    checkStatus();
    const statusInterval = setInterval(checkStatus, 30000);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbCategories(data);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <nav 
        style={{ top: isRestaurantClosed ? '46px' : '0' }}
        className={`fixed left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        } ${isRestaurantClosed ? 'mt-[10px]' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`glass rounded-2xl transition-all duration-300 border-white/40 shadow-premium ${
            scrolled ? 'bg-white/90 px-4' : 'bg-white/70 px-6'
          } flex items-center justify-between h-16 lg:h-20`}>
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img 
                src="https://drive-thrueats.online/logo.png" 
                alt="Logo" 
                className="h-10 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Menu Categories Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="text-sm font-bold text-brand-text hover:text-brand-red transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-red">
                    <Menu size={14} />
                  </div>
                  Menu Category <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Box */}
                <div 
                  className={`absolute top-full left-0 mt-4 w-64 bg-white rounded-3xl p-4 shadow-premium border border-brand-border transition-all duration-300 origin-top ${
                    dropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {dbCategories.map(cat => (
                      <Link 
                        key={cat.id} 
                        href={`/#${cat.id}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center p-3 rounded-2xl hover:bg-brand-bg hover:text-brand-red transition-all w-full text-brand-text group"
                      >
                        <span className="font-bold text-sm tracking-tight">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/dining" className="text-sm font-bold text-brand-text hover:text-brand-red transition-all flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-red">
                  <BookOpen size={14} />
                </div>
                Book Table
              </Link>
              
              <a href="#footer" className="flex items-center gap-2 text-brand-text hover:text-brand-red transition-colors text-sm font-bold">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-red">
                  <Phone size={14} fill="currentColor" />
                </div>
                Support
              </a>

              <div className="h-8 w-px bg-brand-border mx-2" />

              <div className="flex items-center gap-4">


                <Link href="/cart" className="relative group flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-text group-hover:text-brand-red transition-colors">Cart</span>
                  <div className={`h-12 rounded-2xl bg-brand-red text-white flex items-center justify-center group-hover:bg-brand-text shadow-premium group-hover:scale-110 transition-all duration-300 ${totalItems > 0 ? 'px-4 gap-2' : 'w-12'}`}>
                    <ShoppingCart size={22} />
                    {totalItems > 0 && (
                      <span className="text-sm font-bold text-white animate-bounce-soft">
                        {totalItems}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-4">
              <Link href="/cart" className={`h-10 rounded-xl bg-brand-red flex items-center justify-center text-white shadow-soft hover:bg-brand-text transition-all duration-300 ${totalItems > 0 ? 'px-3 gap-1.5' : 'w-10'}`}>
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="text-xs font-bold text-white animate-bounce-soft">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setMobileOpen(!mobileOpen)} 
                className="w-10 h-10 rounded-xl bg-brand-text text-white flex items-center justify-center shadow-soft"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 animate-slide-up">
            <div className="glass rounded-3xl overflow-hidden shadow-premium border-white/50">
              <div className="p-6 space-y-6">


                <div className="grid grid-cols-1 gap-2">
                  <Link href="/dining" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-4 hover:bg-brand-bg rounded-2xl transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen size={18} />
                    </div>
                    <span className="font-bold text-brand-text">Book Dining Table</span>
                  </Link>
                  <a href="#footer" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-4 hover:bg-brand-bg rounded-2xl transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone size={18} />
                    </div>
                    <span className="font-bold text-brand-text">Call for Support</span>
                  </a>
                </div>

                {false && (
                <div className="space-y-4 pt-4 border-t border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] pl-2">Menu Categories</p>
                  <div className="grid grid-cols-2 gap-3">
                    {dbCategories.map(cat => (
                      <a
                        key={cat.id}
                        href={`/#${cat.id}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center p-4 bg-brand-bg rounded-2xl hover:bg-white hover:shadow-soft transition-all"
                      >
                        <span className="text-xs font-bold text-brand-text text-center">{cat.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer removed as nav is now cleaner without fixed bar background */}
    </>
  );
}
