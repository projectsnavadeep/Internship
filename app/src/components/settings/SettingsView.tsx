import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Camera,
  ChevronRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  BadgeCheck
} from 'lucide-react';
import { getProfile, updateProfile, uploadAvatarImage, updatePassword } from '@/lib/supabase';
import { toast } from 'sonner';
import type { UserPreferences } from '@/types';

interface SettingsViewProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function SettingsView({ userId, userName = 'User', userEmail = '', userRole = 'student' }: SettingsViewProps) {
  const [profile, setProfile] = useState({
    fullName: userName,
    email: userEmail,
    university: '',
    major: '',
    graduation_year: '',
    avatar_url: '',
    joined_at: '',
    dob: '',
    merit: '',
    additional_data: '',
    signup_date: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<UserPreferences>({
    emailNotifications: true,
    deadlineReminders: true,
    interviewReminders: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (userId) {
      getProfile(userId).then(data => {
        if (data) {
          setProfile(prev => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            university: data.university || '',
            major: data.major || '',
            graduation_year: data.graduation_year?.toString() || '',
            avatar_url: data.avatar_url || '',
            joined_at: data.created_at || '',
            dob: data.dob || '',
            merit: data.merit || '',
            additional_data: data.additional_data || '',
            signup_date: data.signup_date || data.created_at?.split('T')[0] || '',
          }));
          // Load saved preferences
          if (data.preferences) {
            setNotifications(prev => ({
              ...prev,
              ...(data.preferences as UserPreferences),
            }));
          }
        }
      }).catch(err => console.error("Could not load profile", err));
    }
  }, [userId]);

  // Keep email in sync
  useEffect(() => {
    if (userEmail) {
      setProfile(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  const handleSave = async () => {
    if (!userId) return toast.error('You must be logged in to save settings.');
    setIsLoading(true);
    try {
      await updateProfile(userId, {
        full_name: profile.fullName,
        university: profile.university,
        major: profile.major,
        graduation_year: parseInt(profile.graduation_year) || null,
        avatar_url: profile.avatar_url,
        dob: profile.dob || null,
        merit: profile.merit || '',
        additional_data: profile.additional_data || '',
        signup_date: profile.signup_date || null,
        preferences: notifications,
      });
      setIsEditingProfile(false);
      toast.success('Settings saved successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    
    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB.');
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatarImage(file, userId);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile photo updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white mb-2">Settings.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          Personalize your professional console.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          className="lg:col-span-2 apple-card p-10 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-apple-blue flex items-center justify-center text-white shadow-lg shadow-apple-blue/20">
              <User size={24} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">Identity Profile</h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`px-4 py-2 rounded-full text-[14px] font-bold transition-all ${
                  isEditingProfile 
                    ? 'bg-apple-near-black text-white dark:bg-white dark:text-apple-near-black' 
                    : 'bg-apple-gray text-apple-near-black dark:bg-zinc-800 dark:text-white hover:bg-apple-blue hover:text-white'
                }`}
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="relative group">
              <div className="w-28 h-28 rounded-[40px] bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-[38px] font-bold text-apple-near-black dark:text-white shadow-inner transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-apple-blue text-white shadow-lg flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
                whileTap={{ scale: 0.9 }}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              </motion.button>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-[21px] font-bold text-apple-near-black dark:text-white">Profile Photo</h3>
              <p className="text-[15px] font-medium text-apple-near-black/30 dark:text-white/30 tracking-apple-tight">High resolution suggested. Visible in shared reports.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Full Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.fullName || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Email</label>
              <div className="px-5 py-3 text-[17px] font-medium text-apple-near-black/40 dark:text-white/40 flex items-center gap-2">
                {profile.email}
                <Lock size={14} className="opacity-50" />
              </div>
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">College / University</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                  placeholder="e.g. Stanford University"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.university || '—'}</p>
              )}
            </div>

            {/* Discipline */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Discipline</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                  placeholder="e.g. Computer Science"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.major || '—'}</p>
              )}
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Graduation Year</label>
              {isEditingProfile ? (
                <input
                  type="number"
                  value={profile.graduation_year}
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                  placeholder="e.g. 2025"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.graduation_year || '—'}</p>
              )}
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Date of Birth</label>
              {isEditingProfile ? (
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.dob || '—'}</p>
              )}
            </div>

            {/* Signup Date */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Date of Signing Up</label>
              {isEditingProfile ? (
                <input
                  type="date"
                  value={profile.signup_date}
                  onChange={(e) => setProfile({ ...profile, signup_date: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.signup_date || '—'}</p>
              )}
            </div>

            {/* Merit */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Merit / Performance</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profile.merit}
                  onChange={(e) => setProfile({ ...profile, merit: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white"
                  placeholder="e.g. 3.9 GPA / Top 5%"
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white">{profile.merit || '—'}</p>
              )}
            </div>

            {/* Additional Data */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Additional Information</label>
              {isEditingProfile ? (
                <textarea
                  value={profile.additional_data}
                  onChange={(e) => setProfile({ ...profile, additional_data: e.target.value })}
                  rows={3}
                  className="w-full px-5 py-4 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white resize-none"
                  placeholder="Any other certifications, awards, or details..."
                />
              ) : (
                <p className="px-5 py-3 text-[17px] font-medium text-apple-near-black dark:text-white whitespace-pre-wrap">{profile.additional_data || 'No additional data provided.'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Account Info Card */}
          <motion.div
            className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Shield size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">Account</h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-apple-near-black/30 dark:text-white/30" />
                  <span className="text-[14px] font-medium text-apple-near-black/60 dark:text-white/60">Role</span>
                </div>
                <span className={`text-[13px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  userRole === 'admin' 
                    ? 'bg-purple-500/10 text-purple-500' 
                    : 'bg-apple-blue/10 text-apple-blue'
                }`}>
                  {userRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-apple-near-black/30 dark:text-white/30" />
                  <span className="text-[14px] font-medium text-apple-near-black/60 dark:text-white/60">Joined</span>
                </div>
                <span className="text-[13px] font-bold text-apple-near-black/40 dark:text-white/40">
                  {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            {/* Password Change */}
            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
              {!showPasswordSection ? (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="w-full flex items-center justify-between py-3 text-[15px] font-medium text-apple-near-black/60 dark:text-white/60 hover:text-apple-blue transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Lock size={18} />
                    Change Password
                  </span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[15px] text-apple-near-black dark:text-white pr-10"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-near-black/30 dark:text-white/30 hover:text-apple-blue transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-apple-near-black/50 dark:text-white/50 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium text-[15px] text-apple-near-black dark:text-white pr-10"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-near-black/30 dark:text-white/30 hover:text-apple-blue transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="flex-1 apple-pill-filled text-[14px] py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isChangingPassword ? <Loader2 size={14} className="animate-spin" /> : 'Update'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordSection(false); setNewPassword(''); setConfirmPassword(''); }}
                      className="px-4 py-2 rounded-full text-[14px] font-medium text-apple-near-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Notifications Card */}
          <motion.div
            className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-apple-near-black dark:bg-white flex items-center justify-center text-white dark:text-apple-near-black shadow-lg">
                <Bell size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">Alerts</h2>
            </div>

            <div className="space-y-6 flex-1">
              {[
                { key: 'emailNotifications', label: 'Email Outreach', desc: 'Direct updates to your inbox' },
                { key: 'deadlineReminders', label: 'Timeline Alerts', desc: '48hr warning before expirations' },
                { key: 'interviewReminders', label: 'Live Events', desc: 'Preparation alerts before meetings' },
                { key: 'weeklyDigest', label: 'Weekly Summary', desc: 'Consolidated performance report' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">{item.label}</p>
                    <p className="text-[12px] font-medium text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof UserPreferences]
                    }))}
                    className={`
                      w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0
                      ${notifications[item.key as keyof UserPreferences] ? 'bg-apple-blue' : 'bg-apple-gray dark:bg-zinc-800'}
                    `}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                      animate={{
                        left: notifications[item.key as keyof UserPreferences] ? '22px' : '2px'
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Action Row */}
        <div className="lg:col-span-3 flex justify-end pt-8">
           <button
            onClick={handleSave}
            disabled={isLoading}
            className="apple-pill-filled px-12 h-14 text-[17px] group flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Update Configuration'}
            {!isLoading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </div>
    </div>
  );
}
