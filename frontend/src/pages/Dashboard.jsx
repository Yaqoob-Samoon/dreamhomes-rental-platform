import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { jwtDecode } from 'jwt-decode';
import { 
  Home, Edit, Trash2, Plus, Loader2, MapPin, 
  CheckCircle, XCircle, FileText, Clock, Users, Calendar, Building, Send, RotateCw
} from 'lucide-react';
import RecommendedProperties from '../components/RecommendedProperties';

const Dashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('properties');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
      
      if (decoded.role === 'TENANT') {
        setActiveTab('applications');
      }
      
      fetchDashboardData(decoded.role);
    } catch (err) {
      console.error("Invalid token", err);
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async (role) => {
    setLoading(true);
    setError('');
    try {
      if (role === 'LANDLORD') {
        const [propsRes, appsRes] = await Promise.all([
          api.get('/properties/me/managed'),
          api.get('/applications/managed')
        ]);
        setProperties(propsRes.data);
        setApplications(appsRes.data);
      } else if (role === 'TENANT') {
        const appsRes = await api.get('/applications/me');
        setApplications(appsRes.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      try {
        await api.delete(`/properties/${id}`);
        setProperties(properties.filter(p => p.id !== id));
      } catch (err) {
        alert("Failed to delete property.");
        console.error(err);
      }
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      const res = await api.put(`/properties/${id}/submit`);
      setProperties(properties.map(p => 
        p.id === id ? { ...p, status: res.data.status } : p
      ));
      alert("Property submitted for review successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit property.");
      console.error(err);
    }
  };

  const handleRenew = async (id) => {
    try {
      const res = await api.put(`/properties/${id}/renew`);
      alert(res.data.message || "Listing renewed successfully for 30 days!");
      fetchDashboardData('LANDLORD');
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to renew listing.");
      console.error(err);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus, propertyId) => {
    try {
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      setApplications(applications.map(app => {
        if (app.id === appId) return { ...app, status: newStatus };
        if (newStatus === 'APPROVED' && app.property_id === propertyId && app.status === 'PENDING') {
          return { ...app, status: 'REJECTED' };
        }
        return app;
      }));
      if (newStatus === 'APPROVED') {
        setProperties(properties.map(p => 
          p.id === propertyId ? { ...p, status: 'RENTED' } : p
        ));
      }
    } catch (error) {
      alert('Failed to update application status.');
    }
  };

  const renderAppStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5"/> Approved</span>;
      case 'REJECTED':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5"/> Rejected</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5"/> Pending</span>;
    }
  };

  const renderPropertyStatusBadge = (status) => {
    switch(status) {
      case 'PUBLISHED':
        return <span className="bg-emerald-500/90 text-white border border-emerald-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Published Live</span>;
      case 'PENDING_REVIEW':
        return <span className="bg-amber-500/90 text-white border border-amber-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Pending Approval</span>;
      case 'REJECTED':
        return <span className="bg-red-500/90 text-white border border-red-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Rejected</span>;
      case 'EXPIRED':
        return <span className="bg-rose-500/90 text-white border border-rose-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Expired</span>;
      case 'RENTED':
        return <span className="bg-slate-800/90 text-white border border-slate-600 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Rented Out</span>;
      default: 
        return <span className="bg-white/90 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm">Draft (Not Live)</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B1B18]" />
      </div>
    );
  }

  const pendingCount = applications.filter(app => app.status === 'PENDING').length;

  return (
    <div className="max-w-7xl auto pb-16 px-4 sm:px-6 lg:px-8 mt-10 font-sans text-slate-900 bg-white">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1B18] tracking-tight">
            {userRole === 'LANDLORD' ? 'Landlord' : 'Tenant'} Dashboard
          </h1>
          <p className="text-[#736E60] mt-1.5 flex items-center gap-2 text-sm">
            Welcome back! Logged in as 
            <span className="bg-[#FAF8F4] border border-[#E7E2D9] text-[#1B1B18] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
              {userRole}
            </span>
          </p>
        </div>
        {userRole === 'LANDLORD' && (
          <Link 
            to="/create-property" 
            className="bg-[#1B1B18] hover:bg-[#3F6652] text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-2 shrink-0 text-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            List New Property
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 border border-red-100 font-medium text-sm">
          {error}
        </div>
      )}

      {/* ✅ NEW: AI Recommended Properties Component for Tenants */}
      {userRole === 'TENANT' && (
        <RecommendedProperties />
      )}

      {/* Tabs Navigation */}
      <div className="inline-flex items-center gap-1 bg-[#FAF8F4] p-1.5 rounded-xl border border-[#E7E2D9] mb-8 overflow-x-auto max-w-full mt-4">
        {userRole === 'LANDLORD' && (
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2.5 px-5 font-semibold text-sm rounded-lg transition-all duration-150 whitespace-nowrap flex items-center gap-2 ${activeTab === 'properties' ? 'bg-white text-[#1B1B18] shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}
          >
            <Building className="w-4 h-4" /> My Properties
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'properties' ? 'bg-[#1B1B18] text-white' : 'bg-[#E7E2D9] text-[#736E60]'}`}>{properties.length}</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-2.5 px-5 font-semibold text-sm rounded-lg transition-all duration-150 whitespace-nowrap flex items-center gap-2 ${activeTab === 'applications' ? 'bg-white text-[#1B1B18] shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}
        >
          <FileText className="w-4 h-4" /> 
          {userRole === 'LANDLORD' ? 'Received Applications' : 'My Applications'} 
          {userRole === 'LANDLORD' && pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-soft-pulse">
              {pendingCount} New
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PROPERTIES (Landlord Only) */}
      {activeTab === 'properties' && userRole === 'LANDLORD' && (
        <>
          {properties.length === 0 ? (
            <div className="bg-[#FAF8F4] border border-[#E7E2D9] rounded-3xl p-16 text-center shadow-sm">
              <div className="bg-white border border-[#E7E2D9] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-6 h-6 text-[#736E60]" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-[#1B1B18] mb-1">No properties listed yet</h3>
              <p className="text-[#736E60] mb-5 text-sm">Start generating rental income by listing your first property.</p>
              <Link to="/create-property" className="text-[#1B1B18] font-semibold text-sm underline hover:text-[#3F6652] transition-colors">
                Click here to get started
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-2xl border border-[#E7E2D9]/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">
                  <div className="relative h-48 bg-slate-100">
                    {property.images && property.images.length > 0 ? (
                      <img src={property.images[0].image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Home className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      {renderPropertyStatusBadge(property.status)}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[#1B1B18] truncate mb-2" title={property.title}>
                        {property.title}
                      </h3>
                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center text-[#736E60] text-[13px]">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          <span className="truncate">{property.location}, {property.city}</span>
                        </div>
                        <div className="flex items-baseline text-[#1B1B18] font-bold tabular-nums">
                          PKR {property.rent.toLocaleString()} <span className="text-[#8C8676] text-xs font-medium ml-1">/ month</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#E7E2D9]/60 pt-4">
                      {property.status === 'DRAFT' && (
                        <button 
                          onClick={() => handleSubmitForReview(property.id)}
                          className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] font-semibold bg-[#1B1B18] text-white hover:bg-[#3F6652] transition-all shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit for Review
                        </button>
                      )}

                      {(property.status === 'EXPIRED' || property.status === 'PUBLISHED') && (
                        <button 
                          onClick={() => handleRenew(property.id)}
                          className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] font-semibold bg-[#3F6652] text-white hover:bg-[#2c483a] transition-all shadow-sm"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          Renew Listing (30 Days)
                        </button>
                      )}
                      
                      <Link 
                        to={`/edit-property/${property.id}`} 
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-[#FAF8F4] border border-[#E7E2D9] text-[#1B1B18] hover:bg-slate-50 transition-colors col-span-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors col-span-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-[#FAF8F4] border border-[#E7E2D9] rounded-3xl p-16 text-center shadow-sm">
              <div className="bg-white border border-[#E7E2D9] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#736E60]" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-[#1B1B18] mb-1">No applications found</h3>
              <p className="text-[#736E60] text-sm">
                {userRole === 'LANDLORD' 
                  ? "You haven't received any rental applications yet." 
                  : "You haven't applied for any properties yet."}
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-white border border-[#E7E2D9] shadow-sm hover:shadow-md rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all duration-300">
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#FAF8F4] border border-[#E7E2D9] text-[#736E60] px-2 py-1 rounded font-mono text-[10px] font-bold">App ID: #{app.id}</span>
                    {renderAppStatusBadge(app.status)}
                    <span className="text-[10px] font-bold text-[#3F6652] bg-[#FAF8F4] border border-[#3F6652]/20 px-2 py-1 rounded-md">Property ID: #{app.property_id}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-[#1B1B18]">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">Move-in: {new Date(app.move_in_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#1B1B18]">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">Occupants: {app.occupants}</span>
                    </div>
                  </div>

                  {app.message && (
                    <div className="mt-3 bg-[#FAF8F4] p-4 rounded-xl border border-[#E7E2D9]/60">
                      <p className="text-[13px] text-[#736E60] italic leading-relaxed">
                        <span className="font-bold not-italic block mb-1 text-[#1B1B18] text-xs">Note from Applicant:</span>
                        "{app.message}"
                      </p>
                    </div>
                  )}
                </div>

                {userRole === 'LANDLORD' && app.status === 'PENDING' && (
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 border-[#E7E2D9] pt-4 md:pt-0">
                    <button 
                      onClick={() => handleUpdateApplicationStatus(app.id, 'APPROVED', app.property_id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED', app.property_id)}
                      className="flex-1 bg-white border border-[#E7E2D9] text-red-600 hover:bg-red-50 hover:border-red-200 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;