import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      // Security practice: Always show success even if email doesn't exist
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 font-sans bg-white text-center">
        <div className="max-w-md w-full bg-[#FAF8F4] border border-[#E7E2D9] rounded-3xl p-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1B1B18] mb-2">Check your email</h2>
          <p className="text-[#736E60] text-sm mb-6">If an account exists for that email, we have sent password reset instructions.</p>
          <Link to="/login" className="text-[#1B1B18] font-semibold underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans text-slate-900 bg-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-[#E7E2D9] p-8 sm:p-10">
        <div className="mb-8">
          <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Link>
          <h2 className="text-3xl font-bold text-[#1B1B18]">Reset Password</h2>
          <p className="text-[#736E60] mt-2 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all" placeholder="Email address" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#1B1B18] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#3F6652] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;