import { Suspense, useState, useEffect, useCallback } from 'react';
import { safeLazy } from '@/lib/ModuleHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Sidebar } from '@/components/shared/Sidebar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LoadingView } from '@/components/shared/LoadingView';
import { FullScreenLoader } from '@/components/shared/PremiumLoader';
import { useAuth } from '@/hooks/useAuth';

// Lazy load heavy components with Elite Recovery Handler
const Dashboard = safeLazy(() => import('@/components/dashboard/Dashboard'));
const ApplicationList = safeLazy(() => import('@/components/applications/ApplicationList'));
const ApplicationModal = safeLazy(() => import('@/components/applications/ApplicationModal'));
const ApplicationDetails = safeLazy(() => import('@/components/applications/ApplicationDetails'));
const CalendarView = safeLazy(() => import('@/components/calendar/CalendarView'));
const DocumentsView = safeLazy(() => import('@/components/documents/DocumentsView'));
const SettingsView = safeLazy(() => import('@/components/settings/SettingsView'));
const AdminOverview = safeLazy(() => import('@/components/admin/AdminOverview'));
const UserRegistryView = safeLazy(() => import('@/components/admin/UserRegistryView'));
const SecurityConsole = safeLazy(() => import('@/components/admin/SecurityConsole'));
const AdminSettings = safeLazy(() => import('@/components/admin/AdminSettings'));
const ErrorLogsView = safeLazy(() => import('@/components/admin/ErrorLogsView'));
const BugReportModal = safeLazy(() => import('@/components/shared/BugReportModal'));
import { 
  supabase,
  getApplications, 
  updateApplication, 
  deleteApplication,
  getApplicationStats,
  getReminders,
  getInterviewNotes,
  createInterviewNote,
  deleteInterviewNote,
  getProfile,
  logError,
  logActivity,
  triggerGlobalEmailAlerts
} from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';
import type { Application, ApplicationStats, Reminder, InterviewNote, Profile } from '@/types';
import './App.css';

function App() {
  const { user, loading: authLoading, login, register, logout, isAuthenticated, isAdmin, hasSessionHint } = useAuth();
  
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    
    // Check if we were an admin last time to avoid flicker
    const wasAdmin = sessionStorage.getItem('was_admin') === 'true';
    const lastTab = localStorage.getItem('activeTab');
    
    if (wasAdmin && (!lastTab || lastTab === 'dashboard')) return 'admin';
    return lastTab || 'dashboard';
  });

  // History and Persistence Sync
  useEffect(() => {
    if (isAuthenticated) {
      // Auto-redirect if we are on an auth hash or invalid tab
      const authTabs = ['login', 'signup'];
      if (authTabs.includes(activeTab)) {
        const defaultTab = isAdmin ? 'admin' : 'dashboard';
        setActiveTab(defaultTab);
        return;
      }

      window.location.hash = activeTab;
      localStorage.setItem('activeTab', activeTab);
      if (isAdmin) {
        sessionStorage.setItem('was_admin', 'true');
      } else {
        sessionStorage.removeItem('was_admin');
      }
    }
  }, [activeTab, isAuthenticated, isAdmin]);

  useEffect(() => {
    // Handle Browser Back/Forward buttons
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    if (window.history.length <= 1) {
      window.history.pushState({ initialized: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [hasSecurityAlert, setHasSecurityAlert] = useState(false);
  const [stats, setStats] = useState<ApplicationStats>({
    total_applications: 0,
    applied_count: 0,
    interview_count: 0,
    offer_count: 0,
    rejected_count: 0,
    pending_count: 0,
  });
  
  const [showAppModal, setShowAppModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [selectedAppNotes, setSelectedAppNotes] = useState<InterviewNote[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(true);
  const [showBugReport, setShowBugReport] = useState(false);

  // Guard: non-admin users cannot access admin tabs
  useEffect(() => {
    const adminTabs = ['admin', 'users', 'security', 'admin-settings', 'error-logs'];
    if (adminTabs.includes(activeTab) && !isAdmin && isAuthenticated) {
      setActiveTab('dashboard');
      if (activeTab === 'admin') {
        toast.error('Access denied. Admin privileges required.');
      }
    }
  }, [activeTab, isAdmin, isAuthenticated]);

  // Elite Recovery System: Restore context after a chunk failure reload
  useEffect(() => {
    const recoveryData = sessionStorage.getItem('recovery_context');
    if (recoveryData) {
      try {
        const { tab } = JSON.parse(recoveryData);
        if (tab && tab !== activeTab) {
          console.log(`[🚀 Recovery] Restoring session context: ${tab}`);
          setActiveTab(tab);
          toast.success('Session restored after minor glitch.');
        }
      } catch (e) {
        console.error('Recovery parse fail:', e);
      } finally {
        sessionStorage.removeItem('recovery_context');
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      const userId = user.id;
      
      const fetchJobs = [
        getApplications(userId).catch(e => { console.error('Apps load fail:', e); return []; }),
        getReminders(userId).catch(e => { console.error('Reminders load fail:', e); return []; }),
        getApplicationStats(userId).catch(e => { 
          console.error('Stats load fail:', e); 
          return { total_applications: 0, applied_count: 0, interview_count: 0, offer_count: 0, rejected_count: 0, pending_count: 0 }; 
        }),
        getProfile(userId).catch(e => { console.error('Profile load fail:', e); return null; })
      ];
      
      const [apps, rems, appStats, userProfile] = await Promise.all(fetchJobs);
      
      setApplications(apps);
      setReminders(rems);
      setStats(appStats);
      setProfile(userProfile);
      setIsSyncing(false);

      triggerGlobalEmailAlerts().catch(console.error);
    } catch (error: any) {
      console.error('Critical data error:', error);
      toast.error('Sync failure. Some data may be missing.');
      
      logError({
        errorType: 'data_load',
        errorMessage: error.message || 'Bulk data load failed',
        errorStack: error.stack,
        actionAttempted: 'loadData',
        userId: user.id,
        userEmail: user.email,
        role: isAdmin ? 'admin' : 'student'
      });
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && activeTab === 'dashboard') {
      setActiveTab('admin');
      window.location.hash = 'admin';
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  // Security Alert Sentinel (Realtime)
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    // 1. Initial Check for Unresolved Reports
    const checkUnresolved = async () => {
      const { count, error } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('error_type', 'user_report')
        .eq('resolved', false);
      
      if (!error && count && count > 0) {
        setHasSecurityAlert(true);
      }
    };
    checkUnresolved();

    // 2. Realtime Listener for New Critical Reports
    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
          filter: "error_type=eq.user_report"
        },
        () => {
          setHasSecurityAlert(true);
          toast('CRITICAL: New Bug Report Received', {
            description: 'A student has reported a potentially serious anomaly.',
            icon: '🚨',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isAdmin]);

  // Clear Alert when visiting the Logs
  useEffect(() => {
    if (activeTab === 'error-logs') {
      setHasSecurityAlert(false);
    }
  }, [activeTab]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const u = await login(email, password);
      toast.success('Welcome back!');
      
      const isAdminEmail = email === 'admin@gmail.com' || email === 'navadeepsripathi2@gmail.com';
      
      if (u?.role === 'admin' || isAdminEmail) {
        setActiveTab('admin');
        await logActivity('admin_login', 'Admin session initialized', { email });
      } else {
        setActiveTab('dashboard');
        await logActivity('user_login', 'User session initialized', { email });
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const data = await register(email, password, fullName);
      if (email === 'admin@gmail.com' || (data?.role === 'admin')) {
        setActiveTab('admin');
        toast.success('Admin Console access granted.');
        await logActivity('admin_registration', 'New admin account created', { email });
      } else {
        setActiveTab('dashboard');
        toast.success('Welcome! Please complete your profile to get started.', { duration: 6000 });
        await logActivity('user_registration', 'New user account created', { email });
      }
      
      if (data) {
        const userId = data.id;
        try {
          await sendWelcomeEmail(userId, email, fullName);
        } catch (err: any) {
          console.error('Auto-email error:', err);
          logError({
            errorType: 'auth',
            errorMessage: err.message || 'Auto-email failed',
            errorStack: err.stack,
            actionAttempted: 'send_welcome_email',
            userId
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  }, [register]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await updateApplication(id, { status: newStatus as any, updated_at: new Date().toISOString() });
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      if (viewingApp?.id === id) setViewingApp({ ...viewingApp, status: newStatus as any });
      toast.success(`Status updated to ${newStatus}`);
      await logActivity('application_status_update', `Application status changed to ${newStatus}`, { applicationId: id, status: newStatus });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
      logError({
        errorType: 'application_update',
        errorMessage: error.message || 'Status change failed',
        errorStack: error.stack,
        actionAttempted: 'handleStatusChange',
        userId: user?.id,
        userEmail: user?.email,
        role: isAdmin ? 'admin' : 'student'
      });
    }
  }, [user, isAdmin, viewingApp, loadData]);

  const handleSaveApplication = useCallback(async (_appData: Partial<Application>) => {
    setShowAppModal(false);
    setEditingApp(null);
    await loadData();
  }, [loadData]);

  const handleDeleteApplication = useCallback(async (id: string) => {
    try {
      await deleteApplication(id);
      setApplications(apps => apps.filter(a => a.id !== id));
      setViewingApp(null);
      toast.success('Application deleted!');
      await logActivity('application_delete', 'Application removed from system', { applicationId: id });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete application');
      logError({
        errorType: 'application_delete',
        errorMessage: error.message || 'App deletion failed',
        errorStack: error.stack,
        actionAttempted: 'handleDeleteApplication',
        userId: user?.id,
        userEmail: user?.email,
        role: isAdmin ? 'admin' : 'student'
      });
    }
  }, [user, isAdmin, loadData]);

  const handleViewApplication = useCallback(async (app: Application) => {
    setViewingApp(app);
    try {
      const notes = await getInterviewNotes(app.id);
      setSelectedAppNotes(notes);
    } catch (error: any) {
      console.error('Error loading interview notes:', error);
    }
  }, []);

  const handleAddInterviewNote = useCallback(async (note: Partial<InterviewNote>) => {
    if (!user || !viewingApp) return;
    try {
      const newNote = await createInterviewNote({
        ...note,
        application_id: viewingApp.id,
        user_id: user.id,
      });
      setSelectedAppNotes(notes => [...notes, newNote]);
      toast.success('Interview note added!');
      await logActivity('interview_note_add', 'New interview note recorded', { applicationId: viewingApp.id });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add note');
    }
  }, [user, viewingApp]);

  const handleDeleteInterviewNote = useCallback(async (id: string) => {
    try {
      await deleteInterviewNote(id);
      setSelectedAppNotes(notes => notes.filter(n => n.id !== id));
      toast.success('Note deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (isAdmin) return null;
        return (
          <Dashboard 
            applications={applications} 
            reminders={reminders}
            stats={stats}
            profile={profile}
            onNavigate={setActiveTab}
            loading={isSyncing}
          />
        );
      case 'applications':
        return (
          <ApplicationList
            applications={applications}
            onEdit={(app) => { setEditingApp(app); setShowAppModal(true); }}
            onDelete={handleDeleteApplication}
            onView={handleViewApplication}
            onAdd={() => { setEditingApp(null); setShowAppModal(true); }}
            onStatusChange={handleStatusChange}
            loading={isSyncing}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            applications={applications}
            reminders={reminders}
            userId={user?.id}
            onRefresh={loadData}
            loading={isSyncing}
          />
        );
      case 'documents':
        return <DocumentsView userId={user?.id} loading={isSyncing} />;
      case 'settings':
        return <SettingsView 
            userId={user?.id} 
            userName={profile?.full_name || user?.user_metadata?.full_name || 'User'} 
            userEmail={user?.email || ''}
            userRole={user?.role || 'student'}
            profileData={profile}
            onUpdate={loadData}
          />;
      case 'admin':
        if (!isAdmin) return null;
        return <AdminOverview onNavigate={setActiveTab} />;
      case 'users':
        if (!isAdmin) return null;
        return <UserRegistryView />;
      case 'security':
        if (!isAdmin) return null;
        return <SecurityConsole />;
      case 'admin-settings':
        if (!isAdmin) return null;
        return <AdminSettings />;
      case 'error-logs':
        if (!isAdmin) return null;
        return <ErrorLogsView adminId={user?.id} />;
    }
  };

  const [showAuthForm, setShowAuthForm] = useState(false);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthForm(true);
    } else {
      setShowAuthForm(false);
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading && !isAuthenticated && !hasSessionHint) {
    return <FullScreenLoader message="Connecting..." />;
  }

  if (!isAuthenticated && showAuthForm) {
    return (
      <div className="h-screen bg-white dark:bg-zinc-950 bg-grid-pattern flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0071E3]/[0.02] to-transparent pointer-events-none" />
        <div className="w-full max-w-[440px] relative z-10">
          <AuthForm onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-zinc-50 dark:bg-zinc-950 text-zinc-900 flex">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#141413',
            color: '#FFFFFF',
            borderRadius: '20px',
            border: 'none',
            fontSize: '14px',
            fontFamily: 'Sofia Sans, sans-serif',
          },
        }}
      />
      
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={logout}
        userName={user?.user_metadata?.full_name || 'My Profile'}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        isAdmin={isAdmin}
        avatarUrl={profile?.avatar_url}
        onReportBug={() => setShowBugReport(true)}
        hasSecurityAlert={hasSecurityAlert}
      />

      <main 
        className="flex-1 min-h-screen p-4 md:px-8 mt-[100px] transition-all duration-300 w-full overflow-x-hidden pb-24 md:pb-8"
      >
        <div className="max-w-[1200px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="w-full"
            >
              <Suspense fallback={<LoadingView message={`Loading ${activeTab}...`} />}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Suspense fallback={<FullScreenLoader />}>
        <ApplicationModal
          isOpen={showAppModal}
          onClose={() => { setShowAppModal(false); setEditingApp(null); }}
          onSave={handleSaveApplication}
          application={editingApp}
          userId={user?.id}
        />

        <ApplicationDetails
          application={viewingApp!}
          interviewNotes={selectedAppNotes}
          isOpen={!!viewingApp}
          onClose={() => setViewingApp(null)}
          onEdit={() => { setEditingApp(viewingApp); setViewingApp(null); setShowAppModal(true); }}
          onDelete={() => handleDeleteApplication(viewingApp!.id)}
          onAddNote={handleAddInterviewNote}
          onDeleteNote={handleDeleteInterviewNote}
          onStatusChange={handleStatusChange}
        />

        <BugReportModal 
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          userId={user?.id}
          userEmail={user?.email}
          userName={profile?.full_name || user?.user_metadata?.full_name}
        />
      </Suspense>
    </div>
  );
}

export default App;
