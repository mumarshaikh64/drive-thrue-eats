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
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#FAFAFC] border border-[#dee2e6] rounded-lg px-4 py-2.5 text-sm" placeholder="+91 123456789" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 mt-2">
            <button type="submit" className="bg-brand-red text-white px-8 py-2.5 rounded-lg font-bold">
              {editingStaffSid ? 'Update Team Member' : 'Save Member'}
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(staff) ? staff : []).map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] p-6 relative group overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(s)} className="text-blue-100 hover:text-blue-500">
                <EditIcon size={20} />
              </button>
              <button onClick={() => removeStaff(s.sid)} className="text-red-100 hover:text-red-500">
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${s.role === 'Manager' ? 'bg-blue-500' :
                  s.role === 'Kitchen Staff' ? 'bg-brand-orange' : 
                  s.role === 'Waiter' ? 'bg-purple-500' :
                  s.role === 'Counter Staff' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                {s.role === 'Manager' ? <ShieldCheck size={28} /> :
                  s.role === 'Kitchen Staff' ? <ChefHat size={28} /> : 
                  s.role === 'Waiter' ? <UserCircle size={28} /> :
                  s.role === 'Counter Staff' ? <UserCircle size={28} /> : <Truck size={28} />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#212529] leading-tight">{s.name}</h3>
                <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">{s.sid || s.id}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#212529] font-medium bg-[#FAFAFC] p-2 rounded-lg">
                <Briefcase size={16} className="text-[#6c757d]" />
                {s.role}
              </div>
              {(s.phone || s.email) && (
                <div className="flex flex-col gap-2 text-sm text-[#212529] font-medium bg-[#FAFAFC] p-3 rounded-lg">
                  {s.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-[#6c757d]" /> {s.phone}</div>}
                  {s.email && <div className="flex items-center gap-3"><Mail size={16} className="text-[#6c757d]" /> {s.email}</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
