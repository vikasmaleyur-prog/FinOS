'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-finos-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-finos-purple border-t-transparent" />
    </div>
  );
}
