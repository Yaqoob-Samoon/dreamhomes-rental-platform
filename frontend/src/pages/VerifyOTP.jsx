import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Agar bina email state ke is page par aaye toh login par bhej do
    if (!email) navigate('/login');
  }, [email, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input automatically
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp: otpCode });
      setSuccess('Verified successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP.');
      setOtp([...otp.map(() => "")]); // Clear boxes on error
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('A new code has been sent to your email.');
    } catch (err) {
      setError('Failed to resend OTP. Try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-sans bg-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-[#E7E2D9] p-8 sm:p-10 text-center relative overflow-hidden">
        
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF8F4] text-[#1B1B18] mb-6 border border-[#E7E2D9]">
          <ShieldCheck className="w-8 h-8" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-2xl font-bold text-[#1B1B18] mb-2">Verify your email</h2>
        <p className="text-[#736E60] text-sm mb-8">
          We've sent a 6-digit verification code to <br/>
          <span className="font-semibold text-[#1B1B18]">{email}</span>
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm mb-6 border border-emerald-100 font-medium">{success}</div>}

        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-2 sm:gap-3 mb-8">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={el => inputRefs.current[index] = el}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-[#1B1B18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all"
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#1B1B18] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#3F6652] transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60 mb-6">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
          </button>
        </form>

        <p className="text-sm text-[#736E60]">
          Didn't receive the code?{' '}
          <button onClick={handleResend} disabled={resending} className="text-[#1B1B18] font-semibold underline hover:text-[#3F6652] disabled:opacity-50 inline-flex items-center gap-1">
            {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Resend
          </button>
        </p>

      </div>
    </div>
  );
};

export default VerifyOTP;