'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuth();
      if (valid) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };
    init();
  }, [router, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}
