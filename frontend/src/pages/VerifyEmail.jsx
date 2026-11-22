import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed or token expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-sans bg-white text-center">
      <div className="max-w-md w-full bg-[#FAF8F4] border border-[#E7E2D9] rounded-3xl p-8 shadow-sm">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#1B1B18] mb-4" />
            <h2 className="text-xl font-bold text-[#1B1B18]">Verifying your email...</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-[#1B1B18] mb-2">Verified!</h2>
            <p className="text-[#736E60] mb-6">{message}</p>
            <Link to="/login" className="w-full bg-[#1B1B18] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#3F6652] transition-colors">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-[#1B1B18] mb-2">Verification Failed</h2>
            <p className="text-[#736E60] mb-6">{message}</p>
            <Link to="/login" className="w-full bg-white border border-[#E7E2D9] text-[#1B1B18] font-medium py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;