import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const SavedMatches = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await apiClient.get('/matches/saved');
        // The backend returns populated profiles. matching.js logic for MatchResult model.
        // We need to format them as { profile, score } for MatchCard
        const formatted = res.data.map(m => ({
          profile: m.profileB, // assuming current user is A
          score: m.score,
          _id: m._id
        }));
        setSaved(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <div className="min-h-screen bg-jatham-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-jatham-maroon rounded-2xl text-white">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-3xl text-jatham-maroon">Your Shortlist</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 italic text-jatham-maroon/40">Loading your favorites...</div>
        ) : saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {saved.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <p className="text-xl text-jatham-maroon/60">No saved matches yet.</p>
            <p className="text-sm text-jatham-text/40 italic">Heart your favorite profiles to see them here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedMatches;
