import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'project_db.json');

// Ensure the directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initial structure
const initialData = {
  orders: [],
  staff: [
    { id: 'ST-001', name: 'John Doe', email: 'john@drivethru.com', phone: '1234567890', role: 'Kitchen Staff' },
    { id: 'ST-002', name: 'Alina Smith', email: 'alina@drivethru.com', phone: '0987654321', role: 'Manager' },
    { id: 'ST-003', name: 'Bob Delivery', email: 'bob@drivethru.com', phone: '1122334455', role: 'Delivery Driver' },
    { id: 'ST-004', name: 'Sam Waiter', email: 'sam@drivethru.com', phone: '9988776655', role: 'Waiter' }
  ],
  tables: [
     { id: 't1', number: 1, seats: 2, type: 'window', status: 'available' },
     { id: 't2', number: 2, seats: 4, type: 'regular', status: 'available' },
     { id: 't3', number: 3, seats: 4, type: 'regular', status: 'available' },
     { id: 't4', number: 4, seats: 6, type: 'vip', status: 'available' }
  ],
  reservations: []
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

export function getDb() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

export function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
