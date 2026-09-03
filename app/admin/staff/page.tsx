'use client';
import { useState, useEffect } from 'react';
import { 
  UserPlus, UserCircle, Briefcase, Mail, Phone, Trash2, 
  ShieldCheck, Truck, ChefHat, Edit as EditIcon, LogIn, 
  ExternalLink, KeyRound, Sparkles, ChevronDown 
} from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedQuickStaff, setSelectedQuickStaff] = useState<string>('');

  // New Staff Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Kitchen Staff');
  const [pin, setPin] = useState('1234');

  const [editingStaffSid, setEditingStaffSid] = useState<string | null>(null);

  const [mainSiteUrl, setMainSiteUrl] = useState('');

  useEffect(() => {
    if (window.location.hostname.startsWith('admin.')) {
      setMainSiteUrl(window.location.origin.replace('admin.', ''));
    }

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
  };

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

  const handleDirectLogin = (s: any, portalOverride?: 'auto' | 'waiter' | 'chef' | 'staff') => {
    if (!s) return;

    // Set local storage sessions on current origin
    try {
      localStorage.setItem('dte_staff_session', JSON.stringify(s));
      if (s.role === 'Waiter') localStorage.setItem('dte_waiter_session', JSON.stringify(s));
      if (s.role === 'Kitchen Staff' || s.role.toLowerCase().includes('chef') || s.role.toLowerCase().includes('kitchen')) {
        localStorage.setItem('dte_chef_session', JSON.stringify(s));
      }
    } catch (e) {
      console.error('Failed to set localStorage', e);
    }

    let targetPath = '/staff';
    const roleLower = (s.role || '').toLowerCase();

    if (portalOverride === 'waiter' || (!portalOverride && (s.role === 'Waiter' || roleLower.includes('waiter')))) {
      targetPath = '/waiter';
    } else if (portalOverride === 'chef' || (!portalOverride && (s.role === 'Kitchen Staff' || roleLower.includes('chef') || roleLower.includes('kitchen')))) {
      targetPath = '/chef';
    } else if (portalOverride === 'staff') {
      targetPath = '/staff';
    }

    const autoUrl = `${targetPath}?autoSid=${encodeURIComponent(s.sid)}`;
    window.open(autoUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-[#dee2e6] gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#212529]">Staff Management</h1>
          <p className="text-[#6c757d] font-medium mt-1">Manage staff members and perform direct instant login as any employee.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/chef" target="_blank" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md text-sm">
            <ChefHat size={18} /> Chef Portal
          </a>
          <a href="/waiter" target="_blank" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md text-sm">
            <UserCircle size={18} /> Waiter Portal
          </a>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-brand-red hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md text-sm"
          >
            <UserPlus size={18} /> Add Staff
          </button>
        </div>
      </div>

      {/* Quick Direct Login Widget */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              Admin Direct Staff Login
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                Instant Bypass
              </span>
            </h3>
            <p className="text-gray-400 text-sm">Select any staff member to directly access their portal without PIN entry.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedQuickStaff}
            onChange={(e) => setSelectedQuickStaff(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none w-full md:w-64"
          >
            <option value="">-- Select Staff Member --</option>
            {staff.map((s) => (
              <option key={s.sid || s.id} value={s.sid}>
                {s.name} ({s.role} - {s.sid})
              </option>
            ))}
          </select>

          <button
            disabled={!selectedQuickStaff}
            onClick={() => {
              const s = staff.find((item) => item.sid === selectedQuickStaff);
              if (s) handleDirectLogin(s);
            }}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg whitespace-nowrap text-sm"
          >
            <LogIn size={18} /> Direct Login
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

      {/* Staff Member Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(staff) ? staff : []).map(s => (
          <div key={s.id || s.sid} className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] p-6 relative group overflow-hidden flex flex-col justify-between">
            <div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(s)} title="Edit Staff" className="text-gray-400 hover:text-blue-600 p-1">
                  <EditIcon size={18} />
                </button>
                <button onClick={() => removeStaff(s.sid)} title="Remove Staff" className="text-gray-400 hover:text-red-600 p-1">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                    s.role === 'Manager' ? 'bg-blue-600' :
                    s.role === 'Kitchen Staff' ? 'bg-orange-500' : 
                    s.role === 'Waiter' ? 'bg-purple-600' :
                    s.role === 'Counter Staff' ? 'bg-yellow-500' : 'bg-green-600'
                  }`}>
                  {s.role === 'Manager' ? <ShieldCheck size={28} /> :
                    s.role === 'Kitchen Staff' ? <ChefHat size={28} /> : 
                    s.role === 'Waiter' ? <UserCircle size={28} /> :
                    s.role === 'Counter Staff' ? <UserCircle size={28} /> : <Truck size={28} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#212529] leading-tight">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">{s.sid || s.id}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <KeyRound size={10} /> PIN: {s.pin || '1234'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-3 text-sm text-[#212529] font-semibold bg-[#FAFAFC] p-2.5 rounded-lg border border-gray-100">
                  <Briefcase size={16} className="text-[#6c757d]" />
                  {s.role}
                </div>
                {(s.phone || s.email) && (
                  <div className="flex flex-col gap-1.5 text-xs text-[#212529] font-medium bg-[#FAFAFC] p-3 rounded-lg border border-gray-100">
                    {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-[#6c757d]" /> {s.phone}</div>}
                    {s.email && <div className="flex items-center gap-2"><Mail size={14} className="text-[#6c757d]" /> {s.email}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Login Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => handleDirectLogin(s)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
              >
                <LogIn size={16} /> Direct Login ({s.role === 'Waiter' ? 'Waiter Portal' : s.role === 'Kitchen Staff' ? 'Chef Portal' : 'Staff Portal'})
              </button>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 px-1">
                <span>Login to alternate:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDirectLogin(s, 'chef')}
                    className="hover:text-orange-600 font-semibold underline flex items-center gap-0.5"
                  >
                    Chef
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handleDirectLogin(s, 'waiter')}
                    className="hover:text-purple-600 font-semibold underline flex items-center gap-0.5"
                  >
                    Waiter
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handleDirectLogin(s, 'staff')}
                    className="hover:text-blue-600 font-semibold underline flex items-center gap-0.5"
                  >
                    Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
