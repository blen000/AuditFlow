'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseAppProvider } from '@/firebase/FirebaseAppProvider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [areServicesReady, setAreServicesReady] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client-side after initial render
    const services = initializeFirebase();
    setFirebaseApp(services.firebaseApp);
    setAuth(services.auth);
    setFirestore(services.firestore);
    setAreServicesReady(true); // Mark services as ready

    const unsubscribe = onAuthStateChanged(
      services.auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setUserLoading(false);
          setUserError(null);
        } else {
          // If no user is logged in, initiate anonymous sign-in
          signInAnonymously(services.auth).catch((error) => {
            console.error(
              'FirebaseClientProvider: Anonymous sign-in error:',
              error
            );
            setUserError(error);
            setUserLoading(false);
          });
        }
      },
      (error) => {
        console.error(
          'FirebaseClientProvider: onAuthStateChanged error:',
          error
        );
        setUser(null);
        setUserLoading(false);
        setUserError(error);
      }
    );

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on the client

  // Do not render children until Firebase services are initialized on the client
  if (!areServicesReady) {
    return null;
  }

  return (
    <FirebaseAppProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      user={user}
      isUserLoading={isUserLoading}
      userError={userError}
    >
      {children}
    </FirebaseAppProvider>
  );
}
