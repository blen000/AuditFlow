"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAdminPermissions } from '@/lib/permissions';

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
  // Session timeout in milliseconds. Default to 30 minutes.
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
    // persist last activity time so other tabs/windows can sync
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (e) {}

    inactivityTimerRef.current = window.setTimeout(() => {
      // perform logout when timer expires
      logout();
    }, SESSION_TIMEOUT_MS);
  };

  const activityListener = () => {
    resetInactivityTimer();
  };

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userJson = localStorage.getItem('currentUser');
      const u = userJson ? JSON.parse(userJson) : null;
      setUser(u);

      setPermissions(withAdminPermissions(u?.role, u?.permissions || []));

      setIsAuthenticated(!!authStatus && !!u);
    } catch (e) {
      setUser(null);
      setPermissions([]);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup inactivity tracking and storage-event synchronization when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // ensure timers/listeners are cleared when not authenticated
      clearInactivityTimer();
      activityEvents.forEach((ev) => window.removeEventListener(ev, activityListener));
      return;
    }

    // initialize lastActivity and start the timer
    try {
      const last = Number(localStorage.getItem('lastActivity')) || Date.now();
      // if last activity already exceeded timeout, logout immediately
      if (Date.now() - last > SESSION_TIMEOUT_MS) {
        logout();
        return;
      }
    } catch (e) {}

    resetInactivityTimer();

    // attach listeners to reset timer on activity
    activityEvents.forEach((ev) => window.addEventListener(ev, activityListener));

    // sync across tabs/windows: if another tab logs out, respond
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' && e.newValue === 'false') {
        // forced logout from another tab
        logout();
      }

      if (e.key === 'lastActivity') {
        // another tab reported activity - reset our timer
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
    setUser(u);
    setPermissions(withAdminPermissions(u?.role, u.permissions || []));
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(u));
    localStorage.setItem('isAuthenticated', 'true');
    try {
      // set initial last activity timestamp
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.setItem('isAuthenticated', 'false');
    try {
      // navigate to login page after clearing auth
      router.push('/login');
    } catch (e) {
      // swallow - navigation may fail during SSR or tests
    }
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

