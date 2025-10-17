'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Important! When deployed to Firebase App Hosting, initializeApp() is called
  // without arguments. It automatically discovers the configuration from the
  // environment. For local development, it will fall back to the config object.
  try {
    const app = initializeApp();
    return getSdks(app);
  } catch (e) {
    console.warn(
      'Automatic Firebase initialization failed, falling back to local config. This is normal for local development.',
      e
    );
    // The conditional logic here is to prevent an error in the local dev
    // environment when the config is empty.
    const app = initializeApp(firebaseConfig.projectId ? firebaseConfig : {});
    return getSdks(app);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp, '(default)'),
  };
}

export * from './provider';
export * from './FirebaseAppProvider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './non-blocking-updates';
