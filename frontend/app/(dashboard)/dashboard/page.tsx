'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { SkeletonStats } from '@/components/ui/Skeleton';

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
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuth();
      if (!valid) {
        router.push('/login');
        return;
      }

      try {
        const res = await api.get('/invoices/dashboard');
        setData(res.data);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, checkAuth]);

  if (loading) {
    // return <div className="text-center py-8">Loading...</div>;
    return <SkeletonStats />;
  }

  const stats = [
    { label: 'Total Invoices', value: data?.totalInvoices || 0 },
    { label: 'Revenue', value: `Rp ${(data?.totalRevenue || 0).toLocaleString()}` },
    { label: 'DRAFT', value: data?.statusCounts?.DRAFT || 0 },
    { label: 'PAID', value: data?.statusCounts?.PAID || 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {user?.name || 'User'}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
