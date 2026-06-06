export type Table = {
  id: string;
  number: number;
  type: 'window' | 'regular' | 'vip';
  seats: number;
  status: 'available' | 'booked';
};

export const tables: Table[] = [
  // Window Seats (2-seater)
  { id: 't1', number: 1, type: 'window', seats: 2, status: 'available' },
  { id: 't2', number: 2, type: 'window', seats: 2, status: 'available' },
  { id: 't3', number: 3, type: 'window', seats: 2, status: 'available' },
  { id: 't4', number: 4, type: 'window', seats: 2, status: 'available' },
  
  // Regular (4-seater)
  { id: 't5', number: 5, type: 'regular', seats: 4, status: 'available' },
  { id: 't6', number: 6, type: 'regular', seats: 4, status: 'available' },
  { id: 't7', number: 7, type: 'regular', seats: 4, status: 'available' },
  { id: 't8', number: 8, type: 'regular', seats: 4, status: 'available' },

  // VIP (6-seater)
  { id: 't9', number: 9, type: 'vip', seats: 6, status: 'available' },
  { id: 't10', number: 10, type: 'vip', seats: 6, status: 'available' },
  { id: 't11', number: 11, type: 'vip', seats: 6, status: 'available' },
  { id: 't12', number: 12, type: 'vip', seats: 6, status: 'available' },
];
