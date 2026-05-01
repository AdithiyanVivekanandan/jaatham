import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, MapPin, GraduationCap, Briefcase, Languages, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';

const profileSchema = z.object({
  candidateName: z.string().min(2, 'Name is too short').max(100),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  timeOfBirth: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM'),
  placeOfBirth: z.string().min(2, 'Location is required'),
  motherTongue: z.enum(['tamil', 'telugu', 'kannada', 'malayalam']),
  education: z.string().min(2, 'Education is required'),
  profession: z.string().min(2, 'Profession is required'),
  calculationMethod: z.enum(['thirukkanitha', 'vakyam']).default('thirukkanitha'),
});

const ProfileCreation = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const updateUser = useAuthStore((state) => state.updateUser);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      calculationMethod: 'thirukkanitha',
      gender: 'male',
      motherTongue: 'tamil'
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/profiles', data);
      updateUser({ profileId: res.data._id });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create profile. Please check your details.');
      // If error is related to validation, maybe go back to the step
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-2xl text-jatham-maroon">Basic Information</h2>
              <p className="text-jatham-terracotta/60 text-sm italic">Let's start with the basics for your matrimonial profile.</p>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-jatham-gold" /> Candidate Name
                  </label>
                  <input 
                    {...register('candidateName')}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                    placeholder="Enter full name"
                  />
                  {errors.candidateName && <p className="text-red-500 text-xs">{errors.candidateName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                    Gender
                  </label>
                  <div className="flex gap-4">
                    {['male', 'female'].map((g) => (
                      <label key={g} className="flex-1">
                        <input 
                          type="radio" 
                          value={g} 
                          {...register('gender')} 
                          className="hidden peer"
                        />
                        <div className="text-center py-3 rounded-xl border border-jatham-gold/20 peer-checked:border-jatham-maroon peer-checked:bg-jatham-maroon peer-checked:text-white capitalize cursor-pointer transition-all">
                          {g}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-jatham-gold" /> Mother Tongue
                  </label>
                  <select 
                    {...register('motherTongue')}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  >
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="kannada">Kannada</option>
                    <option value="malayalam">Malayalam</option>
                  </select>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={nextStep}
              className="w-full flex items-center justify-center gap-2 bg-jatham-maroon text-white py-4 rounded-xl font-semibold"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-2xl text-jatham-maroon">Birth Details</h2>
              <p className="text-jatham-terracotta/60 text-sm italic">Accurate birth info is essential for Vedic compatibility.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-jatham-gold" /> Date of Birth
                  </label>
                  <input 
                    type="date"
                    {...register('dateOfBirth')}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-jatham-gold" /> Time of Birth
                  </label>
                  <input 
                    type="time"
                    {...register('timeOfBirth')}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  />
                  {errors.timeOfBirth && <p className="text-red-500 text-xs">{errors.timeOfBirth.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-jatham-gold" /> Place of Birth
                </label>
                <input 
                  {...register('placeOfBirth')}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  placeholder="e.g. Madurai, Tamil Nadu"
                />
                {errors.placeOfBirth && <p className="text-red-500 text-xs">{errors.placeOfBirth.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                  Calculation Method
                </label>
                <select 
                  {...register('calculationMethod')}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                >
                  <option value="thirukkanitha">Thirukkanitha (Modern/Precise)</option>
                  <option value="vakyam">Vakyam (Traditional/Ancient)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="flex-1 flex items-center justify-center gap-2 bg-jatham-cream text-jatham-maroon py-4 rounded-xl font-semibold"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button 
                type="button" 
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-2 bg-jatham-maroon text-white py-4 rounded-xl font-semibold"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-2xl text-jatham-maroon">Education & Career</h2>
              <p className="text-jatham-terracotta/60 text-sm italic">Provide details about the candidate's professional background.</p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-jatham-gold" /> Education
                </label>
                <input 
                  {...register('education')}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  placeholder="e.g. B.Tech Computer Science"
                />
                {errors.education && <p className="text-red-500 text-xs">{errors.education.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-jatham-text ml-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-jatham-gold" /> Profession
                </label>
                <input 
                  {...register('profession')}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-jatham-gold/20 focus:border-jatham-maroon outline-none transition-all"
                  placeholder="e.g. Software Engineer"
                />
                {errors.profession && <p className="text-red-500 text-xs">{errors.profession.message}</p>}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="flex-1 flex items-center justify-center gap-2 bg-jatham-cream text-jatham-maroon py-4 rounded-xl font-semibold"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-jatham-maroon text-white py-4 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Profile'}
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-jatham-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex justify-between items-center px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= s ? 'bg-jatham-maroon text-white' : 'bg-jatham-cream text-jatham-maroon/30 border border-jatham-gold/10'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`h-[2px] w-12 sm:w-20 transition-all ${step > s ? 'bg-jatham-maroon' : 'bg-jatham-gold/20'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-jatham-gold/10 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreation;
