'use client';
import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, Search, Filter } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-body text-brand-text tracking-tight">Registered Customers</h1>
          <p className="text-brand-muted font-medium">Manage and monitor customer accounts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand-red/5 w-64 font-medium"
            />
          </div>
          <button className="bg-white border border-brand-border p-3 rounded-xl text-brand-text hover:bg-gray-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#dee2e6] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#6c757d] text-sm tracking-wider uppercase">
                <th className="p-6 font-bold border-b border-[#dee2e6]">Customer Info</th>
                <th className="p-6 font-bold border-b border-[#dee2e6]">Registered On</th>
                <th className="p-6 font-bold border-b border-[#dee2e6]">Status</th>
                <th className="p-6 font-bold border-b border-[#dee2e6]">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-brand-muted font-bold uppercase tracking-widest text-xs">
                      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
                      Loading Database...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-brand-muted py-20">
                    <div className="flex flex-col items-center gap-4">
                      <Users size={40} className="opacity-20" />
                      <p className="font-bold">No customers found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-6 border-b border-[#dee2e6]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-red font-bold text-lg group-hover:scale-110 transition-transform shadow-soft">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold font-body text-brand-text uppercase tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-brand-muted font-bold">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 border-b border-[#dee2e6]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Calendar size={14} />
                        </div>
                        <span className="font-bold text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-6 border-b border-[#dee2e6]">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="p-6 border-b border-[#dee2e6]">
                      <button className="text-xs font-bold text-brand-red hover:underline uppercase tracking-widest">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
