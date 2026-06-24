'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      setUserName(user.name || 'User');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Title */}
        <Link 
          href="/dashboard" 
          className="text-base sm:text-lg font-semibold text-gray-800 whitespace-nowrap hover:text-blue-600 transition"
        >
          Dashboard
        </Link>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-600 whitespace-nowrap">
            <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm hidden sm:inline">{userName}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
