import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Users, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const JoinCommunity = () => {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState(paramCode?.toUpperCase() || '');
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLookup = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    setCommunity(null);
    try {
      const res = await apiClient.get(`/communities/${inviteCode.trim()}`);
      setCommunity(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid invite code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await apiClient.post(`/communities/${inviteCode.trim()}/join`);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join community. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-jatham-bg flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-jatham-maroon/10 rounded-3xl flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-jatham-maroon" />
            </div>
            <h1 className="text-3xl text-jatham-maroon font-serif">Join a Community</h1>
            <p className="text-jatham-text/60 text-sm">Enter your invite code to connect with members of your community and start finding matches.</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8 text-center space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <h2 className="text-xl font-serif text-green-700">Successfully Joined!</h2>
              <p className="text-sm text-green-600">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-jatham-gold/10 shadow-xl space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-jatham-maroon mb-2">Invite Code</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    placeholder="e.g. IYER2024"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    className="flex-1 px-4 py-3 border border-jatham-gold/20 rounded-2xl font-mono font-bold tracking-widest text-jatham-maroon bg-jatham-cream/30 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-jatham-maroon transition-all"
                    maxLength={12}
                  />
                  <button 
                    onClick={handleLookup}
                    disabled={loading || !inviteCode}
                    className="bg-jatham-maroon text-white px-5 py-3 rounded-2xl font-semibold disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find'}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}

              {community && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-jatham-gold/20 p-5 rounded-2xl space-y-4 bg-jatham-cream/20"
                >
                  <div>
                    <h3 className="text-lg font-serif text-jatham-maroon">{community.name}</h3>
                    <p className="text-sm text-jatham-text/50">{community.city}, {community.state}</p>
                    <p className="text-xs text-jatham-terracotta/60 mt-1">{community.memberCount} members</p>
                  </div>
                  
                  <button 
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 bg-jatham-maroon text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-jatham-maroon/20 hover:bg-jatham-maroon/90 transition-all"
                  >
                    {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join {community.name.split('—')[0].trim()} <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default JoinCommunity;
