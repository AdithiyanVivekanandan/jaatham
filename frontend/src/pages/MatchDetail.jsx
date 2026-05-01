import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import AstroChart from '../components/AstroChart';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, User, Star, ShieldAlert, Sparkles, Brain, 
  FileText, ArrowLeft, Download, Save, CheckCircle2, 
  AlertCircle, ChevronRight, Loader2
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await apiClient.get(`/matches/${id}`);
        setMatch(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/matches/${id}/save`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await apiClient.post(`/matches/${match._id}/export`);
      alert('PDF generation started. You can download it in a few moments.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-jatham-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-jatham-maroon mx-auto" />
          <p className="font-serif text-jatham-maroon text-xl italic">Reading the Cosmic Threads...</p>
        </div>
      </div>
    );
  }

  if (!match) return <div className="p-8 text-center">Match not found.</div>;

  const targetProfile = match.profileB._id === id ? match.profileB : match.profileA;
  const myProfile = match.profileB._id === id ? match.profileA : match.profileB;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'astro', label: 'Astro', icon: Star },
    { id: 'dosha', label: 'Dosha', icon: ShieldAlert },
    { id: 'ai', label: 'AI Analysis', icon: Sparkles },
    { id: 'personality', label: 'Personality', icon: Brain },
  ];

  // Map personality scores for Radar Chart
  const radarData = targetProfile.bigFiveScores ? [
    { subject: 'Openness', A: myProfile.bigFiveScores?.openness || 0, B: targetProfile.bigFiveScores.openness, fullMark: 100 },
    { subject: 'Conscientiousness', A: myProfile.bigFiveScores?.conscientiousness || 0, B: targetProfile.bigFiveScores.conscientiousness, fullMark: 100 },
    { subject: 'Extraversion', A: myProfile.bigFiveScores?.extraversion || 0, B: targetProfile.bigFiveScores.extraversion, fullMark: 100 },
    { subject: 'Agreeableness', A: myProfile.bigFiveScores?.agreeableness || 0, B: targetProfile.bigFiveScores.agreeableness, fullMark: 100 },
    { subject: 'Neuroticism', A: myProfile.bigFiveScores?.neuroticism || 0, B: targetProfile.bigFiveScores.neuroticism, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-jatham-bg pb-20">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-white border-b border-jatham-gold/10 p-6 sm:p-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-jatham-cream rounded-full transition-colors mr-auto sm:mr-0">
            <ArrowLeft className="w-6 h-6 text-jatham-maroon" />
          </button>
          
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-jatham-cream border-4 border-white shadow-xl overflow-hidden">
              {targetProfile.photoUrl ? (
                <img src={targetProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-8 text-jatham-gold/30" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl text-jatham-maroon">{targetProfile.candidateName}</h1>
              <span className="inline-block bg-jatham-gold/10 text-jatham-gold px-4 py-1 rounded-full text-sm font-bold border border-jatham-gold/20">
                {match.score}% Compatible
              </span>
            </div>
            <p className="text-jatham-terracotta/70 font-medium tracking-wide">
              {targetProfile.profession} • {targetProfile.placeOfBirth}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-full border border-jatham-maroon text-jatham-maroon hover:bg-jatham-maroon hover:text-white transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Match</>}
              </button>
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-jatham-maroon text-white hover:bg-jatham-maroon/90 shadow-lg shadow-jatham-maroon/20 transition-all disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Export Report</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-md border-b border-jatham-gold/5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex justify-center px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2
                  ${activeTab === tab.id ? 'border-jatham-maroon text-jatham-maroon' : 'border-transparent text-jatham-text/40 hover:text-jatham-maroon/60'}
                `}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto p-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-xl text-jatham-maroon border-b border-jatham-gold/10 pb-2">Profile Background</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-jatham-terracotta/50 uppercase font-bold">Education</p>
                        <p className="text-jatham-text font-medium">{targetProfile.education}</p>
                      </div>
                      <div>
                        <p className="text-xs text-jatham-terracotta/50 uppercase font-bold">Profession</p>
                        <p className="text-jatham-text font-medium">{targetProfile.profession}</p>
                      </div>
                      <div>
                        <p className="text-xs text-jatham-terracotta/50 uppercase font-bold">Language</p>
                        <p className="text-jatham-text font-medium capitalize">{targetProfile.motherTongue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-jatham-terracotta/50 uppercase font-bold">Location</p>
                        <p className="text-jatham-text font-medium">{targetProfile.placeOfBirth}</p>
                      </div>
                    </div>
                  </section>
                  
                  <section className="bg-jatham-cream/50 p-6 rounded-3xl border border-jatham-gold/10 italic text-jatham-maroon/70">
                    "A balance of tradition and modernity, seeking a partner with similar values and aspirations."
                  </section>
                </div>
                
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-[2rem] border border-jatham-gold/10 shadow-xl space-y-4">
                      <h3 className="text-center font-serif text-jatham-maroon">Quick Compatibility</h3>
                      <div className="flex justify-around items-center py-4">
                        <div className="text-center">
                          <p className="text-3xl font-serif text-jatham-maroon">{match.totalPoruthams}/10</p>
                          <p className="text-xs text-jatham-terracotta/50 font-bold">Poruthams</p>
                        </div>
                        <div className="w-[1px] h-10 bg-jatham-gold/20" />
                        <div className="text-center">
                          <p className="text-3xl font-serif text-green-600">{match.score}%</p>
                          <p className="text-xs text-jatham-terracotta/50 font-bold">Overall</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'astro' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-xl text-jatham-maroon border-b border-jatham-gold/10 pb-2">Astrological Alignments</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-jatham-gold/5">
                      <span className="text-jatham-text/60">Nakshatra</span>
                      <span className="font-bold text-jatham-maroon">{targetProfile.astroData.nakshatraName} ({targetProfile.astroData.pada})</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-jatham-gold/5">
                      <span className="text-jatham-text/60">Rasi</span>
                      <span className="font-bold text-jatham-maroon">{targetProfile.astroData.rasiName}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-jatham-gold/5">
                      <span className="text-jatham-text/60">Lagna (Ascendant)</span>
                      <span className="font-bold text-jatham-maroon">{targetProfile.astroData.lagnaName}</span>
                    </div>
                  </div>
                </div>
                <AstroChart planets={targetProfile.astroData.planets} title="Candidate Birth Chart" />
              </div>
            )}

            {activeTab === 'dosha' && (
              <div className="space-y-10 max-w-2xl mx-auto">
                <div className={`p-8 rounded-[2.5rem] border-2 text-center space-y-4 ${targetProfile.astroData.chevvaiDosham ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  {targetProfile.astroData.chevvaiDosham ? (
                    <>
                      <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                      <h3 className="text-2xl text-red-700 font-serif">Chevvai Dosham Detected</h3>
                      <p className="text-red-600/70 italic">Category: {targetProfile.astroData.chevvaiDoshamType}</p>
                      <p className="text-sm text-red-800/60 max-w-sm mx-auto">This match may require specific remedies or a matching partner with similar doshas. Consult an astrologer for details.</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                      <h3 className="text-2xl text-green-700 font-serif">Dosha Clear</h3>
                      <p className="text-green-600/70 italic">No significant Chevvai Dosham was detected in this chart.</p>
                    </>
                  )}
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-jatham-gold/10 space-y-6">
                  <h3 className="text-xl text-jatham-maroon font-serif flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Nadi Compatibility
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-jatham-cream/30 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-jatham-maroon shadow-sm">
                      {targetProfile.astroData.nadiType?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-jatham-maroon capitalize">{targetProfile.astroData.nadiType} Nadi</p>
                      <p className="text-xs text-jatham-text/60">Determines hereditary compatibility and health of progeny.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-jatham-gold/10 shadow-2xl space-y-8 relative overflow-hidden">
                <Sparkles className="absolute top-8 right-8 w-12 h-12 text-jatham-gold/20" />
                <h3 className="text-3xl text-jatham-maroon font-serif">AI Synthesis Report</h3>
                <div className="prose prose-stone max-w-none text-jatham-text/80 leading-relaxed space-y-6">
                  {match.aiReport?.reportText ? (
                    <div dangerouslySetInnerHTML={{ __html: match.aiReport.reportText.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <div className="text-center py-10 space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-jatham-gold mx-auto" />
                      <p className="italic">Generating personalized insights from the stars...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#D69E2E" strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9B2C2C', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="My Score"
                        dataKey="A"
                        stroke="#D69E2E"
                        fill="#D69E2E"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={targetProfile.candidateName}
                        dataKey="B"
                        stroke="#9B2C2C"
                        fill="#9B2C2C"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl text-jatham-maroon font-serif">Psychological Alignment</h3>
                  <p className="text-jatham-text/70 leading-relaxed italic">
                    "This match shows a strong alignment in Conscientiousness and Agreeableness, suggesting a harmonious household management style."
                  </p>
                  {!targetProfile.bigFiveCompleted && (
                    <div className="p-4 bg-jatham-cream/50 rounded-2xl border border-jatham-gold/20 text-jatham-maroon text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>The candidate has not completed the personality assessment yet. These scores are estimated based on demographics.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MatchDetail;
