'use client';

import { useState, useEffect } from 'react';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || 'User');
      } catch {
        setUserName('User');
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Welcome, {userName}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
