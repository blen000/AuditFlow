"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAdminPermissions } from '@/lib/permissions';
import { logoutUser } from '@/app/actions/users';

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions?: string[];
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (u: User | null) => void;
  setUserPermissions: (p: string[]) => void;
  setIsAuthenticated: (b: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const SESSION_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS) || 30 * 60 * 1000;
  const inactivityTimerRef = useRef<number | null>(null);
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const resetInactivityTimer = () => {
    clearInactivityTimer();
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (e) {}

    inactivityTimerRef.current = window.setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT_MS);
  };

  const activityListener = () => {
    resetInactivityTimer();
  };

  const clearLocalAuthState = () => {
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('currentUser');
  };

  const setAuthenticatedState = (user: any) => {
    setUser(user);
    setPermissions(withAdminPermissions(user?.role, user?.permissions || []));
    setIsAuthenticated(true);
  };

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setIsLoading(true);
      ['currentUser', 'user_role', 'userData', 'authUser'].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        if (res.ok) {
          const { user: u } = await res.json();
          if (!mounted) return;
          setAuthenticatedState(u);
        } else {
          if (!mounted) return;
          clearLocalAuthState();
        }
      } catch {
        if (!mounted) return;
        clearLocalAuthState();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    bootstrap();

    return () => { mounted = false; };
  }, []);

  // Setup inactivity tracking and cross-tab synchronization when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimer();
      activityEvents.forEach((ev) => window.removeEventListener(ev, activityListener));
      return;
    }

    try {
      const last = Number(localStorage.getItem('lastActivity')) || Date.now();
      if (Date.now() - last > SESSION_TIMEOUT_MS) {
        logout();
        return;
      }
    } catch (e) {}

    resetInactivityTimer();
    activityEvents.forEach((ev) => window.addEventListener(ev, activityListener));

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' && e.newValue === 'false') {
        logout();
      }
      if (e.key === 'lastActivity') {
        resetInactivityTimer();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInactivityTimer();
      activityEvents.forEach((ev) => window.removeEventListener(ev, activityListener));
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const login = (u: User) => {
    setAuthenticatedState(u);
    localStorage.setItem('isAuthenticated', 'true');
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (e) {}

    if (u.requirePasswordChange) {
      router.push('/force-password-change');
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Server logout failed:', e);
    }
    clearLocalAuthState();
    try {
      router.push('/login');
    } catch (e) {}
  };

  const handleSetUser = (u: User | null) => {
    setUser(u);
    setPermissions(u ? withAdminPermissions(u.role, u.permissions || []) : []);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setUser: handleSetUser,
        setUserPermissions: setPermissions,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
