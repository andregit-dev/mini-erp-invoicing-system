'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Revenue</p>
            <p className="text-2xl font-bold">Rp 0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Customers</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
