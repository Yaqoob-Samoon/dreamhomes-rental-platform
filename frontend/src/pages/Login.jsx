import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { jwtDecode } from 'jwt-decode';
import { Loader2, Mail, Lock, Home as HomeIcon, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = response.data.access_token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      
      if (decoded.role === 'ADMIN') navigate('/admin');
      else if (decoded.role === 'LANDLORD') navigate('/dashboard');
      else navigate('/properties');

    } catch (err) {
      // ✅ NAYA LOGIC: Agar account verify nahi hai toh OTP screen par bhejein
      if (err.response?.status === 403 && err.response?.data?.detail === "NOT_VERIFIED") {
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans text-slate-900 bg-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-[#E7E2D9] p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#FAF8F4] rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FAF8F4] rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B1B18] text-white mb-4 shadow-sm">
            <HomeIcon className="w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-[#1B1B18] tracking-tight">Welcome back</h2>
          <p className="text-[#736E60] mt-1.5 text-sm">Sign in to continue to DreamHomes</p>
        </div>
        
        {error && (
          <div className="relative z-10 bg-red-50 text-red-600 p-3.5 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10 space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18]" placeholder="Email address" />
          </div>
          
          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18]" placeholder="Password" />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-semibold text-[#736E60] hover:text-[#1B1B18] transition-colors">Forgot password?</Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#1B1B18] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#3F6652] transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
          </button>
        </form>

        <p className="relative z-10 text-center text-sm text-[#736E60] mt-8">
          Don't have an account? <Link to="/register" className="text-[#1B1B18] font-semibold underline hover:text-[#3F6652]">Create one now</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;