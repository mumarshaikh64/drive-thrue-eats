'use client';
import { useState, useEffect } from 'react';
import { Power, Clock, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';

export default function ControlPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  const updateSettings = async (updates: any) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      // Refresh for live status
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-text tracking-tighter">Operational <span className="text-brand-red">Control.</span></h1>
            <p className="text-brand-muted font-medium mt-1">Manage manual overrides and automatic scheduling.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${settings?.isOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${settings?.isOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
            Live Status: {settings?.isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
          </div>
        </div>

        {settings && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Mode Selection */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-red shadow-soft">
                  <Settings2 size={20} />
                </div>
                <h2 className="font-bold text-brand-text tracking-tight text-lg">System Mode</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => updateSettings({ mode: 'auto' })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    settings.mode === 'auto' 
                      ? 'bg-brand-red border-brand-red text-white shadow-premium' 
                      : 'bg-white border-white text-brand-text hover:border-brand-red/20'
                  }`}
                >
                  <Clock size={24} />
                  <span className="font-bold text-xs uppercase tracking-widest">Automatic</span>
                </button>
                <button 
                  onClick={() => updateSettings({ mode: 'manual' })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    settings.mode === 'manual' 
                      ? 'bg-brand-text border-brand-text text-white shadow-premium' 
                      : 'bg-white border-white text-brand-text hover:border-brand-red/20'
                  }`}
                >
                  <Power size={24} />
                  <span className="font-bold text-xs uppercase tracking-widest">Manual</span>
                </button>
              </div>
            </div>

            {/* Config Area */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              {settings.mode === 'auto' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-brand-text tracking-tight text-lg">Schedule Settings</h2>
                    <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-3 py-1 rounded-full uppercase">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Auto Open</label>
                       <input 
                        type="time" 
                        value={settings.openTime} 
                        onChange={(e) => updateSettings({ openTime: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-red shadow-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Auto Close</label>
                       <input 
                        type="time" 
                        value={settings.closeTime} 
                        onChange={(e) => updateSettings({ closeTime: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-red shadow-sm transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-muted font-medium bg-white/50 p-3 rounded-xl border border-gray-100 italic">
                    Note: System will use your local server time to compare.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <h2 className="font-bold text-brand-text tracking-tight text-lg mb-2">Manual Override</h2>
                  <button 
                    onClick={() => updateSettings({ isOpen: !settings.manualStatus })}
                    className={`w-full py-6 rounded-2xl font-bold text-lg transition-all shadow-premium border-4 border-white ${
                      settings.manualStatus 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    RESTAURANT {settings.manualStatus ? 'ON' : 'OFF'}
                  </button>
                  <p className="text-center text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                    Timer is disabled in Manual mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-brand-bg/50 p-8 rounded-[2rem] border border-brand-border/50 text-center">
        <p className="text-sm font-bold text-brand-text mb-2">How it works?</p>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs mx-auto">1</div>
            <p className="text-[10px] text-brand-muted font-bold uppercase">Select Mode</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs mx-auto">2</div>
            <p className="text-[10px] text-brand-muted font-bold uppercase">Set Timing/Status</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs mx-auto">3</div>
            <p className="text-[10px] text-brand-muted font-bold uppercase">Live Everywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
}
