import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Sidebar } from '@/components/shared/Sidebar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LoadingView } from '@/components/shared/LoadingView';
import { useAuth } from '@/hooks/useAuth';

// Lazy load heavy components
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ApplicationList = lazy(() => import('@/components/applications/ApplicationList').then(m => ({ default: m.ApplicationList })));
const ApplicationModal = lazy(() => import('@/components/applications/ApplicationModal').then(m => ({ default: m.ApplicationModal })));
const ApplicationDetails = lazy(() => import('@/components/applications/ApplicationDetails').then(m => ({ default: m.ApplicationDetails })));
const CalendarView = lazy(() => import('@/components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));
const DocumentsView = lazy(() => import('@/components/documents/DocumentsView').then(m => ({ default: m.DocumentsView })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const UserRegistryView = lazy(() => import('@/components/admin/UserRegistryView').then(m => ({ default: m.UserRegistryView })));
const SecurityConsole = lazy(() => import('@/components/admin/SecurityConsole').then(m => ({ default: m.SecurityConsole })));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const ErrorLogsView = lazy(() => import('@/components/admin/ErrorLogsView').then(m => ({ default: m.ErrorLogsView })));
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getApplicationStats,
  getReminders,
  getInterviewNotes,
  createInterviewNote,
  deleteInterviewNote,
  logError
} from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';
import type { Application, ApplicationStats, Reminder, InterviewNote } from '@/types';
import './App.css';

function App() {
  const { user, loading: authLoading, login, register, logout, isAuthenticated, isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Can keep variable if needed internally, but won't be used

  // Guard: non-admin users cannot access admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [activeTab, isAdmin]);

  const loadData = useCallback(async () => {
    if (!user || isAdmin) return; // Skip student data load if admin
    
    try {
      const userId = user.id;
      
      const [apps, rems, appStats] = await Promise.all([
        getApplications(userId),
        getReminders(userId),
        getApplicationStats(userId),
      ]);
      
      setApplications(apps);
      setReminders(rems);
      setStats(appStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      const u = await login(email, password);
      toast.success('Welcome back!');
      if (u?.role === 'admin' || email === 'admin@gmail.com') {
        setActiveTab('admin');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Handle register
  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const data = await register(email, password, fullName);
      if (email === 'admin@gmail.com' || (data?.user?.role === 'admin')) {
        setActiveTab('admin');
        toast.success('Admin Console access granted.');
      } else {
        setActiveTab('settings');
        toast.success('Welcome! Please complete your profile to get started.', { duration: 6000 });
      }
      
      // Auto-email stuff...
      if (data?.user) {
        const userId = data.user.id;
        setTimeout(async () => {
          try {
            await sendWelcomeEmail(userId, email, fullName);
          } catch (err) {
            console.error('Auto-email error:', err);
          }
        }, 10000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  // Application CRUD
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      console.log(`[🚀] UPDATING STATUS to ${newStatus} for ${id}`);
      await updateApplication(id, { status: newStatus as any, updated_at: new Date().toISOString() });
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      if (viewingApp?.id === id) setViewingApp({ ...viewingApp, status: newStatus as any });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch (error: any) {
      console.error('[❌] Status Update Failed:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleSaveApplication = async (_appData: Partial<Application>) => {
    // Modal now handles DB insert/update directly.
    // This callback just refreshes the local state.
    setShowAppModal(false);
    setEditingApp(null);
    loadData();
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteApplication(id);
      setApplications(apps => apps.filter(a => a.id !== id));
      setViewingApp(null);
      toast.success('Application deleted!');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete application');
    }
  };

  const handleViewApplication = async (app: Application) => {
    setViewingApp(app);
    try {
      const notes = await getInterviewNotes(app.id);
      setSelectedAppNotes(notes);
    } catch (error) {
      console.error('Error loading interview notes:', error);
    }
  };

  const handleAddInterviewNote = async (note: Partial<InterviewNote>) => {
    if (!user || !viewingApp) return;
    try {
      const newNote = await createInterviewNote({
        ...note,
        application_id: viewingApp.id,
        user_id: user.id,
      });
      setSelectedAppNotes(notes => [...notes, newNote]);
      toast.success('Interview note added!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add note');
    }
  };

  const handleDeleteInterviewNote = async (id: string) => {
    try {
      await deleteInterviewNote(id);
      setSelectedAppNotes(notes => notes.filter(n => n.id !== id));
      toast.success('Note deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            applications={applications} 
            reminders={reminders}
            stats={stats}
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
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            applications={applications}
            reminders={reminders}
            onRefresh={loadData}
          />
        );
      case 'documents':
        return <DocumentsView userId={user?.id} />;
      case 'settings':
        return <SettingsView 
            userId={user?.id} 
            userName={user?.user_metadata?.full_name || 'User'} 
            userEmail={user?.email || ''}
            userRole={user?.role || 'student'}
          />;
      case 'admin':
        if (!isAdmin) return null;
        return <AdminOverview />;
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
      default:
        return <Dashboard applications={applications} reminders={reminders} stats={stats} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-apple-gray dark:bg-apple-black py-12 gap-8 overflow-y-auto">
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} />
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
        onLogout={() => { logout(); }}
        userName={user?.user_metadata?.full_name || 'My Profile'}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main 
        className="flex-1 min-h-screen p-4 md:px-8 mt-16 md:mt-32 transition-all duration-300 w-full overflow-x-hidden pb-24 md:pb-8"
      >
        <div className="max-w-[1200px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<LoadingView message={`Loading ${activeTab}...`} />}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}

export default App;
