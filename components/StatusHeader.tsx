'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function StatusHeader() {
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) return;
          setIsCurrentlyOpen(data.isOpen !== false);
          setSettings(data);
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (isCurrentlyOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[46px] bg-brand-red text-white py-2.5 px-4 shadow-xl flex items-center justify-center gap-3 z-[1001] border-b border-white/10">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping shrink-0" />
      <Clock size={14} className="shrink-0" />
      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-center">
        Restaurant is closed right now. We&apos;ll reopen at <span className="bg-white/20 px-2 py-0.5 rounded ml-1">{settings?.openTime || '09:00'}</span>
      </p>
    </div>
  );
}
