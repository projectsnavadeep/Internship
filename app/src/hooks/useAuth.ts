import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile, updateLoginActivity, getSession } from '@/lib/supabase';
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
    // Synchronous check on mount (localStorage + Cookie Mirror)
    const getHint = () => {
      const ls = localStorage.getItem('internship-auth-token');
      if (ls) return ls;
      if (typeof document !== 'undefined') {
        const name = 'internship-auth-token=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i].trim();
          if (c.indexOf(name) === 0) return decodeURIComponent(c.substring(name.length, c.length));
        }
      }
      return null;
    };

    const hint = getHint();
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
    console.log(`[Auth] Fetching role for user: ${userId}`);
    try {
      const profile = await getProfile(userId);
      const role = (profile?.role as UserRole) || 'student';
      console.log(`[Auth] Role fetched for ${userId}: ${role}`);
      return role;
    } catch (err) {
      console.error(`[Auth] Error fetching role for ${userId}:`, err);
      return 'student';
    }
  }, []);

  useEffect(() => {
    // Safety timeout: Ensure loading always eventually finishes
    const sessionHint = localStorage.getItem('internship-auth-token');
    const timeoutDuration = sessionHint ? 12000 : 5000;
    
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
        let userRecord = await getCurrentUser();
        
        if (!userRecord && (sessionHint || document.cookie.includes('internship-auth-token'))) {
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
          // We found a user, so we can stop loading
          setLoading(false);
          isInitialized = true;
          clearTimeout(safetyTimer);
        } else {
          console.log('[Auth] No user record found in initial check');
          const hasAnyHint = localStorage.getItem('internship-auth-token') || document.cookie.includes('internship-auth-token');
          if (!hasAnyHint) {
            setLoading(false);
            isInitialized = true;
            clearTimeout(safetyTimer);
          }
        }
      } catch (err: any) {
        console.error('[Auth] Initialization error:', err);
        setLoading(false);
        isInitialized = true;
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      console.log(`[Auth] State Change: ${event}`, session?.user?.id);
      
      if (session?.user) {
        const userRecord = session.user;
        
        // Hydrate role
        fetchUserRole(userRecord.id).then(role => {
          setUser({
            id: userRecord.id,
            email: userRecord.email,
            user_metadata: userRecord.user_metadata,
            role,
          });
          setLoading(false);
          isInitialized = true;
          clearTimeout(safetyTimer);
        });
      } else {
        if (event === 'SIGNED_OUT') {
          console.warn('[Auth] Explicit SIGNED_OUT event');
          setUser(null);
          setLoading(false);
          isInitialized = true;
          clearTimeout(safetyTimer);
        } else {
          const hasLS = !!localStorage.getItem('internship-auth-token');
          const hasCookie = document.cookie.includes('internship-auth-token');
          
          // Only clear user if we are initialized AND there are absolutely no hints
          // OR if we've been waiting too long (timeout handled by safetyTimer)
          if (isInitialized && !hasLS && !hasCookie) {
            console.log('[Auth] No session hints found, clearing user state');
            setUser(null);
            setLoading(false);
          } else if (!isInitialized && (hasLS || hasCookie)) {
            console.log('[Auth] Holding user state due to session hints...');
          } else if (isInitialized) {
            // If initialized but still no session from Supabase, but we HAVE hints...
            // This is a weird state, usually means the session is invalid.
            // We'll let the safety timer or a subsequent event handle it.
            console.warn('[Auth] Initialized with hints but no session from Supabase');
          }
        }
      }
    });

    // Multi-tab Sync
    const syncChannel = new BroadcastChannel('supabase-auth-sync');
    syncChannel.onmessage = (e) => {
      if (e.data.type === 'SESSION_REMOVED') {
        setUser(null);
        setLoading(false);
      } else if (e.data.type === 'SESSION_UPDATED' && !user) {
        initializeAuth();
      }
    };

    return () => {
      subscription.unsubscribe();
      syncChannel.close();
    };
  }, [fetchUserRole, user]); // Include user in deps to correctly handle sync check

  const login = useCallback(async (email: string, password: string) => {
    const data = await signIn(email, password);
    if (data.user) {
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
    setUser(null);
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
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
