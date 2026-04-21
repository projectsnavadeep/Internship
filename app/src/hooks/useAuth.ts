import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile, updateLoginActivity, logError } from '@/lib/supabase';
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
    const safetyTimer = setTimeout(() => {
      console.warn('Auth initialization taking too long, forcing load completion...');
      setLoading(false);
    }, 5000);

    // Check current user on mount
    getCurrentUser().then(async (user) => {
      if (user) {
        let role: UserRole = 'student';
        try {
          role = await fetchUserRole(user.id);
        } catch (err: any) {
          console.error('Role fetch failed:', err);
          logError({
            errorType: 'auth',
            errorMessage: err.message || 'Initial role fetch failed',
            actionAttempted: 'fetchUserRole',
            userId: user.id
          });
        }
        
        setUser({
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          role,
        });
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    }).catch((err: any) => {
      console.error('Session check failed:', err);
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        // Only fetch role if it's a significant auth event
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          setLoading(true);
          const role = await fetchUserRole(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            role,
          });
          clearTimeout(safetyTimer);
          setLoading(false);
        } else {
          // For other events, update basic info without resetting loading
          setUser(curr => curr ? {
            ...curr,
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          } : null);
        }
      } else {
        setUser(null);
        setLoading(false);
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
