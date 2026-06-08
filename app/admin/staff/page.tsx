'use client';
import { useState, useEffect } from 'react';
import { UserPlus, UserCircle, Briefcase, Mail, Phone, Trash2, ShieldCheck, Truck, ChefHat, Edit as EditIcon } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Staff Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Kitchen Staff');
  const [pin, setPin] = useState('1234');

  const [editingStaffSid, setEditingStaffSid] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStaff(data);
      });
  }, []);

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setRole('Kitchen Staff'); setPin('1234');
    setShowAddForm(false);
    setEditingStaffSid(null);
  }

  const saveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    
    if (editingStaffSid) {
      // UPDATE Mode
      fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sid: editingStaffSid, 
          updates: { name, email, phone, role, pin } 
        })
      }).then(() => {
        fetch('/api/staff').then(res => res.json()).then(data => setStaff(data));
        resetForm();
      });
    } else {
      // CREATE Mode
      const sid = 'ST-' + Math.floor(100 + Math.random() * 900);
      fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sid, name, email, phone, role, pin })
      }).then(() => {
        fetch('/api/staff').then(res => res.json()).then(data => setStaff(data));
        resetForm();
      });
    }
  };

  const startEdit = (s: any) => {
    setName(s.name);
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setRole(s.role);
    setPin(s.pin || '1234');
    setEditingStaffSid(s.sid);
    setShowAddForm(true);
  };

  const removeStaff = (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    .then(() => {
      setStaff(staff.filter(s => s.sid !== id));
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#dee2e6]">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Staff Management</h1>
          <p className="text-[#6c757d] font-medium mt-1">Manage kitchen staff, delivery drivers, and managers.</p>
        </div>
        <div className="flex gap-3">
          <a href="/chef" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md">
            <ChefHat size={18} /> Chef Portal
          </a>
          <a href="/waiter" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md">
            <UserCircle size={18} /> Waiter Portal
          </a>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-brand-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <UserPlus size={20} /> Add Staff
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={saveStaff} className="bg-white p-6 rounded-2xl shadow-sm border border-[#dee2e6] grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3 flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#212529]">{editingStaffSid ? 'Update' : 'Add New'} Team Member</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 font-bold text-sm">Cancel</button>
          </div>
          <div className="md:col-span-2 lg:col-span-3"><hr className="mb-2" /></div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Full Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm font-bold">
              <option>Kitchen Staff</option>
              <option>Manager</option>
              <option>Delivery Driver</option>
              <option>Waiter</option>
              <option>Counter Staff</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Login PIN (4 Digits)</label>
            <input required type="text" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm font-bold" placeholder="1234" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Email (Optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" placeholder="employee@example.com" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#6c757d] mb-1 block">Phone Number</label>
            <input 
              type="tel" 
              value={phone} 
              maxLength={11}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} 
              className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" 
              placeholder="e.g. 03001234567" 
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 mt-2">
            <button type="submit" className="bg-brand-red text-white px-8 py-2.5 rounded-lg font-bold">
              {editingStaffSid ? 'Update Team Member' : 'Save Member'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#dee2e6] text-xs font-bold text-gray-500 uppercase tracking-widest">
                <th className="py-4 px-6">Staff Member</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6">Login PIN</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6]">
              {(Array.isArray(staff) ? staff : []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#6c757d] bg-[#FAFAFC] border border-[#dee2e6]">
                        {s.role === 'Manager' ? <ShieldCheck size={20} /> :
                          s.role === 'Kitchen Staff' ? <ChefHat size={20} /> : <UserCircle size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#212529]">{s.name}</h4>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.sid || s.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200/50">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1 text-xs text-[#212529] font-medium">
                      {s.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" /> {s.phone}</div>}
                      {s.email && <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" /> {s.email}</div>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm bg-gray-100 px-2.5 py-1 rounded-md text-gray-600 font-bold tracking-widest">{s.pin || '1234'}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(s)} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all border border-gray-100" title="Edit Staff">
                        <EditIcon size={16} />
                      </button>
                      <button onClick={() => removeStaff(s.sid)} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100" title="Delete Staff">
                        <Trash2 size={16} />
                      </button>
                    </div>
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
