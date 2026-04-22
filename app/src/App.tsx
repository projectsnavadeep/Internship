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
  deleteApplication,
  getInterviewNotes,
  createInterviewNote,
  deleteInterviewNote
} from '@/lib/supabase';
import type { Application, Reminder, ApplicationStats, InterviewNote } from '@/types';

// Lazy load views
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ApplicationList = lazy(() => import('@/components/applications/ApplicationList').then(m => ({ default: m.ApplicationList })));
const CalendarView = lazy(() => import('@/components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));
const DocumentsView = lazy(() => import('@/components/documents/DocumentsView').then(m => ({ default: m.DocumentsView })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const UserRegistryView = lazy(() => import('@/components/admin/UserRegistryView'));
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
  const [selectedAppNotes, setSelectedAppNotes] = useState<InterviewNote[]>([]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total_applications: 0,
    applied_count: 0,
    interview_count: 0,
    offer_count: 0,
    rejected_count: 0,
    pending_count: 0
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    window.location.hash = activeTab;
  }, [activeTab]);

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
      const [appsData, _, remindersData, statsData] = await Promise.all([
        getApplications(user.id),
        getProfile(user.id),
        getReminders(user.id),
        getApplicationStats(user.id)
      ]);
      setApplications(appsData || []);
      setReminders(remindersData || []);
      setStats(statsData);
    } catch (error: any) {
      console.error('Data load error:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  // Load notes when viewing an app
  useEffect(() => {
    if (viewingApp) {
      getInterviewNotes(viewingApp.id).then(setSelectedAppNotes);
    } else {
      setSelectedAppNotes([]);
    }
  }, [viewingApp]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const u = await login(email, password);
    toast.success('Welcome back!');
    if (u?.role === 'admin') setActiveTab('admin');
    else setActiveTab('dashboard');
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string, fullName: string) => {
    await register(email, password, fullName);
    toast.success('Account created.');
    setActiveTab('dashboard');
  }, [register]);

  const handleSaveApplication = async (data: Partial<Application>) => {
    if (editingApp) {
      const updated = await updateApplication(editingApp.id, data);
      setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    } else {
      const created = await createApplication({ ...data, user_id: user?.id });
      setApplications(prev => [created, ...prev]);
    }
    loadData();
  };

  const handleDeleteApplication = async (id: string) => {
    if (confirm('Delete this application permanently?')) {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      loadData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updated = await updateApplication(id, { status: newStatus as any });
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    loadData();
  };

  const handleAddNote = async (note: Partial<InterviewNote>) => {
    if (!viewingApp) return;
    const created = await createInterviewNote({ ...note, application_id: viewingApp.id, user_id: user?.id });
    setSelectedAppNotes(prev => [...prev, created]);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteInterviewNote(id);
    setSelectedAppNotes(prev => prev.filter(n => n.id !== id));
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
      case 'applications': return <ApplicationList applications={applications} onEdit={setEditingApp} onView={setViewingApp} onDelete={handleDeleteApplication} onAdd={() => setShowAppModal(true)} onStatusChange={handleStatusChange} />;
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
        <ApplicationModal isOpen={showAppModal} onClose={() => { setShowAppModal(false); setEditingApp(null); }} onSave={handleSaveApplication} application={editingApp} userId={user?.id} />
        {viewingApp && (
          <ApplicationDetails 
            application={viewingApp} 
            interviewNotes={selectedAppNotes} 
            isOpen={!!viewingApp} 
            onClose={() => setViewingApp(null)} 
            onEdit={() => { setEditingApp(viewingApp); setViewingApp(null); setShowAppModal(true); }}
            onDelete={() => handleDeleteApplication(viewingApp.id)}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onStatusChange={handleStatusChange}
          />
        )}
      </Suspense>
    </div>
  );
}
