import { motion } from 'framer-motion';
import { Star, MapPin, Briefcase, GraduationCap, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PORUTHAM_COLOR = {
  pass: 'bg-green-100 text-green-700',
  conditional: 'bg-amber-100 text-amber-700',
  fail: 'bg-red-100 text-red-700',
};

const MatchCard = ({ match }) => {
  const { profile, score, passCount, matchId } = match;
  
  // Determine score color
  const scoreColor = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const scoreLabel = score >= 70 ? 'High Alignment' : score >= 50 ? 'Moderate' : 'Review Needed';
  
  // Check if it's a hard reject (score capped at 35)
  const isHardReject = score <= 35;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl overflow-hidden border border-jatham-gold/10 shadow-lg hover:shadow-xl transition-all h-full flex flex-col"
    >
      {/* Photo Area */}
      <div className="relative h-44 bg-jatham-cream flex items-center justify-center overflow-hidden">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 bg-jatham-maroon/10 rounded-full flex items-center justify-center text-jatham-maroon font-serif text-2xl">
            {profile.name?.charAt(0) || '?'}
          </div>
        )}
        
        {/* Hard Reject Badge */}
        {isHardReject && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
            <ShieldAlert className="w-3 h-3" /> ADVISORY
          </div>
        )}
        
        {/* Score Badge */}
        <div className={`absolute bottom-3 right-3 ${scoreColor} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
          {score}%
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-4">
        {/* Name & Star */}
        <div>
          <h3 className="text-lg font-serif text-jatham-maroon truncate">{profile.name}</h3>
          <p className="text-xs text-jatham-terracotta/60 font-medium">{profile.nakshatra} Nakshatra • {profile.rasi} Rasi</p>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs text-jatham-text/70">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-jatham-gold shrink-0" />
            <span className="truncate">{profile.city || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-jatham-gold shrink-0" />
            <span className="truncate">{profile.profession || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-jatham-gold shrink-0" />
            <span className="truncate">{profile.education || '—'}</span>
          </div>
        </div>

        {/* Porutham Chips — Rajju, Gana, Nadi */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-jatham-cream text-jatham-maroon">
            {passCount || 0}/10 Poruthams
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${scoreLabel === 'High Alignment' ? PORUTHAM_COLOR.pass : scoreLabel === 'Moderate' ? PORUTHAM_COLOR.conditional : PORUTHAM_COLOR.fail}`}>
            {scoreLabel}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-jatham-gold/10 flex justify-between items-center">
          {isHardReject ? (
            <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" /> Consult Astrologer
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
            </div>
          )}
          <Link 
            to={`/match/${profile.id}`}
            className="flex items-center gap-1.5 text-jatham-maroon font-semibold text-xs hover:gap-2.5 transition-all"
          >
            View Report <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;
