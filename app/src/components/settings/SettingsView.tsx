import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Camera,
  ChevronRight,

  Lock,
  Calendar,
  BadgeCheck,
  LogOut
} from 'lucide-react';
import { getProfile, uploadAvatarImage, updatePassword, updateProfile, logError } from '@/lib/supabase';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { toast } from 'sonner';
import type { UserPreferences } from '@/types';

interface SettingsViewProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  profileData?: any;
  onLogout?: () => void;
}

export default function SettingsView({ userId, userName = 'User', userEmail = '', userRole = 'student', profileData, onLogout }: SettingsViewProps) {
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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
   const [isSavingProfile, setIsSavingProfile] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<UserPreferences>({
    emailNotifications: true,
    deadlineReminders: true,
    interviewReminders: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (!isEditingProfile) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved profile changes. Are you sure you wish to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditingProfile]);

  useEffect(() => {
    if (profileData) {
      setProfile(prev => ({
        ...prev,
        fullName: profileData.full_name || profileData.fullName || prev.fullName,
        university: profileData.university || '',
        major: profileData.major || '',
        graduation_year: profileData.graduation_year?.toString() || '',
        avatar_url: profileData.avatar_url || '',
        joined_at: profileData.created_at || '',
        dob: profileData.dob || '',
        merit: profileData.merit || '',
        additional_data: profileData.additional_data || '',
        signup_date: profileData.signup_date || profileData.created_at?.split('T')[0] || '',
      }));
      if (profileData.preferences) {
        setNotifications(prev => ({
          ...prev,
          ...(profileData.preferences as UserPreferences),
        }));
      }
    } else if (userId) {
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
          if (data.preferences) {
            setNotifications(prev => ({
              ...prev,
              ...(data.preferences as UserPreferences),
            }));
          }
        }
      }).catch((err: any) => console.error("Could not load profile", err));
    }
  }, [userId, profileData]);

  useEffect(() => {
    if (userEmail) {
      setProfile(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    
    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password.');
      logError({
        errorType: 'password_change',
        errorMessage: error.message || 'Password update failed',
        errorStack: error.stack,
        actionAttempted: 'handlePasswordChange',
        userId: userId,
        role: userRole as any
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(userId, {
        full_name: profile.fullName,
        university: profile.university,
        major: profile.major,
        graduation_year: parseInt(profile.graduation_year) || null,
        dob: profile.dob || null,
        merit: profile.merit,
        additional_data: profile.additional_data,
      });
      toast.success('Professional identity synchronized.');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
      logError({
        errorType: 'profile_update',
        errorMessage: error.message || 'Profile sync failed',
        errorStack: error.stack,
        actionAttempted: 'handleSaveProfile',
        userId: userId,
        role: userRole as any
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB.');

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatarImage(file, userId);
      // Persist the avatar URL to the profiles table in the database
      await updateProfile(userId, { avatar_url: publicUrl });
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile photo updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo.');
      logError({
        errorType: 'avatar_upload',
        errorMessage: error.message || 'Photo upload failed',
        errorStack: error.stack,
        actionAttempted: 'handleFileChange',
        userId: userId,
        role: userRole as any
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left"
      >
        <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-4">
          Settings.
        </h1>
        <p className="text-[20px] text-apple-near-black/50 dark:text-white/40 font-medium tracking-tight">
          Personalize your professional identity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          className="lg:col-span-2 mc-stadium-card p-10 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm border border-zinc-800">
              <User size={24} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-[24px] font-medium tracking-tight text-zinc-900">Identity Profile</h2>
              <div className="flex items-center gap-2">
                {isEditingProfile && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="px-5 py-2 rounded-xl text-[14px] font-bold bg-apple-blue text-white shadow-lg shadow-apple-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {isSavingProfile ? <InlineLoader size={16} /> : 'Save Changes'}
                  </button>
                )}
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`px-5 py-2 rounded-xl text-[14px] font-medium transition-all ${
                    isEditingProfile 
                      ? 'bg-zinc-50 text-zinc-500 hover:text-zinc-900 border border-zinc-200' 
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'
                  }`}
                >
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-zinc-100 pb-12">
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-zinc-50 flex items-center justify-center text-[32px] font-medium text-zinc-400 border border-zinc-200 overflow-hidden shadow-sm">
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-zinc-900 text-white shadow-md flex items-center justify-center hover:bg-zinc-800 transition-colors border border-zinc-800 disabled:opacity-50"
              >
                {isUploading ? <InlineLoader size={18} /> : <Camera size={18} />}
              </button>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-[20px] font-medium text-zinc-900 mb-1">Profile Photo</h3>
              <p className="text-[14px] text-zinc-500">High resolution suggested. Visible in shared reports.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
              {isEditingProfile ? (
                 <input type="text" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none" />
              ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900">{profile.fullName || '—'}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
              <div className="px-5 py-3 text-[16px] font-medium text-zinc-500 flex items-center gap-2">
                {profile.email}
                <Lock size={14} className="opacity-50" />
              </div>
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">University</label>
              {isEditingProfile ? (
                <input type="text" value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none" placeholder="e.g. Stanford University" />
              ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900">{profile.university || '—'}</p>}
            </div>

            {/* Discipline */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Discipline</label>
              {isEditingProfile ? (
                <input type="text" value={profile.major} onChange={(e) => setProfile({ ...profile, major: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none" placeholder="e.g. Computer Science" />
              ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900">{profile.major || '—'}</p>}
            </div>

            {/* Graduation */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Grad Year</label>
              {isEditingProfile ? (
                 <input type="number" value={profile.graduation_year} onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none" />
              ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900">{profile.graduation_year || '—'}</p>}
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Date of Birth</label>
              {isEditingProfile ? (
                <input type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none" />
              ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900">{profile.dob || '—'}</p>}
            </div>

            {/* Merit */}
            <div className="space-y-2 md:col-span-2 border-t border-zinc-100 pt-6">
               <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Merit & Achievements</label>
               {isEditingProfile ? (
                <textarea rows={3} value={profile.merit} onChange={(e) => setProfile({ ...profile, merit: e.target.value })} className="w-full px-5 py-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-[16px] text-zinc-900 focus:outline-none resize-none" placeholder="GPA, Awards etc..." />
               ) : <p className="px-5 py-3 text-[16px] font-medium text-zinc-900 whitespace-pre-wrap">{profile.merit || '—'}</p>}
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-8 flex flex-col">
          {/* Account Card */}
          <motion.div className="mc-stadium-card p-8 bg-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200">
                <Shield size={24} />
              </div>
              <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Security</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-zinc-400" />
                  <span className="text-[14px] font-medium text-zinc-600">Access Role</span>
                </div>
                <span className="text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-zinc-100 text-zinc-600">
                  {userRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-zinc-400" />
                  <span className="text-[14px] font-medium text-zinc-600">Joined</span>
                </div>
                <span className="text-[14px] text-zinc-500">
                  {profile.joined_at ? new Date(profile.joined_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100">
              {!showPasswordSection ? (
                <button onClick={() => setShowPasswordSection(true)} className="w-full flex items-center justify-between py-2 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                  <span className="flex items-center gap-3"><Lock size={18} /> Change Password</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">New PWD</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-[14px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">Confirm PWD</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-[14px]" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handlePasswordChange} disabled={isChangingPassword} className="flex-1 bg-zinc-900 text-white rounded-xl py-2 text-[13px] font-semibold flex justify-center items-center">
                      {isChangingPassword ? <InlineLoader size={14} /> : 'Update'}
                    </button>
                    <button onClick={() => { setShowPasswordSection(false); setNewPassword(''); }} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[13px] font-semibold">Cancel</button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Notifications Card */}
          <motion.div className="mc-stadium-card p-8 bg-zinc-900 border-zinc-800 flex-1 flex flex-col text-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white shadow-sm border border-zinc-700">
                <Bell size={24} />
              </div>
              <h2 className="text-[20px] font-medium tracking-tight">Alerts</h2>
            </div>
            <div className="space-y-6">
              {[
                { key: 'emailNotifications', label: 'Email Outreach', desc: 'Direct updates to your inbox' },
                { key: 'deadlineReminders', label: 'Timeline Alerts', desc: '48hr warning before expirations' },
                { key: 'interviewReminders', label: 'Live Events', desc: 'Preparation alerts before meetings' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[15px] font-medium text-white">{item.label}</p>
                    <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <button onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof UserPreferences] }))} className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${notifications[item.key as keyof UserPreferences] ? 'bg-zinc-100' : 'bg-zinc-800 border border-zinc-700'}`}>
                    <motion.div className={`w-4 h-4 rounded-full absolute top-1 ${notifications[item.key as keyof UserPreferences] ? 'bg-zinc-900' : 'bg-zinc-500'}`} animate={{ left: notifications[item.key as keyof UserPreferences] ? '24px' : '4px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sign Out Card */}
          <motion.div 
            className="mc-stadium-card p-6 bg-white border border-red-500/10 flex items-center justify-between group cursor-pointer hover:bg-red-50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            onClick={onLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                <LogOut size={20} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-red-600">Sign Out</p>
                <p className="text-[11px] text-red-400 font-medium uppercase tracking-widest">Terminate current session</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
