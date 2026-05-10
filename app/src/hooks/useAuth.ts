import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getProfile, updateLoginActivity, getSession } from '@/lib/supabase';
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
  const roleLoading = false; // Stubbed out to remove unused setter warning
  
  const [hasSessionHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ls = localStorage.getItem('internship-auth-token');
    const cookie = document.cookie.includes('internship-auth-token');
    return !!(ls || cookie);
  });

  const fetchUserRoleAsync = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const profile = await getProfile(userId);
      const role = (profile?.role as UserRole) || 'student';
      localStorage.setItem(`role_${userId}`, role);
      return role;
    } catch {
      return 'student';
    }
  }, []);

  const hydrateUser = useCallback(async (userRecord: any) => {
    if (!userRecord) return null;
    
    // Fast path: use cached role to avoid blocking render
    const cachedRole = localStorage.getItem(`role_${userRecord.id}`) as UserRole | null;
    const initialRole = cachedRole || 'student';

    const authUser: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      user_metadata: userRecord.user_metadata,
      role: initialRole,
    };
    setUser(authUser);
    
    // Background update
    fetchUserRoleAsync(userRecord.id).then(verifiedRole => {
      if (verifiedRole !== initialRole) {
        setUser(prev => prev ? { ...prev, role: verifiedRole } : null);
      }
    });

    return authUser;
  }, [fetchUserRoleAsync]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: only trigger if we haven't resolved anything
    const safetyTimer = setTimeout(() => {
      if (mounted && loading && !user) {
        console.warn('[Auth] Initialization safety timeout');
        setLoading(false);
      }
    }, hasSessionHint ? 2000 : 500);

    // Eagerly check session to bypass onAuthStateChange delays
    getSession().then(async session => {
      if (!mounted) return;
      if (session?.user) {
        await hydrateUser(session.user);
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    }).catch(() => {
       // Ignore, let onAuthStateChange handle it
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log(`[Auth] Event: ${event}`, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await hydrateUser(session.user);
          setLoading(false);
          clearTimeout(safetyTimer);
        } else {
          // Token refresh or other updates
          const cachedRole = localStorage.getItem(`role_${session.user.id}`) as UserRole | null;
          const role = user?.role || cachedRole || 'student';
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            role,
          });
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION') {
        // No session found on startup.
        setLoading(false);
        clearTimeout(safetyTimer);
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
