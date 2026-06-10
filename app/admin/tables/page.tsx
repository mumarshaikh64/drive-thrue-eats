'use client';
import { useState, useEffect } from 'react';
import { tables as defaultTables, Table } from '@/data/tables';
import { LayoutGrid, Users, Clock, CheckCircle, Printer, Plus, Edit, Trash2 } from 'lucide-react';

export default function TablesPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Table State
  const [newNumber, setNewNumber] = useState('');
  const [newSeats, setNewSeats] = useState('4');
  const [newType, setNewType] = useState('regular');

  // Edit Table State
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editSeats, setEditSeats] = useState('4');
  const [editType, setEditType] = useState('regular');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [resRes, tablesRes, ordersRes] = await Promise.all([
          fetch('/api/reservations'),
          fetch('/api/tables'),
          fetch('/api/orders')
        ]);

        const [resData, tablesData, ordersData] = await Promise.all([
          resRes.json(),
          tablesRes.json(),
          ordersRes.json()
        ]);

        setReservations(resData);
        setTablesList(tablesData);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      loadAllData();
    }, 30000);
    return () => clearInterval(timer);
  }, []);


  const addTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber) return;

    const newTableData = {
      number: parseInt(newNumber),
      seats: parseInt(newSeats),
      type: newType
    };

    fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTableData)
    })
    .then(res => res.json())
    .then(data => {
      setTablesList([...tablesList, data].sort((a,b) => a.number - b.number));
      setShowAddForm(false);
      setNewNumber('');
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editNumber) return;

    const updatedData = {
      id: editingTable.id,
      number: parseInt(editNumber),
      seats: parseInt(editSeats),
      type: editType
    };

    fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
    .then(res => res.json())
    .then(data => {
      setTablesList(tablesList.map(t => t.id === editingTable.id ? data : t).sort((a,b) => a.number - b.number));
      setEditingTable(null);
    });
  };

  const deleteTable = (id: string, number: number) => {
    if (!confirm(`Are you sure you want to delete Table ${number}?`)) return;

    fetch('/api/tables', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setTablesList(tablesList.filter(t => t.id !== id));
      } else {
        alert('Failed to delete table');
      }
    });
  };

  const isTableOccupied = (table: Table) => {
    // Check active Dining Orders first
    const activeOrder = orders.find(o => 
      o.type === 'dining' && 
      o.tableNumber == table.number && 
      o.status !== 'Delivered'
    );
    if (activeOrder) {
      return { 
        name: activeOrder.customerName, 
        guests: 'Table Order', 
        time: activeOrder.timestamp.split('T')[1].substring(0,5), 
        date: activeOrder.timestamp.split('T')[0],
        isOrder: true,
        id: activeOrder.orderId || activeOrder.id,
        phone: activeOrder.phone,
        total: activeOrder.total,
        items: activeOrder.items
      };
    }

    // Check Reservations
    const todayStr = currentTime.toISOString().split('T')[0];
    const currentMs = currentTime.getTime();

    return reservations.find(r => {
      if (r.tableId !== table.id || r.date !== todayStr) return false;
      const resDate = new Date(`${r.date}T${r.time}`);
      const resMs = resDate.getTime();
      const endMs = resMs + (2 * 60 * 60 * 1000); 
      return currentMs >= resMs && currentMs < endMs;
    });
  };

  const getTimeLeft = (activeRes: any) => {
    if (!activeRes) return null;
    if (activeRes.isOrder) return 'BUSY'; 
    const endMs = new Date(`${activeRes.date}T${activeRes.time}`).getTime() + (2 * 60 * 60 * 1000);
    const diffMs = endMs - currentTime.getTime();
    if (diffMs <= 0) return '0m';
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins > 60) return `${Math.floor(diffMins/60)}h ${diffMins%60}m`;
    return `${diffMins}m`;
  };

  const printReceipt = (res: any, table: Table) => {
    const itemsTable = res.isOrder && Array.isArray(res.items) 
      ? res.items.map((it: any) => `
        <tr>
          <td style="padding: 2px 0;">${it.name} x ${it.quantity}</td>
          <td style="padding: 2px 0; text-align: right;">₹${it.price * it.quantity}</td>
        </tr>`).join('')
      : '<tr><td colspan="2" style="text-align:center; padding: 10px 0;">-- Pre-Booking Only --</td></tr>';

    const content = `
      <div style="width: 85mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; padding: 5px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 900;">DRIVE THRU EATS</h2>
          <p style="margin: 2px 0;">Main Road, Handwara</p>
          <p style="margin: 2px 0;">Mob: +91 9906XXXXXX</p>
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 10px;">
          <p style="margin: 2px 0;"><b>TABLE #${table.number}</b> (${table.type.toUpperCase()})</p>
          <p style="margin: 2px 0;">Date: ${res.date} | Time: ${res.time}</p>
          <p style="margin: 2px 0;">Ref: ${(res.id || 'N/A').toUpperCase()}</p>
        </div>

        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0;"><b>Customer:</b> ${res.name}</p>
          <p style="margin: 2px 0;"><b>Phone:</b> ${res.phone || 'N/A'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding-bottom: 5px;">Item</th>
            <th style="text-align: right; padding-bottom: 5px;">Price</th>
          </tr>
          ${itemsTable}
        </table>

        <div style="border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 10px; text-align: right;">
          <h3 style="margin: 0; font-size: 16px;">GRAND TOTAL: ₹${res.total || 0}</h3>
        </div>

        <div style="text-align: center; margin-top: 15px; font-size: 10px;">
          <p style="margin: 0; font-weight: bold;">THANK YOU FOR VISITING!</p>
          <p style="margin: 2px 0;">Follow us @drivethrueats</p>
          <p style="margin: 5px 0;">*** Software by Softgrid ***</p>
        </div>
      </div>
    `;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument!;
    doc.write(`
      <html>
        <head>
          <style>
            @media print {
              @page { 
                size: 85mm auto; 
                margin: 0; 
              }
              html, body {
                height: auto !important;
                min-height: 0 !important;
              }
              body { 
                margin: 0; 
                padding: 0; 
                width: 85mm !important;
              }
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: 85mm;
              font-family: monospace;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Tables Management</h1>
          <p className="text-[#6c757d] font-medium mt-1">Live overview of seating availability and reservations.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md"
        >
          <Plus size={20} /> Add New Table
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addTable} className="bg-white p-6 rounded-2xl shadow-sm border border-[#dee2e6] grid md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <h3 className="font-bold text-lg mb-2 text-[#212529]">Configure New Table</h3>
            <hr className="mb-4" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Table Number Identifier</label>
            <input required type="number" min="1" value={newNumber} onChange={e => setNewNumber(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" placeholder="13" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Capacity / Seats</label>
            <input required type="number" min="1" value={newSeats} onChange={e => setNewSeats(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Table Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm font-bold">
              <option value="window">Window Seat</option>
              <option value="regular">Regular</option>
              <option value="vip">VIP Lounge</option>
            </select>
          </div>
          <div className="md:col-span-3 mt-2">
            <button type="submit" className="bg-brand-red text-white px-8 py-2.5 rounded-lg font-bold">Save Table</button>
          </div>
        </form>
      )}

      {editingTable && (
        <form onSubmit={handleEditSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-[#dee2e6] grid md:grid-cols-3 gap-4">
          <div className="md:col-span-3 flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#212529]">Edit Table {editingTable.number}</h3>
            <button 
              type="button" 
              onClick={() => setEditingTable(null)} 
              className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
          <div className="md:col-span-3">
            <hr className="mb-2" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Table Number Identifier</label>
            <input required type="number" min="1" value={editNumber} onChange={e => setEditNumber(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" placeholder="13" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Capacity / Seats</label>
            <input required type="number" min="1" value={editSeats} onChange={e => setEditSeats(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Table Type</label>
            <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm font-bold">
              <option value="window">Window Seat</option>
              <option value="regular">Regular</option>
              <option value="vip">VIP Lounge</option>
            </select>
          </div>
          <div className="md:col-span-3 mt-2 flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">Update Table</button>
            <button type="button" onClick={() => setEditingTable(null)} className="bg-gray-100 hover:bg-gray-200 text-slate-600 px-8 py-2.5 rounded-lg font-bold transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#dee2e6] rounded-2xl shadow-sm overflow-hidden">
        {/* Key Indicators header */}
        <div className="p-6 border-b border-[#dee2e6] flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
          <h2 className="text-xl font-bold text-[#212529]">Live Tables Status</h2>
          <div className="flex gap-4 text-xs font-bold">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Available</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse"></span> Booked (2h Limit)</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[#6c757d] text-[10px] uppercase font-bold tracking-widest border-b border-[#dee2e6]">
                <th className="p-6">Table Info</th>
                <th className="p-6">Capacity</th>
                <th className="p-6">Status</th>
                <th className="p-6">Current Occupant / Booking</th>
                <th className="p-6">Time Left</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6]">
              {tablesList.map(table => {
                const activeRes = isTableOccupied(table);
                const isOccupied = !!activeRes;
                const timeLeft = getTimeLeft(activeRes);

                return (
                  <tr key={table.id} className={`hover:bg-gray-50/50 transition-colors ${isOccupied ? 'bg-red-50/20' : ''}`}>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
                          isOccupied ? 'bg-brand-red' : 'bg-green-500'
                        }`}>
                          <LayoutGrid size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#212529]">Table {table.number}</p>
                          <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">{table.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-sm text-[#212529]">{table.seats} Persons</span>
                    </td>
                    <td className="p-6">
                      {isOccupied ? (
                        <span className="px-3 py-1 bg-brand-red text-white text-xs font-bold rounded-full animate-pulse inline-block">Booked</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-max"><CheckCircle size={14}/>Free</span>
                      )}
                    </td>
                    <td className="p-6">
                      {isOccupied && activeRes ? (
                        <div>
                          <p className="text-sm font-bold text-[#212529]">{activeRes.name}</p>
                          <p className="text-xs text-[#6c757d]">({activeRes.guests} guests)</p>
                        </div>
                      ) : (
                        <span className="text-sm text-[#6c757d]">-</span>
                      )}
                    </td>
                    <td className="p-6">
                      {isOccupied ? (
                        <span className="font-mono text-sm font-bold text-brand-red">{timeLeft}</span>
                      ) : (
                        <span className="text-sm text-[#6c757d]">-</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {isOccupied && activeRes && (
                          <button 
                            onClick={() => printReceipt(activeRes, table)}
                            className="p-2 bg-brand-red hover:bg-red-700 text-white rounded-lg transition" 
                            title="Print Receipt"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingTable(table);
                            setEditNumber(String(table.number));
                            setEditSeats(String(table.seats));
                            setEditType(table.type);
                          }}
                          className="p-2 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition"
                          title="Edit Table"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTable(table.id, table.number)}
                          className="p-2 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition"
                          title="Delete Table"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Reservations List Section */}
      <div className="bg-white border border-[#dee2e6] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#dee2e6] flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#212529]">All Table Reservations</h2>
          <span className="bg-brand-red text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{reservations.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[#6c757d] text-[10px] uppercase font-bold tracking-widest border-b border-[#dee2e6]">
                <th className="p-6">Customer</th>
                <th className="p-6">Table</th>
                <th className="p-6">Date & Time</th>
                <th className="p-6">Guests</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6]">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#6c757d] font-bold">No reservations found in database.</td>
                </tr>
              ) : [...reservations].sort((a,b) => {
                const dateA = new Date(`${a.date || '2000-01-01'}T${a.time?.includes(' ') ? a.time : (a.time || '00:00')}`).getTime() || 0;
                const dateB = new Date(`${b.date || '2000-01-01'}T${b.time?.includes(' ') ? b.time : (b.time || '00:00')}`).getTime() || 0;
                return dateB - dateA;
              }).map(res => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-[#212529]">{res.name}</p>
                    <p className="text-xs text-[#6c757d]">{res.phone}</p>
                  </td>
                  <td className="p-6">
                    <div className="inline-flex items-center gap-2 bg-brand-bg px-3 py-1 rounded-lg border border-[#dee2e6]">
                      <span className="text-xs font-bold text-brand-red">Table {tablesList.find(t => t.id === res.tableId)?.number || res.id.substring(0,4)}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-[#212529]">{res.date}</p>
                    <p className="text-xs text-[#6c757d]">{res.time}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-bold text-[#212529]">{res.guests} Persons</span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => {
                        const table = tablesList.find(t => t.id === res.tableId);
                        if (table) printReceipt(res, table);
                      }}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-brand-red hover:text-white transition-all text-gray-500"
                    >
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
