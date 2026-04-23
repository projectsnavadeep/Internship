import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getProfile, updateLoginActivity, getCurrentUser, getSession } from '@/lib/supabase';
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
    if (typeof window === 'undefined') return false;
    const ls = localStorage.getItem('internship-auth-token');
    const cookie = document.cookie.includes('internship-auth-token');
    return !!(ls || cookie);
  });

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const profile = await getProfile(userId);
      return (profile?.role as UserRole) || 'student';
    } catch {
      return 'student';
    }
  }, []);

  const hydrateUser = useCallback(async (userRecord: any) => {
    if (!userRecord) return null;
    const role = await fetchUserRole(userRecord.id);
    const authUser: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      user_metadata: userRecord.user_metadata,
      role,
    };
    setUser(authUser);
    return authUser;
  }, [fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Initialization safety timeout');
        setLoading(false);
      }
    }, hasSessionHint ? 8000 : 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log(`[Auth] Event: ${event}`, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await hydrateUser(session.user);
          setLoading(false);
          clearTimeout(safetyTimer);
        } else {
          // Token refresh or other updates: update state silently
          setUser(prev => {
             if (!prev) {
                hydrateUser(session.user).then(() => {
                   if (mounted) setLoading(false);
                });
                return prev;
             }
             return {
               ...prev,
               id: session.user.id,
               email: session.user.email,
               user_metadata: session.user.user_metadata,
             };
          });
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION') {
        // No session found on startup. Check one last time just in case of race condition.
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
      } else {
        // No session hint left?
        const stillHasHint = localStorage.getItem('internship-auth-token') || document.cookie.includes('internship-auth-token');
        if (!stillHasHint && mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [hydrateUser, hasSessionHint]);

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

  const logout = useCallback(async () => {
    setUser(null);
    await signOut();
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasSessionHint,
    isAdmin: user?.role === 'admin' || user?.email?.includes('admin@'),
    isRootAdmin: user?.email === 'admin@admin.com',
  };
}
