import { createClient } from '@supabase/supabase-js';
import type { Application, ApplicationStats, InterviewNote, Reminder, UserActivity, CompanyStats, StatusDistribution, PipelineStage, AdminRecentApplication } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// ============================================
// SESSION PERSISTENCE & MULTI-TAB SYNC
// ============================================
const AUTH_KEY = 'internship-auth-token';

// Helper to set/get cookies for "mirroring" the session
const cookieStore = {
  set: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1); // 1 year persistence
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
  },
  get: (key: string) => {
    if (typeof document === 'undefined') return null;
    const name = `${key}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return null;
  },
  remove: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    let val = window.localStorage.getItem(key);
    // If localStorage is empty (e.g. refresh in some incognito modes), try cookie recovery
    if (!val) {
      val = cookieStore.get(key);
      if (val) {
        console.log('[🚀] Recovered session from cookie mirror');
        window.localStorage.setItem(key, val); 
      }
    }
    return val;
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    cookieStore.set(key, value); // Mirror to cookie
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    cookieStore.remove(key); // Clear mirror
  }
};

const g = globalThis as any;

if (!g.__supabase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase URL or Anon Key is missing from .env! Requests will fail.');
  } else {
    console.log('[🚀] Initializing Supabase Singleton with Persistent Sync...');
    g.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: AUTH_KEY,
        storage: customStorage as any,
        flowType: 'pkce',
        lock: null as any,
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

  // Cyber Security Enforcement: Check if account is locked
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('additional_data')
      .eq('id', data.user.id)
      .single();

    if (profile?.additional_data) {
      try {
        const metadata = JSON.parse(profile.additional_data);
        if (metadata.locked === true) {
          await signOut();
          throw new Error("ACCOUNT LOCKED: Access denied by administrative order. Please contact security@interntrack.com");
        }
      } catch (e: any) {
        if (e.message.includes("ACCOUNT LOCKED")) throw e;
        // Ignore JSON parse errors for legacy data
      }
    }
  }

  return data;
};

// ============================================
// Elite Security Commands
// ============================================
export const adminLockUser = async (userId: string) => {
  if (!userId) throw new Error("Security Violation: Target UID is missing.");
  const admin = getAdminClient();
  
  // Fetch current metadata safely
  const { data: profile, error: fetchError } = await admin
    .from('profiles')
    .select('additional_data')
    .eq('id', userId)
    .single();
  
  if (fetchError) throw new Error(`Profile Acquisition Failure: ${fetchError.message}`);

  let metadata = {};
  if (profile?.additional_data) {
    try {
      metadata = typeof profile.additional_data === 'string' 
        ? JSON.parse(profile.additional_data) 
        : profile.additional_data;
    } catch (e) { metadata = {}; }
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ 
      additional_data: JSON.stringify({ ...metadata, locked: true }) 
    })
    .eq('id', userId);
  
  if (updateError) throw new Error(`Security Lock Transmission Failed: ${updateError.message}`);
};

export const adminUnlockUser = async (userId: string) => {
  if (!userId) throw new Error("Security Violation: Target UID is missing.");
  const admin = getAdminClient();
  
  const { data: profile, error: fetchError } = await admin
    .from('profiles')
    .select('additional_data')
    .eq('id', userId)
    .single();
  
  if (fetchError) throw new Error(`Profile Acquisition Failure: ${fetchError.message}`);

  let metadata = {};
  if (profile?.additional_data) {
    try {
      metadata = typeof profile.additional_data === 'string' 
        ? JSON.parse(profile.additional_data) 
        : profile.additional_data;
    } catch (e) { metadata = {}; }
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ 
      additional_data: JSON.stringify({ ...metadata, locked: false }) 
    })
    .eq('id', userId);
  
  if (updateError) throw new Error(`Security Unlock Transmission Failed: ${updateError.message}`);
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

/**
 * PERSISTENT SESSION TELEMETRY
 * Synchronizes local session duration with the central database.
 */
export const updateSessionTime = async (userId: string, minutesToIncrement: number = 1) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_minutes_spent, today_minutes_spent, last_active_date')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_active_date !== today;

    const updates = {
      total_minutes_spent: (profile.total_minutes_spent || 0) + minutesToIncrement,
      today_minutes_spent: isNewDay ? minutesToIncrement : (profile.today_minutes_spent || 0) + minutesToIncrement,
      last_active_date: today,
    };

    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  } catch (e) {
    console.warn('Session time sync failed:', e);
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

export const submitAppeal = async (userId: string, email: string, name: string, message: string) => {
  try {
    await logError({
      errorType: 'user_report',
      errorMessage: `SECURITY APPEAL: ${message}`,
      actionAttempted: 'account_appeal',
      userId,
      userEmail: email,
      userName: name,
      source: 'security_lock',
      role: 'student'
    });
    return true;
  } catch (e) {
    console.error('Appeal submission failed:', e);
    return false;
  }
};

export const updateProfile = async (userId: string, profileData: Partial<any>) => {
  const oldProfile = await getProfile(userId);

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

  await logActivity('profile_update', 'User updated identity parameters', { 
    previous: oldProfile,
    changes: profileData 
  });

  return data;
};

export const uploadAvatarImage = async (file: File, userId: string) => {
  // Validate auth before attempting storage operation
  await getUserOrFail();
  
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  trace('AVATAR UPLOAD', { filePath, fileSize: file.size, fileType: file.type });

  // Upload the file with explicit content type
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

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

  await logActivity('avatar_update', 'User updated profile visualization', { publicUrl });

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
  
  await logActivity('application_create', `New application submitted for ${cleanData.company_name}`, { 
    company: cleanData.company_name, 
    role: cleanData.job_title 
  });

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

  await logActivity('application_update', `Application parameters modified for ${data.company_name}`, { 
    applicationId: id,
    changes: updates 
  });

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

  await logActivity('reminder_create', `Calendar entry scheduled: ${cleanData.title}`, { 
    title: cleanData.title,
    date: cleanData.reminder_date 
  });

  return data as Reminder;
};

export const completeReminder = async (id: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .update({ is_completed: true, is_notified: true }) // Mark notified so agent ignores it
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;

  await logActivity('reminder_complete', `Calendar milestone achieved: ${data.title}`, { 
    reminderId: id 
  });

  // Trigger completion email asynchronously
  import('./email').then(async ({ sendCustomEmail }) => {
    try {
      const user = await getCurrentUser();
      const profile = await getProfile(user.id);
      if (user?.email && profile?.full_name) {
        await sendCustomEmail(
          user.email,
          profile.full_name,
          'Successfully Completed: ' + data.title,
          `Congratulations!\n\nYou have successfully completed the schedule/event: "${data.title}".\n\nYour progress has been recorded. Keep up the great work in your internship journey!`
        );
      }
    } catch (e) {
      console.warn('Failed to send completion email:', e);
    }
  });

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
  const user = await getUserOrFail();
  
  const cleanData = {
    ...docData,
    user_id: user.id // Safety: force the auth UID
  };

  trace('INSERT DOCUMENT', cleanData);

  const { data, error } = await supabase
    .from('documents')
    .insert(cleanData)
    .select()
    .single();
    
  if (error) {
    console.error('Document Insert Error:', error);
    throw error;
  }

  await logActivity('document_create', `Digital asset ingested: ${cleanData.name}`, { 
    name: cleanData.name, 
    type: cleanData.type 
  });

  return data;
};
export const updateDocument = async (id: string, updates: any) => {
  await getUserOrFail();
  
  trace('UPDATE DOCUMENT', { id, updates });

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Document Update Error:', error);
    throw error;
  }
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

  await logActivity('document_delete', `Digital asset purged: ${id}`, { documentId: id });
};

export const uploadDocumentFile = async (file: File, userId: string) => {
  // Ensure we have a fresh session before binary transfer
  await getUserOrFail();
  
  const fileExt = file.name.split('.').pop();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${userId}/${Date.now()}-${sanitizedName}`;

  trace('DOCUMENT UPLOAD INITIATED', { filePath, size: file.size, type: file.type });

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream'
    });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    throw uploadError;
  }

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
  
  const [
    { data: profiles, error: profileError },
    { data: authData, error: authError },
    { data: apps, error: appError }
  ] = await Promise.all([
    admin.from('profiles').select('*').order('last_login_at', { ascending: false }),
    admin.auth.admin.listUsers(),
    admin.from('applications').select('user_id')
  ]);
  
  if (profileError) throw profileError;
  if (authError) throw authError;
  if (appError) throw appError;

  const authUsers = authData?.users || [];
  
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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    { count: userCount },
    { count: appCount },
    { count: activeCount },
    { data: allApps }
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('applications').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', sevenDaysAgo.toISOString()),
    admin.from('applications').select('status')
  ]);
  
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

export const adminPromoteUserByEmail = async (email: string) => {
  const admin = getAdminClient();
  
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) throw authError;

  const targetUser = authData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (!targetUser) throw new Error("User with that email not found in the identity system.");

  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetUser.id);
    
  if (profileError) throw profileError;
  
  // also update app_metadata for JWT to ensure instantaneous access without relogin loop?
  // Our trigger in FINAL_FIX.SQL handles syncing profile.role to auth.users.raw_app_metadata.
  
  return true;
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

// Fetch calendar/schedule data for a specific student (admin drill-down)
export const adminGetUserReminders = async (userId: string) => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('reminder_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================
// ERROR LOGGING SYSTEM
// ============================================
export type ErrorType = 'auth' | 'application_save' | 'application_update' | 'application_delete' |
  'resume_upload' | 'cover_letter_upload' | 'document_upload' | 'document_delete' |
  'profile_update' | 'password_change' | 'avatar_upload' | 'data_load' | 'rendering' | 'network' | 'user_report' | 'unknown';

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
// ============================================
// Activity & Session Tracking
// ============================================
export const generateSessionId = (userId: string) => {
  const date = new Date();
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = monthNames[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  // Create a simple deterministic hash for the day + user
  const str = userId + date.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().substring(0, 4).padStart(4, '0');
  return `${month}${day}(${hex})`;
};

export const logActivity = async (actionType: string, description: string, metadata: any = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // Generate accurate session id for the current day
    const currentSessionId = generateSessionId(user.id);
    
    // Save to session storage for persistence across tabs
    window.sessionStorage.setItem('current_session_id', currentSessionId);

    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action_type: actionType,
        description,
        metadata: {
          ...metadata,
          session_id: currentSessionId
        }
      });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export const adminGetDailySessions = async () => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('daily_sessions')
    .select('*')
    .order('session_date', { ascending: false });

  if (error) throw error;
  
  // Frontend fix: Force the session_id to match the telemetry metadata if available
  return (data || []).map((session: any) => {
    const metaId = session.activity_stream?.[0]?.metadata?.session_id;
    if (metaId && metaId !== 'UNKNOWN') {
      session.session_id = metaId;
    }
    return session;
  });
};

export const adminGetSessionDetails = async (userId: string, date: string) => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${date}T00:00:00Z`)
    .lte('created_at', `${date}T23:59:59Z`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================
// GLOBAL EMAIL ALERT AGENT
// ============================================
// This runs transparently when any user logs in, processing alerts for ALL users
export const triggerGlobalEmailAlerts = async () => {
  try {
    if (!supabaseAdmin) return;
    
    // OPTIMIZATION: Throttle the agent to run at most once per hour per client
    if (typeof window !== 'undefined') {
      const lastRunStr = window.localStorage.getItem('last_global_email_run');
      const nowMs = Date.now();
      if (lastRunStr && nowMs - parseInt(lastRunStr, 10) < 60 * 60 * 1000) {
        return; // Skip if it ran within the last hour
      }
      window.localStorage.setItem('last_global_email_run', nowMs.toString());
    }

    // OPTIMIZATION: Defer execution by 5 seconds to ensure it doesn't compete with page load/rendering
    setTimeout(async () => {
      try {
        // 1. Fetch all uncompleted, un-notified reminders
        const { data: reminders, error: remError } = await supabaseAdmin
          .from('reminders')
          .select('id, user_id, title, reminder_date')
          .eq('is_completed', false)
          .eq('is_notified', false);
          
        if (remError || !reminders || reminders.length === 0) return;

        // 2. Filter reminders that are happening within the next 48 hours
        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        const upcomingReminders = reminders.filter((r: any) => {
          const remDate = new Date(r.reminder_date);
          return remDate > now && remDate <= fortyEightHoursFromNow;
        });

        if (upcomingReminders.length === 0) return;

        // 3. Fetch profiles to check preferences
        const userIds = [...new Set(upcomingReminders.map((r: any) => r.user_id))];
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, preferences')
          .in('id', userIds);
          
        // 4. Fetch auth emails
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
        const users = authData?.users || [];

        const { sendCustomEmail } = await import('./email');

        // 5. Dispatch emails
        for (const reminder of upcomingReminders) {
          const profile = (profiles || []).find((p: any) => p.id === reminder.user_id);
          const authUser = users.find((u: any) => u.id === reminder.user_id);
          
          // Check user preferences
          const prefs = profile?.preferences || {};
          const canEmail = prefs.emailNotifications !== false && prefs.deadlineReminders !== false;

          if (profile && authUser?.email && canEmail) {
             const dateStr = new Date(reminder.reminder_date).toLocaleString();
             const success = await sendCustomEmail(
               authUser.email,
               profile.full_name || 'User',
               'Action Required: Upcoming Deadline',
               `Your scheduled event or deadline "${reminder.title}" is approaching on ${dateStr}.\n\nHurry up and ensure everything is prepared for this milestone!`
             );

             if (success) {
               // Mark as notified so we don't spam
               await supabaseAdmin
                 .from('reminders')
                 .update({ is_notified: true })
                 .eq('id', reminder.id);
             }
          } else {
             // Even if they opted out, mark notified so we don't keep evaluating it
             await supabaseAdmin
                 .from('reminders')
                 .update({ is_notified: true })
                 .eq('id', reminder.id);
          }
        }
      } catch (innerErr) {
        console.error('Global Email Agent inner error:', innerErr);
      }
    }, 5000);
  } catch (err) {
    console.error('Global Email Agent error:', err);
  }
};
