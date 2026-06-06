'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function StatusOverlay() {
  const [settings, setSettings] = useState<any>(null);
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) return;
          setSettings(data);
          
          if (!data.isOpen) {
            setIsCurrentlyOpen(false);
            return;
          }

          if (!data.openTime || !data.closeTime) {
            setIsCurrentlyOpen(true); 
            return;
          }

          // Auto mode check (Local time)
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          const [openH, openM] = data.openTime.split(':').map(Number);
          const [closeH, closeM] = data.closeTime.split(':').map(Number);
          
          const openTotal = openH * 60 + openM;
          const closeTotal = closeH * 60 + closeM;

          // Handle overnight cases (e.g. 21:00 to 02:00)
          if (openTotal < closeTotal) {
            if (currentTime >= openTotal && currentTime < closeTotal) {
              setIsCurrentlyOpen(true);
            } else {
              setIsCurrentlyOpen(false);
            }
          } else {
            // Overnight window
            if (currentTime >= openTotal || currentTime < closeTotal) {
              setIsCurrentlyOpen(true);
            } else {
              setIsCurrentlyOpen(false);
            }
          }
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (isCurrentlyOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-brand-text/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-premium relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-brand-red/10 rounded-[2.5rem] flex items-center justify-center text-brand-red mx-auto mb-6 ring-8 ring-brand-red/5 animate-pulse">
            <Clock size={48} strokeWidth={2.5} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight uppercase">
            We&apos;re Currently <br />
            <span className="text-brand-red underline decoration-brand-red/20 underline-offset-8">Closed</span>
          </h2>
          
          <p className="text-brand-muted font-medium leading-relaxed text-sm md:text-base">
            Sorry jani! Our kitchen is closed right now. We&apos;ll be back online to take your orders soon.
          </p>

          <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Opens At</p>
              <p className="text-xl font-bold text-brand-text">{settings?.openTime || '--:--'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Closes At</p>
              <p className="text-xl font-bold text-brand-text">{settings?.closeTime || '--:--'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-8">
            <p className="text-[10px] font-bold text-brand-red uppercase tracking-[0.2em] animate-bounce">
              Directly Contact Us for Queries
            </p>
            <a 
              href="https://wa.me/917889683368" 
              className="bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-all"
            >
              CHAT ON WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
