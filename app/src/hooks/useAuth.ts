import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile, updateLoginActivity, logError, getSession } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
  role?: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from profiles table
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const profile = await getProfile(userId);
      return (profile?.role as UserRole) || 'student';
    } catch {
      return 'student';
    }
  }, []);

  useEffect(() => {
    // Safety timeout: Ensure loading always eventually finishes
    // If we have a hint that a session SHOULD exist, we wait longer before giving up
    const sessionHint = localStorage.getItem('internship-auth-token');
    const timeoutDuration = sessionHint ? 8000 : 4000;
    
    const safetyTimer = setTimeout(() => {
      console.warn('Auth initialization taking too long, forcing load completion...');
      setLoading(false);
    }, timeoutDuration);

    const initializeAuth = async () => {
      try {
        // Primary check: getUser (verified by server)
        let userRecord = await getCurrentUser();
        
        // Secondary check: getSession (faster, from local state if available)
        if (!userRecord && sessionHint) {
          const session = await getSession();
          if (session?.user) {
            userRecord = session.user;
          }
        }

        if (userRecord) {
          let role: UserRole = 'student';
          try {
            role = await fetchUserRole(userRecord.id);
          } catch (err: any) {
            console.error('Role fetch failed:', err);
            logError({
              errorType: 'auth',
              errorMessage: err.message || 'Initial role fetch failed',
              actionAttempted: 'fetchUserRole',
              userId: userRecord.id
            });
          }
          
          setUser({
            id: userRecord.id,
            email: userRecord.email,
            user_metadata: userRecord.user_metadata,
            role,
          });
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
      } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        // Silent Hydration: Only block if this is the first time we see any user
        const isInitialLoad = !user;
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          if (isInitialLoad) setLoading(true);
          
          const role = await fetchUserRole(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            role,
          });
          
          if (isInitialLoad) {
            clearTimeout(safetyTimer);
            setLoading(false);
          }
        } else {
          // For other events (token refresh etc), update basic info silently
          setUser(curr => curr ? {
            ...curr,
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          } : {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            role: 'student',
          });
        }
      } else {
        // No session: only drop loading if we were actually expecting one
        setUser(null);
        setLoading(false);
      }
    });
 Broadway
    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await signIn(email, password);
    if (data.user) {
      // Track login activity
      await updateLoginActivity(data.user.id);

      const role = await fetchUserRole(data.user.id);
      setUser({
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
        role,
      });
    }
    return data.user;
  }, [fetchUserRole]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const data = await signUp(email, password, fullName);
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
        role: 'student',
      });
    }
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Optimistic UI update: clear user state immediately
    setUser(null);
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Optional: restore user if strict consistency is needed, but usually we just want them logged out locally anyway
      // setUser(previousUser);
    }
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.email === 'admin@admin.com' || user?.email === 'admin@gmail.com',
    isRootAdmin: user?.email === 'admin@admin.com',
  };
}
