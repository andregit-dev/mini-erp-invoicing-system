'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { Card } from '@/components/ui/Card';

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

    api.get('/invoices/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
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
      <p className="text-gray-600 mb-6">Welcome back, {userName}!</p>

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
