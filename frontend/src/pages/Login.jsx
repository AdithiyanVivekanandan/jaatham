import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import loginBg from '../assets/images/login-bg.png';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone or otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/request-otp', { phone });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/verify-otp', { phone, otp });
      setAuth(res.data.user, res.data.accessToken);
      
      if (!res.data.user.profileId) {
        navigate('/profile-setup');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-jatham-cream"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl text-jatham-maroon mb-2">Jatham</h1>
          <p className="text-jatham-terracotta/70 font-sans tracking-wide">Premium Vedic Matchmaking</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-jatham-text ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jatham-gold" />
                <input 
                  type="tel"
                  placeholder="+91 00000 00000"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-jatham-cream/50 border border-jatham-gold/20 focus:border-jatham-maroon focus:ring-1 focus:ring-jatham-maroon outline-none transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm ml-1">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-jatham-maroon hover:bg-jatham-maroon/90 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-jatham-maroon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-jatham-text ml-1">6-Digit OTP</label>
              <input 
                type="text"
                maxLength="6"
                placeholder="0 0 0 0 0 0"
                className="w-full px-4 py-4 rounded-2xl bg-jatham-cream/50 border border-jatham-gold/20 text-center text-2xl tracking-[1em] focus:border-jatham-maroon focus:ring-1 focus:ring-jatham-maroon outline-none transition-all"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-jatham-maroon hover:bg-jatham-maroon/90 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-jatham-maroon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              className="w-full text-jatham-maroon/60 text-sm hover:text-jatham-maroon transition-colors"
            >
              Edit Phone Number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
