import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Activity,
  TrendingUp,
  Building2,
  BarChart3,
  Clock,
  Mail,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  adminGetStats,
  adminGetAllUsers,
  adminGetCompanyDistribution,
  adminGetStatusDistribution,
  adminGetPipelineFunnel,
  adminGetRecentApplications
} from '@/lib/supabase';
import type {
  AdminStats,
  UserActivity,
  CompanyStats,
  StatusDistribution,
  PipelineStage,
  AdminRecentApplication
} from '@/types';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  'Applied': '#0071e3',
  'Phone Screen': '#5856d6',
  'Interview': '#ff9f0a',
  'Technical': '#ff375f',
  'Offer': '#30d158',
  'Rejected': '#8e8e93',
  'Withdrawn': '#636366',
  'Ghosted': '#48484a',
};

const PIPELINE_COLORS = ['#0071e3', '#5856d6', '#ff9f0a', '#30d158'];

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [recentApps, setRecentApps] = useState<AdminRecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('last_login_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, u, c, sd, p, r] = await Promise.all([
        adminGetStats(),
        adminGetAllUsers(),
        adminGetCompanyDistribution(),
        adminGetStatusDistribution(),
        adminGetPipelineFunnel(),
        adminGetRecentApplications(),
      ]);
      setStats(s);
      setUsers(u);
      setCompanies(c);
      setStatusDist(sd);
      setPipeline(p);
      setRecentApps(r);
    } catch (err: any) {
      console.error('Admin data error:', err);
      toast.error('Failed to load admin analytics. Check service key configuration.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedUsers = [...users]
    .filter(u => {
      if (!userFilter) return true;
      const q = userFilter.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.university?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Applied': 'bg-blue-500/10 text-blue-500',
      'Phone Screen': 'bg-indigo-500/10 text-indigo-500',
      'Interview': 'bg-amber-500/10 text-amber-500',
      'Technical': 'bg-rose-500/10 text-rose-500',
      'Offer': 'bg-emerald-500/10 text-emerald-500',
      'Rejected': 'bg-gray-500/10 text-gray-500',
      'Withdrawn': 'bg-gray-500/10 text-gray-400',
      'Ghosted': 'bg-gray-500/10 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={40} className="animate-spin text-purple-500" />
        <p className="text-[17px] text-apple-near-black/40 dark:text-white/40">Loading admin analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} />
          </div>
          <h1 className="display-hero text-apple-near-black dark:text-white">Admin Panel.</h1>
        </div>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          System-wide analytics and user management.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats?.totalUsers || 0, icon: <Users size={20} />, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
          { label: 'Total Applications', value: stats?.totalApplications || 0, icon: <Briefcase size={20} />, color: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
          { label: 'Active (7d)', value: stats?.activeUsersLast7Days || 0, icon: <Activity size={20} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
          { label: 'Offer Rate', value: `${stats?.offerRate || 0}%`, icon: <TrendingUp size={20} />, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="apple-card p-6 bg-white dark:bg-apple-near-black apple-card-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg ${stat.shadow}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-[32px] font-bold text-apple-near-black dark:text-white tracking-tight">{stat.value}</p>
            <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Pie */}
        <motion.div
          className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white mb-6 tracking-apple-tight flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-500" />
            Status Distribution
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={55}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8e8e93'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      color: '#1d1d1f',
                    }}
                    formatter={(value: any, name: any) => [`${value} apps`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-2">
              {statusDist.map((item) => (
                <div key={item.status} className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[item.status] || '#8e8e93' }} />
                    <span className="text-[14px] text-apple-near-black/70 dark:text-white/70 font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-apple-near-black dark:text-white">{item.count}</span>
                    <span className="text-[12px] font-medium text-apple-near-black/30 dark:text-white/30 w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pipeline Funnel */}
        <motion.div
          className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white mb-6 tracking-apple-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            Application Pipeline
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#86868b', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fill: '#86868b', fontSize: 13, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: '#1d1d1f',
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {pipeline.map((_, index) => (
                    <Cell key={`pipe-${index}`} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Company Distribution */}
      {companies.length > 0 && (
        <motion.div
          className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white mb-6 tracking-apple-tight flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" />
            Students per Company
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companies.slice(0, 12)} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="company_name"
                  tick={{ fill: '#86868b', fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#86868b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: '#1d1d1f',
                  }}
                />
                <Bar dataKey="application_count" name="Applications" fill="#0071e3" radius={[8, 8, 0, 0]} />
                <Bar dataKey="student_count" name="Students" fill="#5856d6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white tracking-apple-tight flex items-center gap-2">
            <Users size={20} className="text-purple-500" />
            All Users ({users.length})
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-near-black/30 dark:text-white/30" />
              <input
                type="text"
                placeholder="Filter users..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-apple-gray dark:bg-zinc-900 text-[14px] font-medium focus:ring-2 focus:ring-purple-500/20 border-none transition-all w-48 text-apple-near-black dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-8 px-8">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {[
                  { key: 'full_name', label: 'User' },
                  { key: 'university', label: 'University' },
                  { key: 'application_count', label: 'Apps' },
                  { key: 'login_count', label: 'Logins' },
                  { key: 'last_login_at', label: 'Last Active' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left py-3 px-2 text-[12px] font-bold text-apple-near-black/40 dark:text-white/40 uppercase tracking-widest cursor-pointer hover:text-apple-blue transition-colors select-none"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedUsers.map((u, i) => (
                  <motion.tr
                    key={u.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-black/3 dark:border-white/3 hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-apple-near-black dark:text-white">{u.full_name}</p>
                          {u.role === 'admin' && (
                            <span className="text-[9px] font-bold bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                          )}
                        </div>
                        <p className="text-[12px] text-apple-near-black/40 dark:text-white/40 flex items-center gap-1">
                          <Mail size={10} /> {u.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[13px] text-apple-near-black/60 dark:text-white/60">{u.university || '—'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[14px] font-bold text-apple-near-black dark:text-white">{u.application_count}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[14px] font-medium text-apple-near-black/60 dark:text-white/60">{u.login_count}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[13px] text-apple-near-black/40 dark:text-white/40">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12 text-apple-near-black/30 dark:text-white/30 text-[15px]">
            No users match the current filter.
          </div>
        )}
      </motion.div>

      {/* Recent Applications */}
      {recentApps.length > 0 && (
        <motion.div
          className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white mb-6 tracking-apple-tight flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Recent Applications (All Users)
          </h3>
          <div className="space-y-3">
            {recentApps.slice(0, 10).map((app, i) => (
              <motion.div
                key={app.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-black/2 dark:hover:bg-white/2 transition-colors border-b border-black/3 dark:border-white/3 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.03 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-apple-near-black dark:text-white truncate">{app.company_name}</p>
                    <ArrowUpRight size={12} className="text-apple-near-black/20 dark:text-white/20 flex-shrink-0" />
                    <p className="text-[13px] text-apple-near-black/50 dark:text-white/50 truncate">{app.job_title}</p>
                  </div>
                  <p className="text-[12px] text-apple-near-black/30 dark:text-white/30 mt-0.5">
                    by {app.applicant_name} · {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${getStatusBadge(app.status)}`}>
                  {app.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
