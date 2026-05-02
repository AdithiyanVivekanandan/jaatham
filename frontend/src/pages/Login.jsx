import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import loginBg from '../assets/images/login-bg.png';

const Login = () => {
  const [method, setMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = method === 'email' ? { email } : { phone };
      await apiClient.post('/auth/request-otp', payload);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = method === 'email' ? { email, otp } : { phone, otp };
      const res = await apiClient.post('/verify-otp', payload);
      setAuth(res.data.user, res.data.accessToken);
      
      if (!res.data.user.profileId) {
        navigate('/profile-setup');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center font-serif"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-jatham-cream"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl text-jatham-maroon mb-2">Jatham</h1>
          <p className="text-jatham-terracotta/70 font-sans tracking-wide">Vedic Matchmaking Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Method Switcher */}
              <div className="flex bg-jatham-cream/50 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setMethod('email')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${method === 'email' ? 'bg-white shadow-sm text-jatham-maroon' : 'text-jatham-text/50'}`}
                >
                  Email
                </button>
                <button
                  onClick={() => setMethod('phone')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${method === 'phone' ? 'bg-white shadow-sm text-jatham-maroon' : 'text-jatham-text/50'}`}
                >
                  Phone
                </button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 font-sans">
                    {method === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="relative font-sans">
                    {method === 'email' ? (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jatham-gold" />
                    ) : (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jatham-gold" />
                    )}
                    <input 
                      type={method === 'email' ? 'email' : 'tel'}
                      placeholder={method === 'email' ? 'name@example.com' : '+91 00000 00000'}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-jatham-cream/30 border border-jatham-gold/20 focus:border-jatham-maroon focus:ring-1 focus:ring-jatham-maroon outline-none transition-all"
                      value={method === 'email' ? email : phone}
                      onChange={(e) => method === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                      required
                    />
                  </div>
                  {method === 'email' && (
                    <p className="text-[10px] text-jatham-terracotta/60 ml-1 italic">
                      * Recommended for 100% free usage via Resend
                    </p>
                  )}
                </div>

                {error && <p className="text-red-600 text-sm ml-1 font-sans">{error}</p>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-jatham-maroon hover:bg-jatham-maroon/90 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-jatham-maroon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Login Code <ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setStep('input')}
                className="flex items-center gap-2 text-jatham-maroon/60 text-sm mb-6 hover:text-jatham-maroon transition-colors font-sans"
              >
                <ArrowLeft className="w-4 h-4" /> Edit {method === 'email' ? 'Email' : 'Phone'}
              </button>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 text-center block font-sans">Enter 6-Digit Code</label>
                  <input 
                    type="text"
                    maxLength="6"
                    placeholder="0 0 0 0 0 0"
                    className="w-full px-4 py-4 rounded-2xl bg-jatham-cream/30 border border-jatham-gold/20 text-center text-3xl font-mono tracking-[0.5em] focus:border-jatham-maroon focus:ring-1 focus:ring-jatham-maroon outline-none transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-red-600 text-sm text-center font-sans">{error}</p>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-jatham-maroon hover:bg-jatham-maroon/90 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-jatham-maroon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
