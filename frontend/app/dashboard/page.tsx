'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { logout, getToken, getUser } from '@/lib/auth';

interface DashboardData {
  totalInvoices: number;
  totalRevenue: number;
  statusCounts: {
    DRAFT: number;
    SENT: number;
    PAID: number;
    OVERDUE: number;
    CANCELLED: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const user = getUser();
    if (user) {
      setUserName(user.name || 'User');
    }

    // Fetch dashboard data
    api.get('/invoices/dashboard')
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        // Error handling (401 otomatis di-handle interceptor)
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm">Welcome back, {userName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{data?.totalInvoices || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              Rp {(data?.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">DRAFT</p>
            <p className="text-2xl font-bold text-gray-900">{data?.statusCounts?.DRAFT || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">PAID</p>
            <p className="text-2xl font-bold text-gray-900">{data?.statusCounts?.PAID || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
