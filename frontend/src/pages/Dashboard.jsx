import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import DisclaimerModal from '../components/DisclaimerModal';
import { motion } from 'framer-motion';
import { Search, RefreshCcw, Loader2, Star, Plus, Heart, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const [matches, setMatches] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disclaimerPassed, setDisclaimerPassed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    try {
      const profileRes = await apiClient.get('/profiles/me');
      setMyProfile(profileRes.data);
      
      try {
        const matchesRes = await apiClient.get('/matches');
        setMatches(matchesRes.data.matches || []);
      } catch {
        setMatches([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setMyProfile(null);
      } else {
        setError('Could not load data. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredMatches = matches.filter(m =>
    !searchQuery ||
    m.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.profile?.nakshatra?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-jatham-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-jatham-maroon mx-auto" />
          <p className="font-serif text-jatham-maroon text-xl italic">Consulting the Stars...</p>
        </div>
      </div>
    );
  }

  // No profile yet
  if (!myProfile) {
    return (
      <div className="min-h-screen bg-jatham-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-lg"
          >
            <div className="w-24 h-24 bg-jatham-maroon/10 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-12 h-12 text-jatham-maroon/30" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl text-jatham-maroon font-serif">Welcome to Jatham</h2>
              <p className="text-jatham-text/60 leading-relaxed">
                Create a candidate profile to begin your Vedic matchmaking journey. We'll calculate the birth chart and find compatible matches from your community.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/profile-setup"
                className="flex items-center justify-center gap-2 bg-jatham-maroon text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-jatham-maroon/20 hover:bg-jatham-maroon/90 transition-all"
              >
                <Plus className="w-5 h-5" /> Create Profile
              </Link>
              <Link 
                to="/quiz"
                className="flex items-center justify-center gap-2 bg-white border border-jatham-gold/20 text-jatham-maroon px-8 py-4 rounded-2xl font-semibold hover:bg-jatham-cream transition-all"
              >
                <ClipboardList className="w-5 h-5" /> Take Personality Quiz
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jatham-bg flex flex-col">
      <DisclaimerModal onAcknowledge={() => setDisclaimerPassed(true)} />
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {/* Welcome Header */}
        <section className="bg-jatham-maroon rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-jatham-maroon/20">
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl sm:text-4xl">
              Namaste, <span className="italic text-jatham-gold/90">{myProfile.candidateName}</span>
            </h1>
            <div className="flex flex-wrap gap-3">
              {[
                myProfile.astroData?.nakshatraName && `${myProfile.astroData.nakshatraName} Nakshatra`,
                myProfile.astroData?.rasiName && `${myProfile.astroData.rasiName} Rasi`,
                myProfile.astroData?.lagnaName && `${myProfile.astroData.lagnaName} Lagna`,
              ].filter(Boolean).map(tag => (
                <span key={tag} className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            {!myProfile.bigFiveCompleted && (
              <div className="mt-4 flex items-center gap-3 bg-jatham-gold/20 border border-jatham-gold/30 px-4 py-3 rounded-2xl text-sm">
                <ClipboardList className="w-5 h-5 text-jatham-gold shrink-0" />
                <span className="flex-1">Complete the personality quiz for better matches.</span>
                <Link to="/quiz" className="text-jatham-gold font-bold hover:underline">Take Quiz →</Link>
              </div>
            )}
          </div>
          <Star className="absolute right-8 top-1/2 -translate-y-1/2 w-48 h-48 text-white/5" />
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Matches', value: matches.length, color: 'text-jatham-maroon' },
            { label: 'High Compatibility', value: matches.filter(m => m.score >= 70).length, color: 'text-green-600' },
            { label: 'Review Needed', value: matches.filter(m => m.score < 50).length, color: 'text-red-600' },
            { label: 'Saved', value: 0, color: 'text-jatham-gold' },
          ].map(s => (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-jatham-gold/10 shadow-sm text-center">
              <p className={`text-3xl font-serif ${s.color}`}>{s.value}</p>
              <p className="text-xs text-jatham-text/50 uppercase tracking-wider font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-jatham-gold/10 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jatham-gold" />
            <input 
              type="text" 
              placeholder="Search by name or Nakshatra..." 
              className="w-full pl-12 pr-4 py-3 bg-jatham-cream/30 rounded-xl border border-jatham-gold/10 outline-none focus:border-jatham-maroon transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link to="/saved" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-jatham-gold/20 rounded-xl hover:bg-jatham-cream text-jatham-maroon font-semibold transition-colors">
              <Heart className="w-4 h-4" /> Saved
            </Link>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-jatham-cream text-jatham-maroon rounded-xl hover:rotate-180 transition-all duration-500"
              title="Refresh matches"
            >
              <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Match Grid */}
        {disclaimerPassed && (
          <>
            {filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMatches.map((match, idx) => (
                  <motion.div 
                    key={match.matchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <MatchCard match={match} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-6">
                <div className="w-24 h-24 bg-jatham-cream rounded-full flex items-center justify-center mx-auto">
                  <Star className="w-12 h-12 text-jatham-gold/50" />
                </div>
                <div>
                  <h2 className="text-2xl text-jatham-maroon font-serif">No Matches Found</h2>
                  <p className="text-jatham-text/50 mt-2 italic text-sm">The stars are still aligning. More members = more matches.</p>
                </div>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-jatham-maroon text-sm underline">Clear Search</button>
                )}
              </div>
            )}
          </>
        )}

        {!disclaimerPassed && (
          <div className="text-center py-16">
            <p className="text-jatham-maroon/40 italic">Please acknowledge the disclaimer above to view matches.</p>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-jatham-terracotta/40 text-sm border-t border-jatham-gold/5 font-sans">
        &copy; 2026 Jatham Matrimonial • Built with Vedic Wisdom
      </footer>
    </div>
  );
};

export default Dashboard;
