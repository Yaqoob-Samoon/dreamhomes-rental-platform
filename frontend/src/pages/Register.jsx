import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, Mail, Lock, User, Phone, Loader2, AlertCircle, Search, Building2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'TENANT' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', formData);
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      const backendError = err.response?.data?.detail;

      if (Array.isArray(backendError)) {
        // FastAPI 422 validation errors (array of objects)
        setError(backendError.map((e) => e.msg).join(', '));
      } else if (typeof backendError === 'string') {
        // Normal 400 errors (e.g. Email already registered)
        setError(backendError);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans text-slate-900 bg-white">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-[#E7E2D9] p-8 sm:p-10 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-40 h-40 bg-[#FAF8F4] rounded-full -ml-20 -mt-20 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#FAF8F4] rounded-full -mr-12 -mb-12 blur-2xl"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B1B18] text-white mb-4 shadow-sm">
            <UserPlus className="w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-[#1B1B18] tracking-tight">Create account</h2>
          <p className="text-[#736E60] mt-1.5 text-sm">Join DreamHomes to find or list properties.</p>
        </div>
        
        {error && (
          <div className="relative z-10 bg-red-50 text-red-600 p-3.5 rounded-xl text-sm mb-6 border border-red-100 flex items-center justify-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="relative z-10 space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all" placeholder="Full Name" />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all" placeholder="Email Address" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all" placeholder="Create a Password" />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all" placeholder="Phone Number (Optional)" />
          </div>

          <div className="pt-2">
            <label className="block text-slate-800 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Account Type</label>
            <div className="grid grid-cols-2 gap-2 bg-[#FAF8F4] p-1.5 rounded-2xl border border-[#E7E2D9]">
              <button type="button" onClick={() => setFormData({ ...formData, role: 'TENANT' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${formData.role === 'TENANT' ? 'bg-[#1B1B18] text-white shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}>
                <Search className={`w-4 h-4 ${formData.role === 'TENANT' ? 'text-white' : 'text-slate-400'}`} strokeWidth={2} /> Tenant
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, role: 'LANDLORD' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${formData.role === 'LANDLORD' ? 'bg-[#1B1B18] text-white shadow-sm' : 'text-[#736E60] hover:text-[#1B1B18]'}`}>
                <Building2 className={`w-4 h-4 ${formData.role === 'LANDLORD' ? 'text-white' : 'text-slate-400'}`} strokeWidth={2} /> Landlord
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[#1B1B18] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#3F6652] transition-all duration-200 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4" strokeWidth={2} /> Create Account</>}
          </button>
        </form>

        <p className="relative z-10 text-center text-sm text-[#736E60] mt-8">
          Already have an account? <Link to="/login" className="text-[#1B1B18] font-semibold underline hover:text-[#3F6652]">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;