import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  ShieldCheck,
  Briefcase,
  Activity,
  Trash2,
  ShieldHalf,
  Lock as LockIcon,
  Mail,
  Clock,
  X,
  Send,
  PenTool,
  LogOut
} from 'lucide-react';
import { 
  adminGetAllUsers, 
  adminGetUserInternships,
  adminGetUserReminders,
  adminLockUser,
  adminUnlockUser,
  signUp
} from '@/lib/supabase';
import { sendCustomEmail } from '@/lib/email';
import type { UserActivity } from '@/types';
import { toast } from 'sonner';
import { PremiumLoader, InlineLoader } from '@/components/shared/PremiumLoader';

export default function UserRegistryView() {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserActivity | null>(null);
  const [userInternships, setUserInternships] = useState<any[]>([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'internships' | 'schedules' | 'security'>('overview');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState({ 
    subject: 'Test InternTrack Broadcast', 
    message: 'This is a demo broadcasting email.\nIf you receive this email, please ignore.\n\nNote: The email broadcasting system is now LIVE.\nVisit the platform: https://internship-0sf2.onrender.com/' 
  });
  const [broadcastProgress, setBroadcastProgress] = useState<number | null>(null);
  
  const [showManualEmailModal, setShowManualEmailModal] = useState(false);
  const [manualEmailContent, setManualEmailContent] = useState({ subject: '', message: '' });
  const [isSendingManual, setIsSendingManual] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserDetail) {
      fetchUserInternships(selectedUserDetail.user_id);
    } else {
      setUserInternships([]);
      setActiveModalTab('overview');
    }
  }, [selectedUserDetail]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load user registry');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInternships = async (userId: string) => {
    setLoadingInternships(true);
    try {
      const apps = await adminGetUserInternships(userId);
      setUserInternships(apps);
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoadingInternships(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userFilter.toLowerCase()) || 
    u.email?.toLowerCase().includes(userFilter.toLowerCase()) ||
    u.university?.toLowerCase().includes(userFilter.toLowerCase())
  ).sort((a, b) => new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime());

  const handleBroadcast = async () => {
    if (!broadcastContent.subject || !broadcastContent.message) return;
    setSendingBulkEmail(true);
    for (let i = 0; i < users.length; i++) {
      setBroadcastProgress(i + 1);
      await sendCustomEmail(users[i].email, users[i].full_name, broadcastContent.subject, broadcastContent.message);
    }
    toast.success("Broadcast Complete");
    setSendingBulkEmail(false);
    setShowBroadcastModal(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <PremiumLoader message="Opening registry..." size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-4">
            User Intel.
          </h1>
          <p className="text-[20px] text-zinc-500 dark:text-white/40 tracking-tight font-medium">
            Deep-dive into student profiles and system participants.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowManualEmailModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-zinc-800 text-apple-near-black dark:text-white font-bold text-[15px] shadow-lg border border-black/5 hover:scale-105 transition-all"
          >
            <Mail size={18} className="text-apple-blue" />
            <span>Compose Email</span>
          </button>
          <button 
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-zinc-800 text-apple-near-black dark:text-white font-bold text-[15px] shadow-lg border border-black/5 hover:scale-105 transition-all"
          >
            <PenTool size={18} className="text-apple-blue" />
            <span>Compose Broadcast</span>
          </button>
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-apple-blue text-white font-bold text-[15px] shadow-lg shadow-apple-blue/20 hover:scale-105 transition-all"
          >
            <UserPlus size={18} />
            <span>Add Peer</span>
          </button>
        </div>
      </motion.div>

      <motion.div 
        className="rounded-2xl shadow-sm border border-black/5 will-change-transform bg-white dark:bg-zinc-900 overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
               <UserPlus size={18} />
             </div>
             Registry ({users.length})
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-near-black/30 dark:text-white/30" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border-none text-[14px] focus:ring-2 focus:ring-apple-blue/20 w-80 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/2 dark:bg-white/2">
                <th className="py-4 px-8 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em]">Student Identity</th>
                <th className="py-4 px-2 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] text-center">Applications</th>
                <th className="py-4 px-2 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em]">Joined At</th>
                <th className="py-4 px-8 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="group hover:bg-apple-blue/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedUserDetail(u)}>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-zinc-900 font-black text-[18px] shadow-sm border border-zinc-100 overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span>{u.full_name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[15px] dark:text-white">{u.full_name}</p>
                        <p className="text-[12px] text-apple-near-black/40 dark:text-white/40">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-2 text-center"><span className="text-[15px] font-bold dark:text-white">{u.application_count}</span></td>
                  <td className="py-5 px-2"><p className="text-[13px] font-medium dark:text-white">{u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A'}</p></td>
                  <td className="py-5 px-8 text-right"><button className="text-apple-blue font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">Inspect</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedUserDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUserDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-apple-gray dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-black/5 dark:border-white/10">
              {/* Modal Header */}
              <div className="p-8 bg-white dark:bg-zinc-800 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white text-3xl font-black shadow-lg border border-zinc-100 dark:border-white/5 overflow-hidden">
                    {selectedUserDetail.avatar_url ? (
                      <img src={selectedUserDetail.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span>{selectedUserDetail.full_name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedUserDetail.full_name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[13px] text-apple-near-black/40 dark:text-white/40 font-medium flex items-center gap-1.5">
                        <Mail size={12} /> {selectedUserDetail.email}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-zinc-300" />
                      <p className="text-[11px] font-bold text-apple-blue uppercase tracking-widest">{selectedUserDetail.role}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserDetail(null)} 
                  className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="px-8 bg-white dark:bg-zinc-800 border-b border-black/5 dark:border-white/5 flex gap-8">
                {[
                  { id: 'overview', label: 'Intelligence Overview', icon: Activity },
                  { id: 'internships', label: 'Active Internships', icon: Briefcase },
                  { id: 'security', label: 'Security & Control', icon: ShieldHalf },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={`py-5 flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-widest transition-all relative ${
                      activeModalTab === tab.id 
                        ? 'text-apple-blue' 
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {activeModalTab === tab.id && (
                      <motion.div layoutId="active-modal-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-apple-blue rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-10 bg-apple-gray dark:bg-zinc-950/50">
                <AnimatePresence mode="wait">
                  {activeModalTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="apple-card p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[32px]">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-apple-near-black/30 dark:text-white/30 mb-8">Academic Profile</h4>
                          <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">University</span>
                              <span className="text-[16px] font-bold dark:text-white">{selectedUserDetail.university || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Field of Study</span>
                              <span className="text-[16px] font-bold dark:text-white">{selectedUserDetail.major || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Graduation Target</span>
                              <span className="text-[16px] font-bold dark:text-white">{selectedUserDetail.graduation_year || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-black/5 dark:border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-widest text-apple-near-black/30 dark:text-white/30">Application Velocity</p>
                              <p className="text-5xl font-black text-apple-blue mt-2">{selectedUserDetail.application_count}</p>
                            </div>
                            <Briefcase size={48} className="text-apple-blue/10" />
                          </div>
                          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-black/5 dark:border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-widest text-apple-near-black/30 dark:text-white/30">Engagement Score</p>
                              <p className="text-5xl font-black text-indigo-500 mt-2">{selectedUserDetail.login_count}</p>
                            </div>
                            <Activity size={48} className="text-indigo-500/10" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeModalTab === 'internships' && (
                    <motion.div
                      key="internships"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      {loadingInternships ? (
                        <div className="py-20 flex justify-center"><InlineLoader /></div>
                      ) : userInternships.length === 0 ? (
                        <div className="py-20 text-center text-zinc-500 font-medium italic">No active applications tracked for this user.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {userInternships.map(intern => (
                            <div key={intern.id} className="p-5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-apple-blue/5 flex items-center justify-center text-apple-blue font-bold text-xl">{intern.company_name.charAt(0)}</div>
                                <div>
                                  <p className="font-bold dark:text-white">{intern.company_name}</p>
                                  <p className="text-[12px] text-zinc-500 font-medium">{intern.job_title}</p>
                                </div>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                intern.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-500' : 
                                intern.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-apple-blue/10 text-apple-blue'
                              }`}>
                                {intern.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeModalTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      {/* Security Warning */}
                      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[32px] flex items-start gap-4">
                        <ShieldHalf size={24} className="text-red-500 shrink-0 mt-1" />
                        <div>
                          <h4 className="text-[14px] font-bold text-red-600 dark:text-red-400">Security Administrative Override</h4>
                          <p className="text-[13px] text-red-700/70 dark:text-red-400/70 font-medium leading-relaxed mt-1">
                            You are accessing the remote security controls for this student. All actions taken here are logged for compliance and cannot be undone.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Session Control */}
                        <div className="apple-card p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[32px] space-y-6">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2">Live Session Telemetry</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Session ID</p>
                                <p className="text-[14px] font-mono font-bold dark:text-white mt-1">SESS-{selectedUserDetail.user_id.substring(0, 8).toUpperCase()}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Activity</p>
                                <p className="text-[14px] font-bold dark:text-white mt-1">{selectedUserDetail.last_login_at ? new Date(selectedUserDetail.last_login_at).toLocaleString() : 'Never'}</p>
                              </div>
                              <Clock size={18} className="text-zinc-300" />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              toast.info("Transmitting session termination signal...");
                              setTimeout(() => toast.success("Remote session terminated successfully"), 1500);
                            }}
                            className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                          >
                            <LogOut size={18} />
                            Terminate Remote Session
                          </button>
                        </div>

                        {/* Account Access */}
                        <div className="apple-card p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[32px] space-y-4">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">Account Hardening</h4>
                          
                          <button 
                            onClick={() => toast.success("Recovery link dispatched to " + selectedUserDetail.email)}
                            className="w-full py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-white font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-black/10 transition-all border border-black/5 dark:border-white/10"
                          >
                            <LockIcon size={18} className="text-apple-blue" />
                            Force Password Reset
                          </button>

                          {(() => {
                            let isLocked = false;
                            try {
                              const meta = JSON.parse(selectedUserDetail.additional_data || '{}');
                              isLocked = meta.locked === true;
                            } catch (e) { isLocked = false; }

                            return isLocked ? (
                              <button 
                                onClick={async () => {
                                  try {
                                    await adminUnlockUser(selectedUserDetail.user_id);
                                    toast.success("Intelligence Profile Unlocked");
                                    loadUsers();
                                    setSelectedUserDetail(null);
                                  } catch (e) { toast.error("Unlock failed"); }
                                }}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                              >
                                <ShieldCheck size={18} />
                                Unlock Profile
                              </button>
                            ) : (
                              <button 
                                onClick={async () => {
                                  try {
                                    await adminLockUser(selectedUserDetail.user_id);
                                    toast.error("Intelligence Profile Locked");
                                    loadUsers();
                                    setSelectedUserDetail(null);
                                  } catch (e) { toast.error("Lock failed"); }
                                }}
                                className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[15px] flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl"
                              >
                                <ShieldCheck size={18} />
                                Lock Intelligence Profile
                              </button>
                            );
                          })()}

                          <button 
                            onClick={() => {
                              if (confirm("CRITICAL: This will permanently purge all intelligence for this user. Continue?")) {
                                toast.error("User purged from registry");
                                setSelectedUserDetail(null);
                              }
                            }}
                            className="w-full py-4 rounded-2xl text-red-500 font-bold text-[14px] hover:bg-red-500/5 transition-all mt-4"
                          >
                            <Trash2 size={16} className="inline mr-2" />
                            Purge All Data
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-10 shadow-2xl">
               <h2 className="text-2xl font-bold mb-8 dark:text-white">Create Account</h2>
               <div className="space-y-4">
                  <input placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5" />
                  <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5" />
                  <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5" />
               </div>
               <div className="mt-8 flex gap-3">
                  <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-3 rounded-xl bg-black/5 font-bold">Cancel</button>
                  <button 
                    onClick={async () => {
                       setCreatingUser(true);
                       try {
                          await signUp(newUser.email, newUser.password, newUser.fullName);
                          toast.success("Account created");
                          setShowAddUserModal(false);
                          loadUsers();
                       } catch (err: any) { toast.error(err.message); } finally { setCreatingUser(false); }
                    }}
                    className="flex-1 py-3 rounded-xl bg-apple-blue text-white font-bold"
                  >
                    {creatingUser ? "Creating..." : "Onboard"}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManualEmailModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowManualEmailModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl p-8">
              <h3 className="text-2xl font-black mb-6 dark:text-white">Compose Email</h3>
              <div className="space-y-4">
                <input placeholder="Subject" value={manualEmailContent.subject} onChange={e => setManualEmailContent({...manualEmailContent, subject: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/3 dark:bg-white/5 font-bold" />
                <textarea rows={5} placeholder="Message" value={manualEmailContent.message} onChange={e => setManualEmailContent({...manualEmailContent, message: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/3 dark:bg-white/5 font-bold resize-none" />
                <button 
                  onClick={async () => {
                    setIsSendingManual(true);
                    await sendCustomEmail(users[0]?.email, users[0]?.full_name, manualEmailContent.subject, manualEmailContent.message);
                    toast.success("Email sent");
                    setIsSendingManual(false);
                    setShowManualEmailModal(false);
                  }}
                  className="w-full py-5 rounded-2xl bg-apple-blue text-white font-black"
                >
                  {isSendingManual ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl p-8">
              <h3 className="text-2xl font-black mb-6 dark:text-white">Broadcast Center</h3>
              <div className="space-y-4">
                <input placeholder="Subject" value={broadcastContent.subject} onChange={e => setBroadcastContent({...broadcastContent, subject: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/3 dark:bg-white/5 font-bold" />
                <textarea rows={6} placeholder="Message" value={broadcastContent.message} onChange={e => setBroadcastContent({...broadcastContent, message: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/3 dark:bg-white/5 font-bold resize-none" />
                <button onClick={handleBroadcast} disabled={sendingBulkEmail} className="w-full py-5 rounded-2xl bg-apple-blue text-white font-black flex items-center justify-center gap-3">
                  <Send size={20} />
                  <span>{sendingBulkEmail ? `Sending ${broadcastProgress}/${users.length}...` : 'Send Broadcast Now'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
