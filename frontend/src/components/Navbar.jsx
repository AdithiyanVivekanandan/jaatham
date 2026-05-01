import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { LogOut, Languages, Settings, Heart, Home, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/saved', icon: Heart, label: 'Saved' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Navbar = () => {
  const { i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-jatham-gold/10 px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-jatham-maroon rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold">J</div>
          <span className="text-xl font-serif text-jatham-maroon hidden sm:block">Jatham</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-jatham-maroon text-white' : 'text-jatham-text/60 hover:text-jatham-maroon hover:bg-jatham-cream'}`}
              >
                <Icon className="w-4 h-4" /> {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="p-2 hover:bg-jatham-cream rounded-xl transition-colors text-jatham-text/60 hover:text-jatham-maroon flex items-center gap-1 text-xs font-bold uppercase"
            title="Toggle language"
          >
            <Languages className="w-4 h-4" />
            {i18n.language === 'en' ? 'EN' : 'தமிழ்'}
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden p-2 hover:bg-jatham-cream rounded-xl transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5 text-jatham-maroon" /> : <Menu className="w-5 h-5 text-jatham-maroon" />}
          </button>

          {/* Logout — desktop */}
          {user && (
            <button 
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden fixed top-[73px] inset-x-0 z-40 bg-white border-b border-jatham-gold/10 shadow-xl p-4 space-y-2"
          >
            {NAV_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-jatham-cream text-jatham-text font-medium"
                >
                  <Icon className="w-5 h-5 text-jatham-maroon" /> {link.label}
                </Link>
              );
            })}
            <hr className="border-jatham-gold/10" />
            <button 
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 font-medium"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
