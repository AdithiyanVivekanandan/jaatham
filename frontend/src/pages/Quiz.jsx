import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';

// Full 44-question IPIP Big Five inventory
// Based on IPIP-NEO 50 adapted for Indian context
const QUESTIONS = [
  // OPENNESS (O)
  { id: 'O1', trait: 'openness', text: 'I am curious about many different things.' },
  { id: 'O2', trait: 'openness', text: 'I have a vivid imagination.' },
  { id: 'O3', trait: 'openness', text: 'I enjoy thinking about abstract concepts.' },
  { id: 'O4', trait: 'openness', text: 'I appreciate art and creativity.' },
  { id: 'O5', trait: 'openness', text: 'I am interested in new ideas and perspectives.' },
  { id: 'O6', trait: 'openness', text: 'I prefer variety and novelty over routine.', weight: 1 },
  { id: 'O7', trait: 'openness', text: 'I rarely try new things.', reverse: true },
  { id: 'O8', trait: 'openness', text: 'I enjoy philosophical discussions.' },
  { id: 'O9', trait: 'openness', text: 'I find it hard to think in abstract terms.', reverse: true },

  // CONSCIENTIOUSNESS (C)
  { id: 'C1', trait: 'conscientiousness', text: 'I am always prepared and organized.' },
  { id: 'C2', trait: 'conscientiousness', text: 'I pay attention to details.' },
  { id: 'C3', trait: 'conscientiousness', text: 'I make plans and stick to them.' },
  { id: 'C4', trait: 'conscientiousness', text: 'I finish what I start.' },
  { id: 'C5', trait: 'conscientiousness', text: 'I like order and follow a strict routine.' },
  { id: 'C6', trait: 'conscientiousness', text: 'I am reliable and can be depended on.' },
  { id: 'C7', trait: 'conscientiousness', text: 'I often leave things scattered around.', reverse: true },
  { id: 'C8', trait: 'conscientiousness', text: 'I procrastinate on important tasks.', reverse: true },
  { id: 'C9', trait: 'conscientiousness', text: 'I waste my time.', reverse: true },

  // EXTRAVERSION (E)
  { id: 'E1', trait: 'extraversion', text: 'I enjoy being the life of social gatherings.' },
  { id: 'E2', trait: 'extraversion', text: 'I am outgoing and talkative.' },
  { id: 'E3', trait: 'extraversion', text: 'I feel comfortable around new people.' },
  { id: 'E4', trait: 'extraversion', text: 'I make friends easily.' },
  { id: 'E5', trait: 'extraversion', text: 'I take charge in social situations.' },
  { id: 'E6', trait: 'extraversion', text: 'I prefer to avoid large social gatherings.', reverse: true },
  { id: 'E7', trait: 'extraversion', text: 'I keep in the background at social events.', reverse: true },
  { id: 'E8', trait: 'extraversion', text: 'I feel energized when I spend time with others.' },
  { id: 'E9', trait: 'extraversion', text: 'I find social interactions draining.', reverse: true },

  // AGREEABLENESS (A)
  { id: 'A1', trait: 'agreeableness', text: 'I care deeply about others\' wellbeing.' },
  { id: 'A2', trait: 'agreeableness', text: 'I am helpful and try to support others.' },
  { id: 'A3', trait: 'agreeableness', text: 'I have a forgiving nature.' },
  { id: 'A4', trait: 'agreeableness', text: 'I am polite and courteous to everyone.' },
  { id: 'A5', trait: 'agreeableness', text: 'I try to get along with everyone.' },
  { id: 'A6', trait: 'agreeableness', text: 'I sympathize with others\' feelings.' },
  { id: 'A7', trait: 'agreeableness', text: 'I feel little concern for others.', reverse: true },
  { id: 'A8', trait: 'agreeableness', text: 'I tend to be critical of others.', reverse: true },
  { id: 'A9', trait: 'agreeableness', text: 'I cut others short when they make mistakes.', reverse: true },

  // NEUROTICISM (N)
  { id: 'N1', trait: 'neuroticism', text: 'I get stressed out easily.' },
  { id: 'N2', trait: 'neuroticism', text: 'I often feel anxious or tense.' },
  { id: 'N3', trait: 'neuroticism', text: 'I worry about many different things.' },
  { id: 'N4', trait: 'neuroticism', text: 'My mood changes frequently.' },
  { id: 'N5', trait: 'neuroticism', text: 'I often feel sad or blue.' },
  { id: 'N6', trait: 'neuroticism', text: 'I remain calm under pressure.', reverse: true },
  { id: 'N7', trait: 'neuroticism', text: 'I rarely feel depressed.', reverse: true },
  { id: 'N8', trait: 'neuroticism', text: 'I am emotionally stable.', reverse: true },
];

const SCALE_LABELS = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree'
};

const Quiz = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const totalQuestions = QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const current = QUESTIONS[currentIndex];
  const currentAnswer = answers[current.id];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);
    // Auto-advance after 300ms
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  };

  const calculateScores = () => {
    const totals = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    const counts = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };

    QUESTIONS.forEach(q => {
      if (answers[q.id] !== undefined) {
        let score = answers[q.id];
        if (q.reverse) score = 6 - score;
        totals[q.trait] += score;
        counts[q.trait]++;
      }
    });

    const finalScores = {};
    Object.keys(totals).forEach(t => {
      const avg = counts[t] > 0 ? totals[t] / counts[t] : 3;
      finalScores[t] = Math.round(((avg - 1) / 4) * 100); // normalize 1-5 → 0-100
    });
    return finalScores;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const scores = calculateScores();
      await apiClient.post('/profiles/me/behavioral', scores);
      setCompleted(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Object.keys(answers).length >= Math.floor(totalQuestions * 0.8); // at least 80% answered

  if (completed) {
    return (
      <div className="min-h-screen bg-jatham-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-10"
        >
          <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h2 className="text-3xl text-jatham-maroon font-serif">Assessment Complete</h2>
          <p className="text-jatham-text/60 italic">Your personality profile has been saved. Returning to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jatham-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center p-6 pt-10">
        {/* Progress Bar */}
        <div className="w-full max-w-2xl space-y-2 mb-8">
          <div className="flex justify-between text-sm font-bold text-jatham-maroon/60 uppercase tracking-widest">
            <span>{QUESTIONS[currentIndex].trait.toUpperCase()}</span>
            <span>{currentIndex + 1} / {totalQuestions}</span>
          </div>
          <div className="h-2 w-full bg-jatham-cream rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut' }}
              className="h-full bg-jatham-maroon rounded-full"
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-jatham-gold/10 min-h-[380px] flex flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex items-center justify-center p-10 sm:p-16 text-center"
            >
              <h2 className="text-2xl sm:text-3xl text-jatham-maroon font-serif leading-relaxed">
                {current.text}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Answer Buttons */}
          <div className="grid grid-cols-5 border-t border-jatham-gold/10">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => handleAnswer(val)}
                className={`
                  py-5 flex flex-col items-center gap-1 transition-all text-xs font-semibold border-r border-jatham-gold/10 last:border-r-0
                  ${currentAnswer === val 
                    ? 'bg-jatham-maroon text-white' 
                    : 'hover:bg-jatham-cream text-jatham-text/50'}
                `}
              >
                <span className="text-base font-bold">{val}</span>
                <span className="hidden sm:block text-[10px] leading-tight text-center px-1">{SCALE_LABELS[val]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nav Controls */}
        <div className="w-full max-w-2xl flex justify-between items-center mt-6 px-2">
          <button 
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-jatham-maroon/40 hover:text-jatham-maroon transition-colors disabled:opacity-0"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
          
          <div className="flex gap-1">
            {QUESTIONS.slice(0, Math.min(10, totalQuestions)).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex % 10 ? 'bg-jatham-maroon w-3' : answers[QUESTIONS[i].id] ? 'bg-jatham-gold' : 'bg-jatham-cream'}`} />
            ))}
            {totalQuestions > 10 && <span className="text-xs text-jatham-text/30">...</span>}
          </div>

          {currentIndex === totalQuestions - 1 ? (
            <button 
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="flex items-center gap-2 bg-jatham-maroon text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Submit</>}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1))}
              className="flex items-center gap-2 text-jatham-maroon/60 hover:text-jatham-maroon transition-colors"
            >
              Skip <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* IPIP Note */}
        <div className="w-full max-w-2xl mt-8 bg-jatham-cream/50 p-4 rounded-2xl flex gap-3 text-xs text-jatham-maroon/50">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Based on the IPIP Big Five personality model. There are no right or wrong answers — honest responses improve the quality of your compatibility matches. At least 80% completion required.</p>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
