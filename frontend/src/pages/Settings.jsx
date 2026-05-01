import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { 
  Languages, ToggleLeft, ToggleRight, Trash2, LogOut, 
  Shield, Bell, ChevronRight, AlertTriangle, Loader2 
} from 'lucide-react';

const Settings = () => {
  const { i18n } = useTranslation();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [calculationMethod, setCalculationMethod] = useState('thirukkanitha');
  const [notifications, setNotifications] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put('/users/me', { defaultCalculationMethod: calculationMethod });
      // Also update the profile's calculation method preference
      await apiClient.put('/profiles/me', {});
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiClient.delete('/users/me');
      logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  return (
    <div className="min-h-screen bg-jatham-bg">
      <Navbar />
      
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl text-jatham-maroon font-serif">Settings</h1>
          <p className="text-jatham-text/50 text-sm mt-1">{user?.phone}</p>
        </div>

        {/* Language Settings */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-jatham-gold/10 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-jatham-maroon" />
            <h2 className="text-lg text-jatham-maroon font-serif">Language / மொழி</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-jatham-cream/40 rounded-2xl">
            <div>
              <p className="font-semibold text-jatham-text">Interface Language</p>
              <p className="text-sm text-jatham-text/50">Currently: {i18n.language === 'en' ? 'English' : 'தமிழ்'}</p>
            </div>
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-jatham-maroon text-white px-5 py-2 rounded-xl text-sm font-semibold"
            >
              Switch to {i18n.language === 'en' ? 'தமிழ்' : 'English'}
            </button>
          </div>
        </motion.section>

        {/* Calculation Method */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-jatham-gold/10 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-jatham-maroon" />
            <h2 className="text-lg text-jatham-maroon font-serif">Calculation Method</h2>
          </div>
          
          <p className="text-sm text-jatham-text/60">Choose the Panchangam system for birth chart calculation. This affects your Nakshatra and all Porutham results.</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'thirukkanitha', label: 'Thirukkanitha', desc: 'Modern/Precise (Default)' },
              { value: 'vakyam', label: 'Vakyam', desc: 'Traditional/Ancient' }
            ].map(opt => (
              <button 
                key={opt.value}
                onClick={() => setCalculationMethod(opt.value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${calculationMethod === opt.value ? 'border-jatham-maroon bg-jatham-maroon/5' : 'border-jatham-gold/10 hover:border-jatham-maroon/30'}`}
              >
                <p className="font-bold text-jatham-maroon text-sm">{opt.label}</p>
                <p className="text-xs text-jatham-text/50 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          
          <div className="bg-amber-50 p-3 rounded-xl flex gap-2 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Changing calculation method will recalculate your birth chart. Existing match results may change.
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-jatham-maroon text-white py-3 rounded-xl font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
          </button>
        </motion.section>

        {/* Account Management */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-jatham-gold/10 shadow-sm space-y-4"
        >
          <h2 className="text-lg text-jatham-maroon font-serif">Account</h2>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-between p-4 bg-jatham-cream/40 rounded-2xl hover:bg-jatham-cream transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-jatham-maroon" />
              <span className="font-semibold text-jatham-text">Sign Out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-jatham-text/30" />
          </button>
        </motion.section>

        {/* Danger Zone */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg text-red-700 font-serif">Danger Zone</h2>
          </div>
          
          <p className="text-sm text-red-600/70">Permanently delete your account, profile, and all match history. This action cannot be undone and complies with the DPDP Act 2023.</p>
          
          {!deleteConfirm ? (
            <button 
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-600 border border-red-200 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete My Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-bold">Are you absolutely sure? This will permanently erase all your data.</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-bold"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete Everything'}
                </button>
                <button 
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 bg-white text-jatham-text border border-jatham-gold/20 py-3 rounded-xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.section>

        {/* Legal Links */}
        <div className="text-center space-y-2 pb-8">
          <div className="flex justify-center gap-4 text-xs text-jatham-text/40">
            <a href="#" className="hover:text-jatham-maroon">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-jatham-maroon">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-jatham-maroon">DPDP Compliance</a>
          </div>
          <p className="text-xs text-jatham-text/30">Jatham v1.0 | DPDP Act 2023 compliant</p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
