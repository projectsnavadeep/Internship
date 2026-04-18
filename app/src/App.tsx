import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Sidebar } from '@/components/shared/Sidebar';
import { AuthForm } from '@/components/auth/AuthForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { ApplicationModal } from '@/components/applications/ApplicationModal';
import { ApplicationDetails } from '@/components/applications/ApplicationDetails';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DocumentsView } from '@/components/documents/DocumentsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getApplicationStats,
  getReminders,
  getInterviewNotes,
  createInterviewNote,
  deleteInterviewNote
} from '@/lib/supabase';
import type { Application, ApplicationStats, Reminder, InterviewNote } from '@/types';
import './App.css';

// Demo data for when Supabase is not configured
const demoApplications: Application[] = [
  {
    id: '1',
    user_id: 'demo',
    company_name: 'Google',
    job_title: 'Software Engineering Intern',
    job_description: 'Summer internship program for software engineering students.',
    job_url: 'https://careers.google.com',
    location: 'Mountain View, CA',
    salary_range: '$8,000/month',
    employment_type: 'Internship',
    status: 'Applied',
    applied_date: '2024-01-15',
    deadline_date: '2024-02-01',
    notes: 'Applied through university career fair. Need to follow up.',
    rating: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'demo',
    company_name: 'Microsoft',
    job_title: 'Product Manager Intern',
    job_description: 'PM internship for summer 2024.',
    job_url: 'https://careers.microsoft.com',
    location: 'Redmond, WA',
    salary_range: '$7,500/month',
    employment_type: 'Internship',
    status: 'Interview',
    applied_date: '2024-01-10',
    interview_date: '2024-01-25T14:00:00Z',
    notes: 'First round interview scheduled. Prepare behavioral questions.',
    rating: 4,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: '3',
    user_id: 'demo',
    company_name: 'Amazon',
    job_title: 'SDE Intern',
    job_description: 'Software Development Engineer internship.',
    job_url: 'https://amazon.jobs',
    location: 'Seattle, WA',
    salary_range: '$9,000/month',
    employment_type: 'Internship',
    status: 'Offer',
    applied_date: '2024-01-05',
    notes: 'Received offer! Reviewing compensation package.',
    rating: 5,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
  },
  {
    id: '4',
    user_id: 'demo',
    company_name: 'Meta',
    job_title: 'Data Science Intern',
    job_description: 'DS internship focusing on machine learning.',
    location: 'Menlo Park, CA',
    employment_type: 'Internship',
    status: 'Rejected',
    applied_date: '2024-01-08',
    notes: 'Received rejection after final round. Good experience though.',
    rating: 3,
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
  },
  {
    id: '5',
    user_id: 'demo',
    company_name: 'Apple',
    job_title: 'UX Design Intern',
    job_description: 'Design internship for iOS team.',
    location: 'Cupertino, CA',
    employment_type: 'Internship',
    status: 'Phone Screen',
    applied_date: '2024-01-20',
    notes: 'Phone screen scheduled for next week.',
    rating: 4,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
];

const demoReminders: Reminder[] = [
  {
    id: '1',
    user_id: 'demo',
    application_id: '1',
    title: 'Follow up with Google',
    description: 'Send follow-up email to recruiter',
    reminder_date: '2024-01-22T10:00:00Z',
    reminder_type: 'Follow-up',
    is_completed: false,
    is_notified: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'demo',
    application_id: '2',
    title: 'Microsoft Interview Prep',
    description: 'Review system design concepts',
    reminder_date: '2024-01-24T10:00:00Z',
    reminder_type: 'Interview',
    is_completed: false,
    is_notified: false,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    user_id: 'demo',
    title: 'Update Resume',
    description: 'Add recent project experience',
    reminder_date: '2024-01-28T10:00:00Z',
    reminder_type: 'Custom',
    is_completed: false,
    is_notified: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const demoInterviewNotes: InterviewNote[] = [
  {
    id: '1',
    application_id: '2',
    user_id: 'demo',
    round_number: 1,
    round_name: 'Recruiter Screen',
    interview_type: 'Phone',
    scheduled_date: '2024-01-15T14:00:00Z',
    duration_minutes: 30,
    questions_asked: '- Tell me about yourself\n- Why Microsoft?\n- What are your career goals?',
    answers_given: '- Discussed background in CS\n- Mentioned interest in cloud computing\n- Talked about becoming a PM',
    key_takeaways: 'Focus on customer obsession and growth mindset',
    follow_up_items: 'Send thank you email',
    outcome: 'Passed',
    interviewer_name: 'Sarah Johnson',
    interviewer_role: 'Senior Recruiter',
    created_at: '2024-01-15T15:00:00Z',
    updated_at: '2024-01-15T15:00:00Z',
  },
];

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Guard: non-admin users cannot access admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [activeTab, isAdmin]);

  // Load data
  const loadData = useCallback(async () => {
    if (!user && !isDemoMode) return;
    
    try {
      const userId = user?.id || 'demo';
      
      if (isDemoMode) {
        setApplications(demoApplications);
        setReminders(demoReminders);
        setStats({
          total_applications: 5,
          applied_count: 1,
          interview_count: 2,
          offer_count: 1,
          rejected_count: 1,
          pending_count: 3,
        });
      } else {
        const [apps, rems, appStats] = await Promise.all([
          getApplications(userId),
          getReminders(userId),
          getApplicationStats(userId),
        ]);
        
        setApplications(apps);
        setReminders(rems);
        setStats(appStats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    if (isAuthenticated || isDemoMode) {
      loadData();
    }
  }, [isAuthenticated, isDemoMode, loadData]);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Handle register
  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      await register(email, password, fullName);
      setActiveTab('settings');
      toast.success('Welcome! Please complete your profile and upload your resume to get started.', { duration: 6000 });
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  // Handle demo mode
  const handleDemoMode = () => {
    setIsDemoMode(true);
    toast.success('Demo mode activated!');
  };

  // Application CRUD
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (isDemoMode) {
        setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        if (viewingApp?.id === id) setViewingApp({ ...viewingApp, status: newStatus as any });
        toast.success(`Status updated to ${newStatus}`);
        return;
      }
      await updateApplication(id, { status: newStatus as any, updated_at: new Date().toISOString() });
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      if (viewingApp?.id === id) setViewingApp({ ...viewingApp, status: newStatus as any });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleSaveApplication = async (appData: Partial<Application>) => {
    try {
      if (editingApp) {
        const updated = await updateApplication(editingApp.id, appData);
        setApplications(apps => apps.map(a => a.id === updated.id ? updated : a));
        toast.success('Application updated!');
      } else {
        const newApp = await createApplication({
          ...appData,
          user_id: user?.id || 'demo',
        });
        setApplications(apps => [newApp, ...apps]);
        toast.success('Application added!');
      }
      setShowAppModal(false);
      setEditingApp(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save application');
    }
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
      const notes = isDemoMode 
        ? demoInterviewNotes.filter(n => n.application_id === app.id)
        : await getInterviewNotes(app.id);
      setSelectedAppNotes(notes);
    } catch (error) {
      console.error('Error loading interview notes:', error);
    }
  };

  const handleAddInterviewNote = async (note: Partial<InterviewNote>) => {
    try {
      if (!viewingApp) return;
      
      const newNote = await createInterviewNote({
        ...note,
        application_id: viewingApp.id,
        user_id: user?.id || 'demo',
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
          />
        );
      case 'documents':
        return <DocumentsView userId={user?.id} />;
      case 'settings':
        return (
          <SettingsView 
            userId={user?.id} 
            userName={user?.user_metadata?.full_name || 'User'} 
            userEmail={user?.email || ''}
            userRole={user?.role || 'student'}
          />
        );
      case 'admin':
        if (!isAdmin) return null;
        return <AdminDashboard />;
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

  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-apple-gray dark:bg-apple-black py-12 gap-8 overflow-y-auto">
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} />
        
        {/* Demo Mode Button */}
        <motion.button
          onClick={handleDemoMode}
          className="apple-pill-outline bg-white/50 backdrop-blur-md dark:bg-black/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Explore Demo Mode
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-apple-gray dark:bg-apple-black flex">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            color: '#1d1d1f',
            borderRadius: '12px',
          },
        }}
      />
      
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={() => { logout(); setIsDemoMode(false); }}
        userName={user?.user_metadata?.full_name || 'Demo User'}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main 
        className={`flex-1 min-h-screen p-4 md:p-8 transition-all duration-300 w-full overflow-x-hidden ${
          isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[260px]'
        } pb-24 md:pb-8`}
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
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <ApplicationModal
        isOpen={showAppModal}
        onClose={() => { setShowAppModal(false); setEditingApp(null); }}
        onSave={handleSaveApplication}
        application={editingApp}
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
    </div>
  );
}

export default App;
