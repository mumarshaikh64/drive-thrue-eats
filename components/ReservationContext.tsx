'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export type Reservation = {
  id: string;
  tableId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
};

type ReservationContextType = {
  reservations: Reservation[];
  addReservation: (res: Reservation) => void;
  cancelReservation: (id: string) => void;
};

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('dte_reservations');
    if (stored) {
      try {
        setReservations(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const addReservation = (res: Reservation) => {
    const newRes = [...reservations, res];
    setReservations(newRes);
    localStorage.setItem('dte_reservations', JSON.stringify(newRes));
  };

  const cancelReservation = (id: string) => {
    const newRes = reservations.filter(r => r.id !== id);
    setReservations(newRes);
    localStorage.setItem('dte_reservations', JSON.stringify(newRes));
  };

  return (
    <ReservationContext.Provider value={{ reservations, addReservation, cancelReservation }}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}
