"use client";

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Use location.replace to perform a client-side full navigation
    // which avoids potential server/client rendering mismatches.
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }, []);

  return null;
}
