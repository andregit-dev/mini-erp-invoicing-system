'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    dueDate: string;
  }>;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { checkAuth } = useAuthStore();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuth();
      if (!valid) {
        router.push('/login');
        return;
      }

      try {
        const res = await api.get(`/customers/${id}`);
        setCustomer(res.data);
      } catch {
        router.push('/customers');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, router, checkAuth]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!customer) {
    return <div className="text-center py-8">Customer not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <Button variant="secondary" onClick={() => router.push('/customers')}>
          ← Back
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-gray-900">{customer.phone || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-gray-900">{customer.address || '-'}</p>
          </div>
        </div>
      </Card>

      {customer.invoices.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Invoice #</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2">Rp {inv.total.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inv.status === 'PAID' ? 'bg-green-200 text-green-800' :
                      inv.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(inv.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <p className="text-gray-500 text-center py-8">No invoices for this customer</p>
      )}
    </div>
  );
}
