import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Toaster, toast } from 'sonner';
import { Sidebar } from '@/components/shared/Sidebar';
import { LoadingView } from '@/components/shared/LoadingView';
import { ViewSkeletons } from '@/components/shared/ViewSkeletons';
import { 
  getApplications, 
  getProfile, 
  getReminders, 
  getApplicationStats,
  updateApplication,
  createApplication,
  logError
} from '@/lib/supabase';
import type { Application, Profile, Reminder, ApplicationStats } from '@/types';

// Lazy load views for better performance
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ApplicationList = lazy(() => import('@/components/applications/ApplicationList').then(m => ({ default: m.ApplicationList })));
const CalendarView = lazy(() => import('@/components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));
const DocumentsView = lazy(() => import('@/components/documents/DocumentsView').then(m => ({ default: m.DocumentsView })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const UserRegistryView = lazy(() => import('@/components/admin/UserRegistryView').then(m => ({ default: m.UserRegistryView })));
const SecurityConsole = lazy(() => import('@/components/admin/SecurityConsole').then(m => ({ default: m.SecurityConsole })));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const ErrorLogsView = lazy(() => import('@/components/admin/ErrorLogsView').then(m => ({ default: m.ErrorLogsView })));
const AuthForm = lazy(() => import('@/components/auth/AuthForm').then(m => ({ default: m.AuthForm })));
const ApplicationModal = lazy(() => import('@/components/applications/ApplicationModal').then(m => ({ default: m.ApplicationModal })));
const ApplicationDetails = lazy(() => import('@/components/applications/ApplicationDetails').then(m => ({ default: m.ApplicationDetails })));

export default function App() {
  const { user, loading: authLoading, login, register, logout, isAuthenticated, isAdmin, hasSessionHint } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return localStorage.getItem('activeTab') || 'dashboard';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [selectedAppNotes, setSelectedAppNotes] = useState<any[]>([]);

  // State for data
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total_applications: 0,
    active_interviews: 0,
    pending_offers: 0,
    success_rate: 0
  });

  // Track tab changes for persistence and hash-routing
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    window.location.hash = activeTab;
  }, [activeTab]);

  // Sync hash routing with tab state
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      console.log('[App] Loading data for:', user.id);
      const [appsData, profileData, remindersData, statsData] = await Promise.all([
        getApplications(user.id),
        getProfile(user.id),
        getReminders(user.id),
        getApplicationStats(user.id)
      ]);

      setApplications(appsData || []);
      setProfile(profileData);
      setReminders(remindersData || []);
      setStats(statsData);
    } catch (error: any) {
      console.error('Critical data error:', error);
      toast.error('Sync failure. Some data may be missing.');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Smart Routing for Admins on mount/session load
  useEffect(() => {
    const hasInitialTab = sessionStorage.getItem('initial_tab_set');
    if (isAuthenticated && isAdmin && activeTab === 'dashboard' && !hasInitialTab) {
      setActiveTab('admin');
      sessionStorage.setItem('initial_tab_set', 'true');
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const u = await login(email, password);
      toast.success('Welcome back!');
      if (u?.role === 'admin') setActiveTab('admin');
      else setActiveTab('dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      await register(email, password, fullName);
      toast.success('Professional account created.');
      setActiveTab('dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  }, [register]);

  const handleSaveApplication = async (data: Partial<Application>) => {
    try {
      if (editingApp) {
        const updated = await updateApplication(editingApp.id, data);
        setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await createApplication({ ...data, user_id: user?.id });
        setApplications(prev => [created, ...prev]);
      }
      loadData();
    } catch (error: any) {
      toast.error('Failed to save application');
    }
  };

  const [showAuthForm, setShowAuthForm] = useState(false);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const timer = setTimeout(() => setShowAuthForm(true), hasSessionHint ? 800 : 0);
      return () => clearTimeout(timer);
    } else {
      setShowAuthForm(false);
    }
  }, [authLoading, isAuthenticated, hasSessionHint]);

  // Loading States
  if (authLoading && !isAuthenticated && hasSessionHint) {
    return (
      <div className="min-h-screen bg-mc-canvas-cream flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} isAdmin={isAdmin} />
        <main className="flex-1 p-8 pt-24 md:pt-32"><ViewSkeletons /></main>
      </div>
    );
  }

  if (authLoading && !isAuthenticated && !hasSessionHint) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[100]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-white animate-pulse" />
          </div>
          <h2 className="text-white font-bold text-xl tracking-tight">Initializing Identity</h2>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated && showAuthForm) {
    return (
      <div className="min-h-screen bg-mc-canvas-cream flex items-center justify-center p-4">
        <Suspense fallback={<LoadingView />}><AuthForm onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} /></Suspense>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-mc-canvas-cream flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} isAdmin={isAdmin} />
        <main className="flex-1 p-8 pt-24 md:pt-32"><ViewSkeletons /></main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard applications={applications} reminders={reminders} stats={stats} />;
      case 'applications': return <ApplicationList applications={applications} onEdit={setEditingApp} onView={setViewingApp} />;
      case 'calendar': return <CalendarView applications={applications} reminders={reminders} onRefresh={loadData} />;
      case 'documents': return <DocumentsView userId={user?.id} />;
      case 'settings': return <SettingsView userId={user?.id} userName={user?.user_metadata?.full_name} userEmail={user?.email} userRole={user?.role} />;
      case 'admin': return isAdmin ? <AdminOverview /> : null;
      case 'users': return isAdmin ? <UserRegistryView /> : null;
      case 'security': return isAdmin ? <SecurityConsole /> : null;
      case 'admin-settings': return isAdmin ? <AdminSettings /> : null;
      case 'error-logs': return isAdmin ? <ErrorLogsView adminId={user?.id} /> : null;
      default: return <Dashboard applications={applications} reminders={reminders} stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen relative bg-zinc-50 dark:bg-zinc-950 text-zinc-900 flex">
      <Toaster position="top-right" />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} userName={user?.user_metadata?.full_name} collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} isAdmin={isAdmin} />
      <main className="flex-1 min-h-screen p-4 md:px-8 mt-16 md:mt-32 transition-all duration-300 w-full overflow-x-hidden pb-24 md:pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <Suspense fallback={<LoadingView message={`Loading ${activeTab}...`} />}>{renderContent()}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Suspense fallback={null}>
        <ApplicationModal isOpen={showAppModal} onClose={() => setShowAppModal(false)} onSave={handleSaveApplication} application={editingApp} userId={user?.id} />
        {viewingApp && <ApplicationDetails application={viewingApp} isOpen={!!viewingApp} onClose={() => setViewingApp(null)} />}
      </Suspense>
    </div>
  );
}
