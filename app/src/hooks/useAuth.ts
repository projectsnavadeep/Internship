import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile, updateLoginActivity } from '@/lib/supabase';
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
    // Check current user on mount
    getCurrentUser().then(async (user) => {
      if (user) {
        try {
          const role = await fetchUserRole(user.id);
          setUser({
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            role,
          });
        } catch {
          // If profile fetch fails, still set user with default role
          setUser({
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            role: 'student',
          });
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
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
    await signOut();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.email === 'admin@gmail.com',
  };
}
