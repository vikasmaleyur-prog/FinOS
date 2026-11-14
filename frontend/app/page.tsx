'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F5FA] flex items-center justify-center">
      <div className="h-7 w-7 border-3 border-[#663399] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
