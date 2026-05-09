import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getProfile, updateLoginActivity, getSession, logActivity } from '@/lib/supabase';
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
  const [roleLoading, setRoleLoading] = useState(false);
  
  const [hasSessionHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ls = localStorage.getItem('internship-auth-token');
    const cookie = document.cookie.includes('internship-auth-token');
    return !!(ls || cookie);
  });

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const profile = await getProfile(userId);
      
      // Strong Enforcement: Block even if session exists
      if (profile?.additional_data) {
        try {
          const meta = JSON.parse(profile.additional_data);
          if (meta.locked === true) {
            throw new Error("ACCOUNT_LOCKED");
          }
        } catch (e: any) {
          if (e.message === "ACCOUNT_LOCKED") throw e;
        }
      }

      return (profile?.role as UserRole) || 'student';
    } catch (err: any) {
      if (err.message === "ACCOUNT_LOCKED") throw err;
      return 'student';
    }
  }, []);

  const hydrateUser = useCallback(async (userRecord: any) => {
    if (!userRecord) return null;
    setRoleLoading(true);
    try {
      const role = await fetchUserRole(userRecord.id);
      const authUser: AuthUser = {
        id: userRecord.id,
        email: userRecord.email,
        user_metadata: userRecord.user_metadata,
        role,
      };
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      if (err.message === "ACCOUNT_LOCKED") {
        await signOut();
        setUser(null);
        throw err;
      }
      return null;
    } finally {
      setRoleLoading(false);
    }
  }, [fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: only trigger if we haven't resolved anything
    const safetyTimer = setTimeout(() => {
      if (mounted && loading && !user) {
        console.warn('[Auth] Initialization safety timeout');
        setLoading(false);
      }
    }, hasSessionHint ? 5000 : 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log(`[Auth] Event: ${event}`, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (!window.sessionStorage.getItem('session_start_time')) {
            window.sessionStorage.setItem('session_start_time', new Date().toISOString());
          }
          try {
            await hydrateUser(session.user);
          } catch (err: any) {
            if (err.message === "ACCOUNT_LOCKED") {
              setUser(null);
            }
          }
          setLoading(false);
          clearTimeout(safetyTimer);
        } else {
          // Token refresh or other updates
          try {
            const role = user?.role || await fetchUserRole(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata,
              role,
            });
          } catch (err: any) {
             if (err.message === "ACCOUNT_LOCKED") {
               await signOut();
               setUser(null);
             }
          }
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION') {
        // No session found on startup. Check one last time.
        try {
           const fallbackSession = await getSession();
           if (fallbackSession?.user && mounted) {
              await hydrateUser(fallbackSession.user);
           } else if (mounted) {
              setUser(null);
           }
        } catch {
           if (mounted) setUser(null);
        } finally {
           if (mounted) {
              setLoading(false);
              clearTimeout(safetyTimer);
           }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [hydrateUser, fetchUserRole, hasSessionHint, loading, user]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await signIn(email, password);
    if (data.user) {
      await updateLoginActivity(data.user.id);
      return await hydrateUser(data.user);
    }
    return null;
  }, [hydrateUser]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const data = await signUp(email, password, fullName);
    if (data.user) {
      return await hydrateUser(data.user);
    }
    return null;
  }, [hydrateUser]);

  const logout = useCallback(() => {
    // Optimistic instant UI update
    setUser(null);
    
    // Background execution to avoid blocking the UI
    logActivity('user_logout', 'User session terminated').catch(console.error);
    signOut().catch(console.error);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin@') || user?.email === 'navadeepsripathi2@gmail.com';

  return {
    user,
    loading: loading || roleLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasSessionHint,
    isAdmin,
    isRootAdmin: user?.email === 'admin@admin.com',
  };
}
