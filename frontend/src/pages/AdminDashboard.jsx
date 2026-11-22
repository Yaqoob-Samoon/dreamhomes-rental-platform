import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, Home, ShieldBan, CheckCircle, XCircle, Loader2, UserCheck, Clock, ShieldAlert, LayoutDashboard } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties'); 
  const [users, setUsers] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else {
        const res = await api.get('/admin/properties/pending');
        setPendingProperties(res.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied. You must be a Super Admin to view this page.');
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !u.is_blocked } : u));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user status.");
    }
  };

  const handlePropertyAction = async (propertyId, action) => {
    try {
      await api.put(`/admin/properties/${propertyId}/status`, { status: action });
      setPendingProperties(pendingProperties.filter(p => p.id !== propertyId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to moderate property.");
    }
  };

  const roleBadgeClass = (role) =>
    role === 'ADMIN' ? 'bg-[#1B1B18] text-white' :
    role === 'LANDLORD' ? 'bg-[#FAF8F4] text-[#3F6652] border border-[#E7E2D9]' :
    'bg-[#FAF8F4] text-[#736E60] border border-[#E7E2D9]';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-slate-900 bg-white min-h-[85vh]">
      <div className="mb-8 pb-6 border-b border-[#E7E2D9] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1B18] tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#1B1B18] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-white" strokeWidth={2} />
            </span>
            Admin Command Center
          </h1>
          <p className="text-[#736E60] mt-2 text-sm">Manage users and moderate property listings to maintain platform quality.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 font-medium text-sm flex items-center gap-3">
          <ShieldBan className="w-5 h-5 shrink-0" /> {error}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="inline-flex items-center gap-1 bg-[#FAF8F4] p-1.5 rounded-xl border border-[#E7E2D9] mb-8">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${activeTab === 'properties' ? 'bg-white text-[#1B1B18] shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Pending Reviews
              {pendingProperties.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'properties' ? 'bg-[#1B1B18] text-white' : 'bg-[#E7E2D9] text-[#736E60]'}`}>{pendingProperties.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${activeTab === 'users' ? 'bg-white text-[#1B1B18] shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}
            >
              <Users className="w-4 h-4" /> User Management
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B1B18]" />
            </div>
          ) : activeTab === 'properties' ? (
            pendingProperties.length === 0 ? (
              <div className="text-center py-24 bg-[#FAF8F4] rounded-3xl border border-[#E7E2D9] shadow-sm">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 border border-[#E7E2D9]">
                  <CheckCircle className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-[#1B1B18] mb-1">All Caught Up!</h3>
                <p className="text-[#736E60] text-sm">There are no pending properties requiring moderation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingProperties.map(property => (
                  <div key={property.id} className="bg-white border border-[#E7E2D9]/80 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-300">
                    <div className="p-5 border-b border-[#E7E2D9]/60 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-[#1B1B18] mb-1 truncate">{property.title}</h3>
                        <p className="text-xs text-[#736E60] truncate">{property.location}, {property.city}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> PENDING REVIEW
                      </span>
                    </div>
                    <div className="p-5 flex gap-3 bg-[#FAF8F4]">
                      <button 
                        onClick={() => handlePropertyAction(property.id, 'PUBLISHED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm flex justify-center items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Publish
                      </button>
                      <button 
                        onClick={() => handlePropertyAction(property.id, 'REJECTED')}
                        className="flex-1 bg-white border border-[#E7E2D9] text-red-600 hover:bg-red-50 hover:border-red-200 py-2.5 rounded-xl font-medium text-sm flex justify-center items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-white border border-[#E7E2D9] rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E7E2D9]">
                  <thead className="bg-[#FAF8F4]">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#8C8676] uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#8C8676] uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#8C8676] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#8C8676] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-[#8C8676] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E2D9]">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1B1B18] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {(user.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-[#1B1B18] text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#736E60] text-sm">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_blocked ? (
                            <span className="text-red-600 flex items-center gap-1.5 text-xs font-semibold"><ShieldBan className="w-3.5 h-3.5" /> Blocked</span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1.5 text-xs font-semibold"><UserCheck className="w-3.5 h-3.5" /> Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleBlock(user.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${user.is_blocked ? 'bg-[#FAF8F4] border border-[#E7E2D9] text-[#1B1B18] hover:bg-slate-50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                            >
                              {user.is_blocked ? 'Unblock' : 'Block User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;