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
  const [hasSessionHint] = useState<boolean>(() => {
    // Synchronous check on mount
    const hint = localStorage.getItem('internship-auth-token');
    try {
      if (!hint) return false;
      const parsed = JSON.parse(hint);
      return !!(parsed.access_token && parsed.user);
    } catch {
      return !!hint;
    }
  });


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
    const sessionHint = localStorage.getItem('internship-auth-token');
    const timeoutDuration = sessionHint ? 12000 : 5000; // Increased for reliability
    
    let isInitialized = false;

    const safetyTimer = setTimeout(() => {
      if (!isInitialized) {
        console.warn('Auth initialization timeout, forcing load completion...');
        setLoading(false);
      }
    }, timeoutDuration);

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing...');
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
          console.log('[Auth] Found user record:', userRecord.id);
          const role = await fetchUserRole(userRecord.id);
          
          setUser({
            id: userRecord.id,
            email: userRecord.email,
            user_metadata: userRecord.user_metadata,
            role,
          });
        } else {
          console.log('[Auth] No user record found in initial check');
        }
      } catch (err: any) {
        console.error('[Auth] Initialization error:', err);
      } finally {
        isInitialized = true;
        clearTimeout(safetyTimer);
        // We don't necessarily set loading to false here yet, 
        // as the onAuthStateChange listener might still be processing.
        // But if we found no user and we are done, we should.
        if (!localStorage.getItem('internship-auth-token')) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      console.log(`[Auth] State Change: ${event}`, session?.user?.id);
      
      if (session?.user) {
        // Hydration: Only block if this is the first time we see any user
        const isInitialLoad = !user;
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          // If we are signed in, we need the role
          const role = await fetchUserRole(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            role,
          });
          
          isInitialized = true;
          clearTimeout(safetyTimer);
          setLoading(false);
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
        // No session: only drop loading if we are sure we are done initializing
        // OR if a SIGNED_OUT event happened
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          isInitialized = true;
          clearTimeout(safetyTimer);
        } else if (isInitialized || !localStorage.getItem('internship-auth-token')) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await signIn(email, password);
    if (data.user) {
      // Track login activity
      await updateLoginActivity(data.user.id);

      const role = await fetchUserRole(data.user.id);
      const authUser = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
        role,
      };
      
      setUser(authUser);
      return authUser;
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
    hasSessionHint,
    isAdmin: user?.role === 'admin' || user?.email === 'admin@admin.com' || user?.email === 'admin@gmail.com',
    isRootAdmin: user?.email === 'admin@admin.com',
  };
}
