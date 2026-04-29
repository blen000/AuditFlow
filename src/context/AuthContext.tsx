"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const login = (u: User) => {
    setUser(u);
    setPermissions(withAdminPermissions(u?.role, u.permissions || []));
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(u));
    localStorage.setItem('isAuthenticated', 'true');
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
