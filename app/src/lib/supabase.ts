import { createClient } from '@supabase/supabase-js';
import type { Application, ApplicationStats, InterviewNote, Reminder, UserActivity, CompanyStats, StatusDistribution, PipelineStage, AdminRecentApplication } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// ============================================
// BULLETPROOF SINGLETON - survives Vite HMR
// Duplicate GoTrueClient instances deadlock the
// browser's navigator.locks and freeze all
// Supabase calls (insert, upload, select, etc).
// ============================================
const g = globalThis as any;

if (!g.__supabase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase URL or Anon Key is missing from .env! Requests will fail.');
  } else {
    console.log('[🚀] Initializing Supabase Singleton...');
    g.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Switched to PKCE for better security and stability
      },
    });
  }
}

export const supabase = g.__supabase;

if (!g.__supabaseAdmin && supabaseServiceKey && supabaseUrl) {
  g.__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
export const supabaseAdmin = g.__supabaseAdmin || null;
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

/**
 * TRACE LOGGING: Helps rectify "root" issues by showing exactly what
 * is being sent to Supabase in the DevTools console.
 */
const trace = (action: string, payload: any) => {
  console.log(`[🚀 SUPABASE TRACE] ${action}:`, payload);
};

/**
 * DOUBLE-SAFETY USER DETECTION: Ensures we never attempt an RLS-protected
 * operation without a valid, verified auth UID.
 */
export const getUserOrFail = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("AUTH FAILURE: No active session found during save attempt.");
    throw new Error("Authentication required. Please refresh and log in again.");
  }
  return user;
};

// ============================================
// Auth helpers
// ============================================
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await (supabase.auth as any).signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await (supabase.auth as any).signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await (supabase.auth as any).signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await (supabase.auth as any).getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await (supabase.auth as any).getSession();
  return session;
};

// ============================================
// Login Activity Tracking
// ============================================
export const updateLoginActivity = async (userId: string) => {
  try {
    // Fetch current count then increment
    const { data: profile } = await supabase
      .from('profiles')
      .select('login_count')
      .eq('id', userId)
      .single();

    const currentCount = profile?.login_count ?? 0;

    await supabase
      .from('profiles')
      .update({
        login_count: currentCount + 1,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (e) {
    // Never block login if tracking fails
    console.warn('Login activity tracking failed (non-blocking):', e);
  }
};

// ============================================
// Profile & Avatars
// ============================================
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // Handle "No Rows" gracefully if needed
  return data;
};

export const updateProfile = async (userId: string, profileData: Partial<any>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
  return data;
};

export const uploadAvatarImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Avatar upload error details:', {
      error: uploadError,
      fileName: file.name,
      filePath,
      userId
    });
    throw uploadError;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
};

// ============================================
// Password update
// ============================================
export const updatePassword = async (newPassword: string) => {
  const { data, error } = await (supabase.auth as any).updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
};

// ============================================
// Application helpers
// ============================================
export const getApplications = async (userId: string) => {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data as Application[]) || [];
};

export const createApplication = async (application: Partial<Application>) => {
  const user = await getUserOrFail();
  
  // Strip empty strings, and handle nulls/undefined for Postgres safety
  const cleanData: any = {
    ...application,
    user_id: user.id // Force the correct ID
  };
  
  // Remove empty strings that might cause Postgres syntax errors
  for (const key in cleanData) {
    if (cleanData[key] === '') delete cleanData[key];
  }

  // Final casting of tricky types
  if (cleanData.rating !== undefined) cleanData.rating = Number(cleanData.rating);

  trace('INSERT APPLICATION', cleanData);

  const { data, error } = await supabase
    .from('applications')
    .insert(cleanData)
    .select()
    .single();
  
  if (error) {
    console.error("Supabase API Error on Save:", error);
    throw error;
  }
  return data;
};

export const updateApplication = async (id: string, updates: Partial<Application>) => {
  await getUserOrFail(); // Verify auth
  
  // Clean empty strings
  const cleanData: any = { ...updates };
  for (const key in cleanData) {
    if (cleanData[key] === '') delete cleanData[key];
  }

  trace('UPDATE APPLICATION', { id, cleanData });

  const { data, error } = await supabase
    .from('applications')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
  return data;
};

export const deleteApplication = async (id: string) => {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// Interview notes helpers
// ============================================
export const getInterviewNotes = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('interview_notes')
    .select('*')
    .eq('application_id', applicationId)
    .order('round_number', { ascending: true });
  
  if (error) throw error;
  return (data as InterviewNote[]) || [];
};

export const createInterviewNote = async (note: Partial<InterviewNote>) => {
  const { data, error } = await supabase
    .from('interview_notes')
    .insert(note)
    .select()
    .single();
  
  if (error) throw error;
  return data as InterviewNote;
};

export const deleteInterviewNote = async (id: string) => {
  const { error } = await supabase
    .from('interview_notes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// Reminders helpers
// ============================================
export const getReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('reminder_date', { ascending: true });
  
  if (error) throw error;
  return (data as Reminder[]) || [];
};

export const createReminder = async (reminder: Partial<Reminder>) => {
  const user = await getUserOrFail();
  
  const cleanData: any = {
    ...reminder,
    user_id: user.id // Force the correct ID
  };
  
  for (const key in cleanData) {
    if (cleanData[key] === '') delete cleanData[key];
  }

  trace('CREATE REMINDER', cleanData);

  const { data, error } = await supabase
    .from('reminders')
    .insert(cleanData)
    .select()
    .single();
  
  if (error) {
    console.error("Reminder Save Error:", error);
    throw error;
  }
  return data as Reminder;
};

export const completeReminder = async (id: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .update({ is_completed: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Reminder;
};

// Remove reminder
export const deleteReminder = async (id: string) => {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Update reminder
export const updateReminder = async (id: string, updates: Partial<Reminder>) => {
  const { data, error } = await supabase
    .from('reminders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Mark reminder as notified
export const markReminderNotified = async (id: string) => {
  const { error } = await supabase
    .from('reminders')
    .update({ is_notified: true })
    .eq('id', id);
  if (error) throw error;
};

// ============================================
// Document & Files Helpers
// ============================================
export const getDocuments = async (userId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

export const createDocument = async (docData: any) => {
  const { data, error } = await supabase
    .from('documents')
    .insert(docData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
export const updateDocument = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteDocument = async (id: string, fileUrl: string) => {
  // Try to remove from storage first (extracting path from publicUrl)
  try {
    const urlParts = fileUrl.split('/documents/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('documents').remove([filePath]);
    }
  } catch (e) {
    console.error('Error removing document from storage:', e);
  }

  // Delete DB record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

export const uploadDocumentFile = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${userId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return { publicUrl, size: file.size, type: fileExt };
};

// ============================================
// Stats helpers
// ============================================
export const getApplicationStats = async (userId: string): Promise<ApplicationStats> => {
  try {
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);
    
    if (appError) throw appError;
    
    const allApplications = applications || [];
    
    const stats: ApplicationStats = {
      total_applications: allApplications.length,
      applied_count: allApplications.filter((a: any) => a.status === 'Applied').length,
      interview_count: allApplications.filter((a: any) => ['Phone Screen', 'Interview', 'Technical'].includes(a.status)).length,
      offer_count: allApplications.filter((a: any) => a.status === 'Offer').length,
      rejected_count: allApplications.filter((a: any) => a.status === 'Rejected').length,
      pending_count: allApplications.filter((a: any) => !['Offer', 'Rejected', 'Withdrawn', 'Ghosted'].includes(a.status)).length,
    };
    
    return stats;
  } catch (err) {
    console.error('Stats error:', err);
    throw err;
  }
};

// ============================================
// ADMIN FUNCTIONS
// ============================================
// These use the service role client to bypass RLS

const getAdminClient = () => {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available. Check VITE_SUPABASE_SERVICE_KEY.');
  }
  return supabaseAdmin;
};

// Get all user profiles with activity data
export const adminGetAllUsers = async (): Promise<UserActivity[]> => {
  const admin = getAdminClient();
  
  // Get profiles
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .order('last_login_at', { ascending: false });
  
  if (profileError) throw profileError;

  // Get auth users for emails
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) throw authError;

  const authUsers = authData?.users || [];
  
  // Get application counts per user
  const { data: apps, error: appError } = await admin
    .from('applications')
    .select('user_id');
  
  if (appError) throw appError;

  const appCounts: Record<string, number> = {};
  (apps || []).forEach((a: any) => {
    appCounts[a.user_id] = (appCounts[a.user_id] || 0) + 1;
  });

  return (profiles || []).map((p: any) => {
    const authUser = authUsers.find((u: any) => u.id === p.id);
    return {
      user_id: p.id,
      full_name: p.full_name || 'Unknown',
      email: authUser?.email || 'N/A',
      university: p.university,
      major: p.major,
      role: p.role || 'student',
      login_count: p.login_count || 0,
      last_login_at: p.last_login_at,
      joined_at: p.created_at,
      application_count: appCounts[p.id] || 0,
      welcome_email_sent: p.welcome_email_sent || false,
      avatar_url: p.avatar_url,
      graduation_year: p.graduation_year,
      dob: p.dob,
      merit: p.merit,
      additional_data: p.additional_data,
      signup_date: p.signup_date,
    };
  });
};

// Get admin dashboard stats
export const adminGetStats = async () => {
  const admin = getAdminClient();

  // Total users
  const { count: userCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Total applications
  const { count: appCount } = await admin
    .from('applications')
    .select('*', { count: 'exact', head: true });

  // Active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: activeCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_login_at', sevenDaysAgo.toISOString());

  // Offer rate
  const { data: allApps } = await admin
    .from('applications')
    .select('status');
  
  const total = allApps?.length || 0;
  const offers = allApps?.filter((a: any) => a.status === 'Offer').length || 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100 * 10) / 10 : 0;

  return {
    totalUsers: userCount || 0,
    totalApplications: appCount || 0,
    activeUsersLast7Days: activeCount || 0,
    offerRate,
  };
};

// Get company distribution
export const adminGetCompanyDistribution = async (): Promise<CompanyStats[]> => {
  const admin = getAdminClient();
  
  const { data, error } = await admin
    .from('applications')
    .select('company_name, user_id');
  
  if (error) throw error;

  const companyMap: Record<string, { students: Set<string>; count: number }> = {};
  (data || []).forEach((a: any) => {
    if (!companyMap[a.company_name]) {
      companyMap[a.company_name] = { students: new Set(), count: 0 };
    }
    companyMap[a.company_name].students.add(a.user_id);
    companyMap[a.company_name].count++;
  });

  return Object.entries(companyMap)
    .map(([name, val]) => ({
      company_name: name,
      student_count: val.students.size,
      application_count: val.count,
    }))
    .sort((a, b) => b.application_count - a.application_count);
};

// Get status distribution
export const adminGetStatusDistribution = async (): Promise<StatusDistribution[]> => {
  const admin = getAdminClient();
  
  const { data, error } = await admin
    .from('applications')
    .select('status');
  
  if (error) throw error;

  const statusMap: Record<string, number> = {};
  const total = data?.length || 0;
  (data || []).forEach((a: any) => {
    statusMap[a.status] = (statusMap[a.status] || 0) + 1;
  });

  return Object.entries(statusMap)
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

// Get pipeline funnel
export const adminGetPipelineFunnel = async (): Promise<PipelineStage[]> => {
  const admin = getAdminClient();
  
  const { data, error } = await admin
    .from('applications')
    .select('status');
  
  if (error) throw error;

  const apps = data || [];
  const allStatuses = apps.map((a: any) => a.status);

  return [
    {
      stage: 'Applied',
      stage_order: 1,
      count: allStatuses.length,
    },
    {
      stage: 'Screening',
      stage_order: 2,
      count: allStatuses.filter((s: string) => ['Phone Screen', 'Interview', 'Technical', 'Offer'].includes(s)).length,
    },
    {
      stage: 'Interview',
      stage_order: 3,
      count: allStatuses.filter((s: string) => ['Interview', 'Technical', 'Offer'].includes(s)).length,
    },
    {
      stage: 'Offer',
      stage_order: 4,
      count: allStatuses.filter((s: string) => s === 'Offer').length,
    },
  ];
};

// Get recent applications across all users
export const adminGetRecentApplications = async (): Promise<AdminRecentApplication[]> => {
  const admin = getAdminClient();
  
  const { data: apps, error } = await admin
    .from('applications')
    .select('id, company_name, job_title, status, applied_date, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) throw error;

  // Get user details
  const userIds = [...new Set((apps || []).map((a: any) => a.user_id))];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  const { data: authData } = await admin.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  const profileMap: Record<string, string> = {};
  const emailMap: Record<string, string> = {};
  
  (profiles || []).forEach((p: any) => {
    profileMap[p.id] = p.full_name || 'Unknown';
  });
  authUsers.forEach((u: any) => {
    emailMap[u.id] = u.email || 'N/A';
  });

  return (apps || []).map((a: any) => ({
    id: a.id,
    company_name: a.company_name,
    job_title: a.job_title,
    status: a.status,
    applied_date: a.applied_date,
    created_at: a.created_at,
    applicant_name: profileMap[a.user_id] || 'Unknown',
    applicant_email: emailMap[a.user_id] || 'N/A',
  }));
};

// Update profile status after welcome email
export const markWelcomeEmailSent = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ welcome_email_sent: true })
    .eq('id', userId);
    
  if (error) throw error;
};

// ============================================
// Elite Admin Commands (High Privilege)
// ============================================

// Delegate Admin powers to another user
export const adminPromoteToAdmin = async (userId: string) => {
  const admin = getAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  
  if (error) throw error;
};

// Delete a user with selective data purge
export const adminDeleteUser = async (userId: string, wipeData: boolean = false) => {
  const admin = getAdminClient();
  
  if (wipeData) {
    // Purge internship records first
    await admin.from('applications').delete().eq('user_id', userId);
    await admin.from('reminders').delete().eq('user_id', userId);
  }

  // Delete profile
  await admin.from('profiles').delete().eq('id', userId);

  // Delete from Auth
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
};

// Fetch internship history for a specific student drill-down
export const adminGetUserInternships = async (userId: string) => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

// ============================================
// ERROR LOGGING SYSTEM
// ============================================
export type ErrorType = 'auth' | 'application_save' | 'application_update' | 'application_delete' |
  'resume_upload' | 'cover_letter_upload' | 'document_upload' | 'document_delete' |
  'profile_update' | 'password_change' | 'avatar_upload' | 'data_load' | 'rendering' | 'network' | 'unknown';

export interface ErrorLogData {
  errorType: ErrorType;
  errorMessage: string;
  errorStack?: string;
  source?: string;
  endpointOrFile?: string;
  statusCode?: number;
  actionAttempted: string;
  role?: 'student' | 'admin' | 'system';
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const logError = async (data: ErrorLogData) => {
  try {
    await supabase.from('error_logs').insert({
      user_id: data.userId || null,
      user_email: data.userEmail || null,
      user_name: data.userName || null,
      role: data.role || 'system',
      error_type: data.errorType,
      error_message: data.errorMessage,
      error_stack: data.errorStack || null,
      source: data.source || 'frontend',
      endpoint_or_file: data.endpointOrFile || null,
      status_code: data.statusCode || null,
      action_attempted: data.actionAttempted,
    });
  } catch (e) {
    console.warn('Failed to log error to DB (non-blocking):', e);
  }
};

// Legacy support (to avoid breaking other files temporarily)
export const logErrorLegacy = async (
  errorType: ErrorType,
  errorMessage: string,
  actionAttempted: string,
  errorDetails?: string,
  userId?: string,
  userEmail?: string,
  userName?: string,
) => {
  return logError({
    errorType,
    errorMessage,
    actionAttempted,
    errorStack: errorDetails,
    userId,
    userEmail,
    userName,
    source: 'frontend',
    role: 'student'
  });
};

// Admin: Get all error logs
export const adminGetErrorLogs = async () => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
};

// Admin: Resolve an error
export const adminResolveError = async (errorId: string, adminId: string, notes?: string) => {
  const admin = getAdminClient();
  const { error } = await admin
    .from('error_logs')
    .update({
      resolved: true,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes || 'Resolved by admin',
    })
    .eq('id', errorId);

  if (error) throw error;

  // Log admin action
  await admin.from('admin_actions').insert({
    admin_id: adminId,
    action_type: 'resolve_error',
    description: `Resolved error: ${errorId}`,
    metadata: { error_id: errorId, notes },
  });
};

// Admin: Delete an error log
export const adminDeleteErrorLog = async (errorId: string) => {
  const admin = getAdminClient();
  const { error } = await admin
    .from('error_logs')
    .delete()
    .eq('id', errorId);

  if (error) throw error;
};

// Admin: Get error stats
export const adminGetErrorStats = async () => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('error_logs')
    .select('error_type, resolved');

  if (error) throw error;

  const logs = data || [];
  return {
    total: logs.length,
    unresolved: logs.filter((l: any) => !l.resolved).length,
    resolved: logs.filter((l: any) => l.resolved).length,
    byType: logs.reduce((acc: Record<string, number>, l: any) => {
      acc[l.error_type] = (acc[l.error_type] || 0) + 1;
      return acc;
    }, {}),
  };
};
