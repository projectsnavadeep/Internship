import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  UserPlus, 
  Loader2,
  ShieldCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Activity,
  Trash2,
  ShieldHalf,
  Lock as LockIcon,
  Mail,
  Clock,
  X
} from 'lucide-react';
import { 
  adminGetAllUsers, 
  adminGetUserInternships,
  adminGetUserReminders,
  signUp
} from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';
import type { UserActivity } from '@/types';
import { toast } from 'sonner';

export default function UserRegistryView() {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserActivity | null>(null);
  const [userInternships, setUserInternships] = useState<any[]>([]);
  const [userSchedules, setUserSchedules] = useState<any[]>([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'internships' | 'schedules' | 'security'>('overview');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserDetail) {
      fetchUserInternships(selectedUserDetail.user_id);
      fetchUserSchedules(selectedUserDetail.user_id);
    } else {
      setUserInternships([]);
      setUserSchedules([]);
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

  const fetchUserSchedules = async (userId: string) => {
    setLoadingSchedules(true);
    try {
      const schedules = await adminGetUserReminders(userId);
      setUserSchedules(schedules);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const formatScheduleTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatScheduleDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userFilter.toLowerCase()) || 
    u.email?.toLowerCase().includes(userFilter.toLowerCase()) ||
    u.university?.toLowerCase().includes(userFilter.toLowerCase())
  ).sort((a, b) => new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={40} className="animate-spin text-purple-500" />
        <p className="text-apple-near-black/40 dark:text-white/40">Opening registry...</p>
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
          <h1 className="display-hero text-apple-near-black dark:text-white">User Intel.</h1>
          <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
            Deep-dive into student profiles and system participants.
          </p>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-apple-blue text-white font-bold text-[15px] shadow-lg shadow-apple-blue/20 hover:scale-105 transition-all"
        >
          <UserPlus size={18} />
          <span>Add Peer</span>
        </button>
      </motion.div>

      {/* Registry Table Shell */}
      <motion.div 
        className="apple-card bg-white dark:bg-apple-near-black overflow-hidden border border-black/5 dark:border-white/5"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
               <Users size={18} />
             </div>
             Registry ({users.length})
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-near-black/30 dark:text-white/30" size={18} />
              <input
                type="text"
                placeholder="Search by name, email or university..."
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
                <th className="py-4 px-8 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5">Student Identity</th>
                <th className="py-4 px-2 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5 text-center">Applications</th>
                <th className="py-4 px-2 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5">Joined At</th>
                <th className="py-4 px-2 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5">Last Activity</th>
                <th className="py-4 px-8 text-[11px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.user_id} 
                  className="group hover:bg-apple-blue/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedUserDetail(u)}
                >
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-apple-blue to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-zinc-900 border border-black/5 overflow-hidden">
                        {u.avatar_url ? (
                           <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <span className="text-[16px]">{u.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[15px] dark:text-white">{u.full_name}</p>
                          {u.role === 'admin' && (
                             <span className="text-[9px] font-black bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                          )}
                        </div>
                        <p className="text-[12px] text-apple-near-black/40 dark:text-white/40">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-2 text-center">
                     <span className="text-[15px] font-bold dark:text-white">{u.application_count}</span>
                  </td>
                  <td className="py-5 px-2">
                     <p className="text-[13px] font-medium dark:text-white">
                        {u.joined_at ? new Date(u.joined_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Unknown'}
                     </p>
                  </td>
                  <td className="py-5 px-2">
                     <p className="text-[13px] font-medium dark:text-white">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                     </p>
                     <p className="text-[11px] text-apple-near-black/30">
                        {u.login_count} sessions total
                     </p>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <button className="text-apple-blue font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Identity Detail Modal */}
      <AnimatePresence>
        {selectedUserDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-apple-gray dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden border border-black/10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 bg-white dark:bg-zinc-800 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-apple-blue to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden border-2 border-white dark:border-zinc-800">
                    {selectedUserDetail.avatar_url ? (
                      <img src={selectedUserDetail.avatar_url} className="w-full h-full object-cover" alt={selectedUserDetail.full_name || ''} />
                    ) : (
                      selectedUserDetail.full_name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black dark:text-white tracking-tight">{selectedUserDetail.full_name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-apple-near-black/40 dark:text-white/40 font-medium">{selectedUserDetail.email}</p>
                      <div className="w-1 h-1 rounded-full bg-black/10" />
                      <p className="text-apple-blue font-bold text-sm uppercase tracking-widest">{selectedUserDetail.role}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                      {[
                        { id: 'overview', label: 'Overview', icon: <Users size={14} /> },
                        { id: 'internships', label: 'Internships', icon: <Briefcase size={14} /> },
                        { id: 'schedules', label: 'Schedules', icon: <Clock size={14} /> },
                        { id: 'security', label: 'Security', icon: <ShieldHalf size={14} /> }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveModalTab(tab.id as any)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                            activeModalTab === tab.id 
                            ? 'bg-white dark:bg-zinc-700 text-apple-blue shadow-sm' 
                            : 'text-apple-near-black/40 dark:text-white/40 hover:text-apple-near-black'
                          }`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                   </div>
                   <button 
                     onClick={() => setSelectedUserDetail(null)}
                     className="px-6 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 transition-all font-bold text-[14px] text-mc-ink-black/60 gap-2 border border-black/5"
                   >
                     Exit <X size={16} />
                   </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-12 bg-apple-gray dark:bg-zinc-900">
                {activeModalTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <section className="space-y-8">
                        <div className="flex items-center gap-2 text-[11px] font-black text-apple-near-black/30 uppercase tracking-[0.2em] mb-4">
                           <CalendarDays size={14} /> Academic Standing
                        </div>
                        <div className="apple-card p-8 bg-white dark:bg-zinc-800 space-y-6">
                           <div className="flex justify-between items-center py-3 border-b border-black/5">
                              <span className="text-[15px] font-medium text-apple-near-black/50">University</span>
                              <span className="font-bold dark:text-white">{selectedUserDetail.university || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center py-3 border-b border-black/5">
                              <span className="text-[15px] font-medium text-apple-near-black/50">Field of Study</span>
                              <span className="font-bold dark:text-white">{selectedUserDetail.major || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center py-3">
                              <span className="text-[15px] font-medium text-apple-near-black/50">Graduation</span>
                              <span className="font-bold dark:text-white">{selectedUserDetail.graduation_year || 'N/A'}</span>
                           </div>
                        </div>
                     </section>

                     <section className="space-y-8">
                        <div className="flex items-center gap-2 text-[11px] font-black text-apple-near-black/30 uppercase tracking-[0.2em] mb-4">
                           <Activity size={14} /> System Engagement
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 text-center">
                              <p className="text-3xl font-black text-apple-blue">{selectedUserDetail.application_count}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-apple-near-black/40 mt-1">Applications</p>
                           </div>
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 text-center">
                              <p className="text-3xl font-black text-indigo-500">{selectedUserDetail.login_count}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-apple-near-black/40 mt-1">Sessions</p>
                           </div>
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 col-span-2 flex items-center justify-between">
                              <div className="text-left">
                                 <p className="text-[13px] font-bold dark:text-white">Active Status</p>
                                 <p className="text-[11px] text-apple-near-black/40">Last seen {selectedUserDetail.last_login_at ? new Date(selectedUserDetail.last_login_at).toLocaleDateString() : 'Never'}</p>
                              </div>
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                           </div>
                        </div>
                     </section>
                  </div>
                )}

                {activeModalTab === 'internships' && (
                  <div className="space-y-6">
                     <h3 className="text-lg font-bold dark:text-white border-b border-black/5 pb-4 mb-6">Full Internship History</h3>
                     {loadingInternships ? (
                       <div className="flex justify-center py-20"><Loader2 className="animate-spin text-apple-blue" /></div>
                     ) : userInternships.length > 0 ? (
                       <div className="space-y-4">
                         {userInternships.map(app => (
                           <div key={app.id} className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-black/5 flex items-center justify-between group hover:border-apple-blue/30 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-black/3 dark:bg-zinc-700 flex items-center justify-center text-apple-blue"><Building2 size={24} /></div>
                                 <div>
                                    <h4 className="font-bold text-[17px] dark:text-white">{app.company_name}</h4>
                                    <p className="text-[13px] text-apple-near-black/40 font-medium">{app.job_title} · {new Date(app.applied_date).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                                app.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-500' : 
                                app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' : 
                                'bg-apple-blue/10 text-apple-blue'
                              }`}>
                                {app.status}
                              </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                        <div className="text-center py-32 border-2 border-dashed border-black/5 rounded-[40px] text-apple-near-black/30 font-medium">
                           No application records found for this student.
                        </div>
                     )}
                  </div>
                )}

                {activeModalTab === 'schedules' && (
                  <div className="space-y-6">
                     <h3 className="text-lg font-bold dark:text-white border-b border-black/5 pb-4 mb-6 flex items-center gap-3">
                       <Clock size={20} className="text-apple-blue" />
                       Calendar & Scheduled Events
                     </h3>
                     {loadingSchedules ? (
                       <div className="flex justify-center py-20"><Loader2 className="animate-spin text-apple-blue" /></div>
                     ) : userSchedules.length > 0 ? (
                       <div className="space-y-4">
                         {userSchedules.map((schedule: any) => {
                           const isPast = new Date(schedule.reminder_date) < new Date();
                           return (
                             <div key={schedule.id} className={`p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-black/5 flex items-center justify-between group transition-all ${
                               isPast ? 'opacity-50' : 'hover:border-apple-blue/30'
                             } ${schedule.is_completed ? 'line-through opacity-40' : ''}`}>
                                <div className="flex items-center gap-4">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${
                                     schedule.reminder_type === 'Interview' ? 'bg-gradient-to-br from-orange-400 to-rose-500' :
                                     schedule.reminder_type === 'Deadline' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                     schedule.reminder_type === 'Follow-up' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                     'bg-gradient-to-br from-emerald-400 to-teal-500'
                                   }`}>
                                     <Clock size={22} />
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-[17px] dark:text-white">{schedule.title}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[13px] text-apple-near-black/40 font-medium">{formatScheduleDate(schedule.reminder_date)}</span>
                                        <span className="w-1 h-1 rounded-full bg-black/20" />
                                        <span className="text-[13px] font-bold text-apple-blue">{formatScheduleTime(schedule.reminder_date)}</span>
                                      </div>
                                      {schedule.description && (
                                        <p className="text-[12px] text-apple-near-black/30 mt-1 max-w-md truncate">{schedule.description}</p>
                                      )}
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                                    schedule.reminder_type === 'Interview' ? 'bg-orange-500/10 text-orange-500' :
                                    schedule.reminder_type === 'Deadline' ? 'bg-rose-500/10 text-rose-500' :
                                    schedule.reminder_type === 'Follow-up' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {schedule.reminder_type}
                                  </span>
                                  {isPast && !schedule.is_completed && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-red-500/10 text-red-500">Overdue</span>
                                  )}
                                </div>
                             </div>
                           );
                         })}
                       </div>
                     ) : (
                        <div className="text-center py-32 border-2 border-dashed border-black/5 rounded-[40px] text-apple-near-black/30 font-medium">
                           No scheduled events found for this student.
                        </div>
                     )}
                  </div>
                )}

                {activeModalTab === 'security' && (
                  <div className="max-w-xl mx-auto space-y-12">
                     <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-apple-near-black/30 mb-6 font-mono">Peer Security Audit</h4>
                        <div className="space-y-4">
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 flex items-center justify-between border border-black/5">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck size={20} /></div>
                                 <div>
                                    <p className="font-bold dark:text-white">Account Status</p>
                                    <p className="text-[12px] opacity-50 font-medium">Verified Identity</p>
                                 </div>
                              </div>
                              <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-1 rounded">ACTIVE</span>
                           </div>
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 flex items-center justify-between border border-black/5 opacity-50 grayscale">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center text-apple-blue"><LockIcon size={20} /></div>
                                 <p className="font-bold dark:text-white">Two-Factor Auth</p>
                              </div>
                              <span className="text-[10px] font-black uppercase text-apple-near-black/40">DISABLED</span>
                           </div>
                           
                           {/* Welcome Email Manual Send */}
                           <div className="apple-card p-6 bg-white dark:bg-zinc-800 flex items-center justify-between border border-black/5">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Mail size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold dark:text-white">Onboarding Email</p>
                                    <p className="text-[12px] opacity-50 font-medium">
                                       {selectedUserDetail.welcome_email_sent ? 'Sent successfully' : 'Not sent yet'}
                                    </p>
                                 </div>
                              </div>
                              <button
                                onClick={async () => {
                                  setSendingEmail(selectedUserDetail.user_id);
                                  try {
                                    const success = await sendWelcomeEmail(
                                      selectedUserDetail.user_id,
                                      selectedUserDetail.email,
                                      selectedUserDetail.full_name
                                    );
                                    if (success) {
                                      toast.success("Welcome email dispatched.");
                                      loadUsers();
                                    } else {
                                      toast.error("Failed to dispatch email.");
                                    }
                                  } catch (err) {
                                    toast.error("Email relay failure.");
                                  } finally {
                                    setSendingEmail(null);
                                  }
                                }}
                                disabled={sendingEmail === selectedUserDetail.user_id}
                                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                  selectedUserDetail.welcome_email_sent 
                                  ? 'bg-black/5 text-black/40 hover:bg-black/10' 
                                  : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105'
                                }`}
                              >
                                {sendingEmail === selectedUserDetail.user_id ? 'SENDING...' : selectedUserDetail.welcome_email_sent ? 'RESEND' : 'SEND NOW'}
                              </button>
                           </div>
                        </div>
                     </section>

                     <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-apple-near-black/30 mb-6 font-mono">Account Tenure</h4>
                        <div className="p-8 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 text-center">
                           <p className="text-sm font-medium text-indigo-500/70 mb-2 italic">Member of the Internship Network since</p>
                           <p className="text-[20px] font-black text-indigo-600">
                             {selectedUserDetail.joined_at ? new Date(selectedUserDetail.joined_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Unknown'}
                           </p>
                        </div>
                     </section>

                     <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            if (confirm(`CRITICAL: Are you sure you want to delete ${selectedUserDetail.full_name}?`)) {
                              const wipe = confirm("LEVEL 2 DELETE: Do you want to wipe ALL database records (Applications, Details) permanently? Click OK for Level 2 (Total Wipe), or CANCEL for Level 1 (Account Only).");
                              try {
                                const { adminDeleteUser } = await import('@/lib/supabase');
                                await adminDeleteUser(selectedUserDetail.user_id, wipe);
                                toast.success("User successfully removed from system.");
                                setSelectedUserDetail(null);
                                loadUsers();
                              } catch (err) {
                                toast.error("System failure during deletion.");
                              }
                            }
                          }}
                          className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold text-[15px] shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                          <Trash2 size={18} /> 
                          <span>Terminate Access</span>
                        </button>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showAddUserModal && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-10 shadow-2xl">
               <h2 className="text-2xl font-bold mb-2 dark:text-white">Create Account</h2>
               <p className="text-sm text-apple-near-black/40 mb-8 font-medium">Manually onboard a new student to the system.</p>
               <div className="space-y-4">
                  <input placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border-none" />
                  <input placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border-none" />
                  <input placeholder="Initial Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border-none" />
               </div>
               <div className="mt-8 flex gap-3">
                  <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-3 rounded-xl bg-black/5 font-bold">Cancel</button>
                  <button 
                    onClick={async () => {
                       setCreatingUser(true);
                       try {
                          const data = await signUp(newUser.email, newUser.password, newUser.fullName);
                          toast.success("Account initialized successfully.");
                          if (data?.user) {
                            sendWelcomeEmail(data.user.id, newUser.email, newUser.fullName, newUser.password);
                          }
                          setShowAddUserModal(false);
                          setNewUser({ fullName: '', email: '', password: '' });
                          loadUsers();
                       } catch (err: any) {
                          toast.error(err.message || "Failed to create user.");
                       } finally {
                          setCreatingUser(false);
                       }
                    }}
                    disabled={creatingUser}
                    className="flex-1 py-3 rounded-xl bg-apple-blue text-white font-bold"
                  >
                    {creatingUser ? "Creating..." : "Onboard"}
                  </button>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  );
}
