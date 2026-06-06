'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, Clock, Phone, User, CheckCircle2, X, Map as MapIcon, Info } from 'lucide-react';
import { tables, Table } from '@/data/tables';
import { useReservation, Reservation } from '@/components/ReservationContext';

export default function DiningPage() {
  const { addReservation } = useReservation();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00 PM');
  const [guests, setGuests] = useState('2');
  
  const [toast, setToast] = useState('');
  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [dbReservations, setDbReservations] = useState<any[]>([]);

  useEffect(() => {
    const loadTablesAndRes = async () => {
      const resRes = await fetch('/api/reservations');
      const resData = await resRes.json();
      if (Array.isArray(resData)) setDbReservations(resData);

      const tRes = await fetch('/api/tables');
      const tData = await tRes.json();
      if (Array.isArray(tData)) {
        setTablesList(tData.sort((a: any, b: any) => a.number - b.number));
      }
    };

    loadTablesAndRes();
    const interval = setInterval(loadTablesAndRes, 30000);
    return () => clearInterval(interval);
  }, []);

  const isTableBooked = (tableId: string) => {
    if (!date) return false;
    return dbReservations.some(r => r.tableId === tableId && r.date === date && r.time === time);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (selectedTable && dbReservations.some(r => r.tableId === selectedTable.id && r.date === newDate && r.time === time)) {
      setToast(`Table ${selectedTable.number} is already booked for this date and time.`);
      setSelectedTable(null);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedTable && dbReservations.some(r => r.tableId === selectedTable.id && r.date === date && r.time === newTime)) {
      setToast(`Table ${selectedTable.number} is already booked for this date and time.`);
      setSelectedTable(null);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    // Double check on frontend
    const alreadyBooked = dbReservations.some(
      r => r.tableId === selectedTable.id && r.date === date && r.time === time
    );
    if (alreadyBooked) {
      setToast(`Table ${selectedTable.number} is already booked for this date and time. Please choose another spot.`);
      setSelectedTable(null);
      setTimeout(() => setToast(''), 4000);
      return;
    }

    const newRes: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      tableId: selectedTable.id,
      name,
      phone,
      date,
      time,
      guests: parseInt(guests)
    };

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes)
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errData = await response.json();
          throw new Error(errData.error || 'This slot is already taken');
        }
        throw new Error('Failed to save reservation');
      }

      const freshResRes = await fetch('/api/reservations');
      const freshResData = await freshResRes.json();
      if (Array.isArray(freshResData)) setDbReservations(freshResData);

      addReservation(newRes);
      setToast('Table booked successfully!');
      setSelectedTable(null);
      setName('');
      setPhone('');
      setDate('');
    } catch (error: any) {
      console.error(error);
      setToast(error.message || 'Failed to book table. Please try again.');
    }
    
    setTimeout(() => setToast(''), 3000);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-white py-12 lg:py-20 relative overflow-hidden">
      {/* Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pt-12 md:pt-16">
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center gap-2 text-brand-muted hover:text-brand-red transition-all font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-all">
                <ArrowLeft size={16} />
              </div>
              Back to Store
            </Link>
            <h1 className="text-4xl lg:text-7xl font-bold text-brand-text tracking-tighter">
              Reserve Your <br />
              <span className="text-brand-red">Perfect Spot.</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 pb-2 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
              <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-red" />
              <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">Booked</span>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-brand-text text-white px-8 py-4 rounded-2xl shadow-premium font-bold flex items-center gap-3 animate-slide-up z-[100] border border-white/10">
            <CheckCircle2 size={24} className="text-green-400" /> {toast}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-12 max-w-4xl mx-auto w-full space-y-12">
            
            {/* Table Selection */}
            <div className="glass rounded-[2.5rem] p-8 md:p-12 border-white shadow-premium">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-text">
                  <MapIcon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-text tracking-tight">Interactive Map</h2>
                  <p className="text-brand-muted text-sm font-medium">Click on a highlighted table to select it.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-8 bg-brand-bg/50 rounded-3xl border border-brand-border/50">
                {tablesList.map(table => {
                  const booked = isTableBooked(table.id);
                  const isSelected = selectedTable?.id === table.id;
                  
                  return (
                    <button
                      key={table.id}
                      disabled={booked}
                      onClick={() => setSelectedTable(table)}
                      className={`group relative h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-soft ${
                        booked 
                          ? 'bg-white/50 border-brand-border cursor-not-allowed grayscale' 
                          : isSelected
                            ? 'bg-brand-red border-brand-red text-white scale-105 shadow-premium-hover'
                            : 'bg-white border-white hover:border-brand-red/30 hover:shadow-lg'
                      }`}
                    >
                      <div className={`text-2xl font-bold tracking-tighter ${isSelected ? 'text-white' : 'text-brand-text'}`}>
                        T{table.number}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/80' : 'text-brand-muted'}`}>
                        <Users size={12} /> {table.seats} Seats
                      </div>
                      
                      {table.type === 'vip' && !isSelected && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-brand-accent text-brand-text text-[8px] font-bold uppercase tracking-widest">
                          VIP
                        </div>
                      )}
                      
                      {booked && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-3xl">
                          <X size={24} className="text-brand-red/30" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <div className={`glass rounded-[2.5rem] p-8 md:p-12 border-white shadow-premium transition-all duration-500 ${!selectedTable && 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-text">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-text tracking-tight">Booking Details</h2>
                  <p className="text-brand-muted text-sm font-medium">Tell us more about your visit.</p>
                </div>
              </div>

              <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 p-6 bg-brand-red/5 rounded-3xl border border-brand-red/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-red text-white flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-brand-red/10">
                      {selectedTable?.number || '?'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Selected Table</p>
                      <p className="text-lg font-bold text-brand-text leading-tight">
                        {selectedTable ? `${selectedTable.seats} Seats, ${selectedTable.type.toUpperCase()}` : 'No table selected'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2">Your Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-red" />
                    <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-12 pr-6 py-4 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-medium" placeholder="E.g. Elon Musk" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2">Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-red" />
                    <input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-12 pr-6 py-4 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-medium" placeholder="+91 ..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2">Reservation Date</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-red" />
                    <input type="date" required min={today} value={date} onChange={e=>handleDateChange(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-12 pr-6 py-4 text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2">Time</label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" />
                      <select value={time} onChange={e=>handleTimeChange(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-10 pr-4 py-4 text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-bold text-xs appearance-none">
                        {['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2">Guests</label>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" />
                      <select value={guests} onChange={e=>setGuests(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-10 pr-4 py-4 text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-bold text-xs appearance-none">
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <option key={n} value={n}>{n} {n===1?'Guest':'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 pt-4">
                  <button type="submit" className="w-full btn-primary py-5 text-lg shadow-premium">
                    Complete Reservation
                  </button>
                </div>
              </form>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
