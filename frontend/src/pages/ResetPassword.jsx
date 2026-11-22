import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      alert('Password reset successful! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans text-slate-900 bg-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-[#E7E2D9] p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1B1B18]">Create New Password</h2>
          <p className="text-[#736E60] mt-1.5 text-sm">Enter your new secure password below.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18]" placeholder="New Password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#1B1B18] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#3F6652] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Password'}
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/login" className="text-sm font-semibold text-[#736E60] hover:text-[#1B1B18]">Cancel</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;