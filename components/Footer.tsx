'use client';

import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#111] text-white pt-16 pb-8 px-6 relative mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Left Side: Contact Info */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              <span className="font-bold">Location:</span> Rehmani Technologies Building, By pass Road Handwara - Kashmir
            </p>
            <p className="text-sm font-medium">
              <span className="font-bold">Email:</span> <a href="mailto:helpdesk@drive-thrueats.online" className="hover:text-brand-red transition-colors">helpdesk@drive-thrueats.online</a>
            </p>
            <p className="text-sm font-medium">
              <span className="font-bold">Phone#:</span> 01955295310 / 01955313018
            </p>
            <p className="text-sm font-medium">
              <span className="font-bold">WhatsApp#:</span> <a href="https://wa.me/917889683368" target="_blank" className="hover:text-green-400 transition-colors">+917889683368</a>
            </p>
            
            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm font-bold">Follow us:</span>
              <div className="flex items-center gap-3">
                <a href="https://web.facebook.com/profile.php?id=61566862304889&_rdc=1&_rdr#" target="_blank" className="hover:text-brand-red transition-all">
                  <div className="w-8 h-8 flex items-center justify-center border border-white/20 rounded hover:border-brand-red">
                    <Facebook size={18} />
                  </div>
                </a>
                <a href="https://www.instagram.com/drivethru.eats/?igsh=M21tc3R5eDIzcXU4" target="_blank" className="hover:text-brand-red transition-all">
                  <div className="w-8 h-8 flex items-center justify-center border border-white/20 rounded hover:border-brand-red">
                    <Instagram size={18} />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10 w-full mb-8" />

        {/* Bottom Section */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-white/60 font-medium">
            All rights Reserved © Drive Thru Eats, 2024
          </p>
          <p className="text-[11px] text-white/40">
            Powered by <span className="text-white/60 font-bold">AFKAR AL-MUSTAQBIL Technologies</span>
          </p>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/917889683368" 
        target="_blank" 
        className="fixed bottom-10 right-10 z-[100] group"
      >
        <div className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce">
          <svg viewBox="0 0 34 34" className="w-8 h-8 fill-current" aria-hidden="true">
            <path d="M16.75 0C7.5 0 0 7.5 0 16.75c0 2.95.77 5.83 2.22 8.37L0 33.5l8.6-2.2a16.7 16.7 0 0 0 8.15 2.1h.01C26 33.4 33.5 25.9 33.5 16.75S26 0 16.75 0zm9.77 23.63c-.4 1.1-2.35 2.09-3.24 2.22-.83.12-1.88.18-3.03-.19-.7-.22-1.59-.52-2.75-1.02-4.84-2.09-7.99-6.97-8.23-7.29-.23-.32-1.97-2.62-1.97-5 0-2.38 1.24-3.55 1.68-4.04.44-.5.96-.62 1.29-.62.32 0 .65 0 .93.01.3.02.7-.11 1.09.84.4.95 1.35 3.29 1.47 3.52.12.23.2.5.04.82-.16.32-.24.51-.48.78-.23.27-.49.6-.7.81-.23.23-.47.48-.2.93.28.46 1.23 2.03 2.64 3.29 1.81 1.62 3.33 2.12 3.8 2.35.46.23.73.2 1-.12.27-.32 1.17-1.36 1.48-1.83.31-.47.62-.39 1.05-.23.43.16 2.72 1.28 3.18 1.52.46.23.77.35.89.54.12.2.12 1.13-.28 2.23z" />
          </svg>
          
          {/* Tooltip */}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-brand-text px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
            Chat with us!
          </span>
        </div>
      </a>
    </footer>
  );
}
