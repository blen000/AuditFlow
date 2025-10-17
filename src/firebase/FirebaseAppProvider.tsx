'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseAppProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function FirebaseAppProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  user,
  isUserLoading,
  userError,
}: FirebaseAppProviderProps) {
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      user={user}
      isUserLoading={isUserLoading}
      userError={userError}
    >
      {children}
    </FirebaseProvider>
  );
}
