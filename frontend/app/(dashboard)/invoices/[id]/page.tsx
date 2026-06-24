'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  note: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  user: {
    name: string;
    email: string;
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { checkAuth } = useAuthStore();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (error) {
      toast.error('Invoice not found');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuth();
      if (!valid) {
        router.push('/login');
        return;
      }
      fetchInvoice();
    };
    init();
  }, [id, router, checkAuth]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    setUpdating(true);
    try {
      await api.patch(`/invoices/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchInvoice();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to update status');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      SENT: 'bg-blue-200 text-blue-800',
      PAID: 'bg-green-200 text-green-800',
      OVERDUE: 'bg-red-200 text-red-800',
      CANCELLED: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      DRAFT: ['SENT'],
      SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
      PAID: [],
      OVERDUE: ['PAID', 'CANCELLED'],
      CANCELLED: [],
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <SkeletonCard /> {/* Kotak kartu 1 */}
        <div>
          <SkeletonCard /> {/* Kotak kartu 2 */}
          <SkeletonText /> {/* Baris teks di bawah kartu 2 */}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(invoice.status);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-gray-500">
            Created: {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/invoices')}>
          ← Back
        </Button>
      </div>

      {/* Status Section */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex gap-2">
            {nextStatuses.length > 0 ? (
              nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant="primary"
                  size="sm"
                  loading={updating}
                  onClick={() => updateStatus(status)}
                >
                  Mark as {status}
                </Button>
              ))
            ) : (
              <span className="text-sm text-gray-400">No more status updates</span>
            )}
          </div>
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-gray-900">{invoice.customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{invoice.customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-gray-900">{invoice.customer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-gray-900">{invoice.customer.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-gray-900">{new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
          </div>
          {invoice.note && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Note</p>
              <p className="text-gray-900">{invoice.note}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Qty</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    Rp {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    Rp {item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Subtotal
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-900">
                  Rp {invoice.subtotal.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Tax (11%)
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-900">
                  Rp {invoice.tax.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td colSpan={3} className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                  Total
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                  Rp {invoice.total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Created By */}
      <div className="text-sm text-gray-500 text-right">
        Created by: {invoice.user?.name || 'Unknown'} ({invoice.user?.email || ''})
      </div>
    </div>
  );
}
