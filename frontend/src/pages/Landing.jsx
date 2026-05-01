import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Shield, Brain, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';
import heroBg from '../assets/images/hero-bg.png';

const FEATURES = [
  {
    icon: Star,
    title: 'All 10 Poruthams',
    desc: 'Complete Vedic compatibility check — Dina, Gana, Yoni, Rasi, Rajju, Vedha, and all others with weighted scoring.'
  },
  {
    icon: Brain,
    title: 'AI Synthesis Report',
    desc: 'Claude AI converts complex astrological rules into a human-readable, culturally-sensitive compatibility analysis.'
  },
  {
    icon: Shield,
    title: 'Dosha Detection',
    desc: 'Automatic Chevvai Dosham, Nadi Dosham, and Rajju analysis with samyam (cancellation) verification.'
  },
  {
    icon: FileText,
    title: 'Astrologer PDF',
    desc: 'Export a complete 6-page PDF including birth charts, Porutham tables, and blank astrologer notes sections.'
  }
];

const PORUTHAMS = [
  'Dina', 'Gana', 'Yoni', 'Rasi', 'Rasi Athipathi',
  'Rajju', 'Vedha', 'Vasya', 'Mahendra', 'Stree Deergha'
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-jatham-bg">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-jatham-gold/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-jatham-maroon rounded-xl text-white flex items-center justify-center font-serif text-xl font-bold">J</div>
          <span className="text-xl font-serif text-jatham-maroon">Jatham</span>
        </div>
        <Link 
          to="/login"
          className="bg-jatham-maroon text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-jatham-maroon/90 transition-all shadow-lg shadow-jatham-maroon/20"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-jatham-bg/75" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-jatham-gold/10 border border-jatham-gold/20 px-4 py-2 rounded-full text-jatham-terracotta text-sm font-medium">
              <Star className="w-4 h-4 fill-jatham-gold text-jatham-gold" />
              South Indian Vedic Matchmaking Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl text-jatham-maroon leading-tight">
              Decision Intelligence <br/>
              <span className="text-jatham-terracotta italic">for Marriage</span>
            </h1>
            
            <p className="text-xl text-jatham-text/70 leading-relaxed max-w-xl">
              The complete Thirumana Porutham engine — all 10 compatibility checks, Dosha analysis, AI-generated insights, and professional PDF reports. Built for Tamil families who value tradition and transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 bg-jatham-maroon text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl shadow-jatham-maroon/30 hover:bg-jatham-maroon/90 hover:gap-3 transition-all"
              >
                Start Matching <ChevronRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features"
                className="flex items-center justify-center gap-2 bg-white border border-jatham-gold/20 text-jatham-maroon px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-jatham-cream transition-all"
              >
                Learn More
              </a>
            </div>
            
            <div className="flex items-center gap-6 pt-4">
              <div className="text-center">
                <p className="text-2xl font-serif text-jatham-maroon">10</p>
                <p className="text-xs text-jatham-text/50 uppercase tracking-wider font-medium">Poruthams</p>
              </div>
              <div className="w-[1px] h-8 bg-jatham-gold/20" />
              <div className="text-center">
                <p className="text-2xl font-serif text-jatham-maroon">3</p>
                <p className="text-xs text-jatham-text/50 uppercase tracking-wider font-medium">Dosha Checks</p>
              </div>
              <div className="w-[1px] h-8 bg-jatham-gold/20" />
              <div className="text-center">
                <p className="text-2xl font-serif text-jatham-maroon">AI</p>
                <p className="text-xs text-jatham-text/50 uppercase tracking-wider font-medium">Powered Report</p>
              </div>
            </div>
          </motion.div>
          
          {/* 10 Poruthams Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 border border-jatham-gold/10 shadow-2xl"
          >
            <h3 className="text-xl text-jatham-maroon mb-6 text-center">All 10 Poruthams</h3>
            <div className="grid grid-cols-2 gap-3">
              {PORUTHAMS.map((p, i) => (
                <div key={p} className="flex items-center gap-2 bg-jatham-cream/50 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-jatham-text font-medium">{p}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-jatham-maroon/5 border border-jatham-maroon/10 rounded-2xl">
              <p className="text-xs text-center text-jatham-maroon/60 italic leading-relaxed">
                "This compatibility analysis is a decision support tool only. Always verify results with a qualified Jyotish astrologer."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl text-jatham-maroon">Built for Families Who Care</h2>
          <p className="text-jatham-text/60 text-lg max-w-2xl mx-auto">Every feature designed around the way South Indian families actually approach marriage matching.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[2rem] border border-jatham-gold/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 bg-jatham-maroon/10 rounded-2xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-jatham-maroon" />
                </div>
                <h3 className="text-lg text-jatham-maroon mb-3">{f.title}</h3>
                <p className="text-jatham-text/60 text-sm leading-relaxed font-sans">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-jatham-maroon py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8 relative z-10">
          <h2 className="text-4xl">Our Core Philosophy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Rule-Based Engine', desc: 'Not ML. Our Porutham engine is 100% deterministic and follows traditional Vedic rules exactly.' },
              { title: 'Honest Language', desc: 'We never say "perfect match" or "guaranteed". Every output uses "tendency toward" and "advisory" language.' },
              { title: 'Astrologer Alliance', desc: 'Every result exports a PDF designed for a human astrologer to review and annotate.' },
            ].map(c => (
              <div key={c.title} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl mb-3 text-jatham-gold">{c.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed font-sans">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center space-y-8">
        <h2 className="text-4xl text-jatham-maroon">Ready to Begin?</h2>
        <p className="text-jatham-text/60 text-lg max-w-xl mx-auto">Join families who use Jatham for thorough, transparent, and culturally-appropriate matrimonial matching.</p>
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 bg-jatham-maroon text-white px-10 py-5 rounded-2xl font-semibold text-lg shadow-2xl shadow-jatham-maroon/30 hover:bg-jatham-maroon/90 hover:gap-3 transition-all"
        >
          Get Started — It's Free <ChevronRight className="w-6 h-6" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-jatham-cream border-t border-jatham-gold/10 py-10 px-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-jatham-maroon rounded-lg text-white flex items-center justify-center font-serif text-lg font-bold">J</div>
          <span className="text-lg font-serif text-jatham-maroon">Jatham</span>
        </div>
        <p className="text-jatham-text/40 text-sm max-w-2xl mx-auto font-sans">
          Jatham is a decision support tool for Thirumana Porutham compatibility. Results are not a guarantee of marital compatibility. Always consult a qualified Jyotish astrologer. By using this platform you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="text-jatham-text/30 text-xs">&copy; 2026 Jatham Matrimonial. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
