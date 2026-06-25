'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import { Search, X, Loader2, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string;
  customer: { name: string };
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchInvoices = async (page: number = 1) => {
    setLoading(true);
    setIsSearching(false);
    try {
      let url = `/invoices?page=${page}&limit=10`;
      if (filter) url += `&status=${filter}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      
      const res = await api.get(url);
      
      if (res.data && res.data.data) {
        setInvoices(res.data.data);
        setPagination(res.data.meta);
      } else {
        setInvoices(res.data);
      }
    } catch {
      // 401 auto handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuth();
      if (!valid) {
        router.push('/login');
        return;
      }
      fetchInvoices();
    };
    init();
  }, [router, filter, debouncedSearch]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await api.patch(`/invoices/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchInvoices(pagination.page);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to update status');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setUpdating(null);
    }
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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchInvoices(page);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setIsSearching(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <Button
              onClick={() => router.push('/invoices/create')}
              className="flex items-center gap-1 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mb-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setIsSearching(true);
              }}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            {loading ? 'Loading...' : `Found ${pagination.total} invoices`}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : invoices.length === 0 ? (
          <EmptyState
            title={
              search || filter 
                ? `No invoices found${search ? ` for "${search}"` : ''}${filter ? ` with status "${filter}"` : ''}`
                : 'No invoices yet'
            }
            description={
              search || filter 
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'
            }
            icon={search || filter ? 'search' : 'empty'}
            searchQuery={search || filter ? (search || filter) : undefined}
            onClearSearch={(search || filter) ? () => {
              setSearch('');
              setFilter('');
            } : undefined}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const nextStatuses = getNextStatuses(invoice.status);
                      return (
                        <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{invoice.customer.name}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            Rp {invoice.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={invoice.status as Status} showDot showIcon={false} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {nextStatuses.length > 0 ? (
                                <select
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onChange={(e) => updateStatus(invoice.id, e.target.value)}
                                  value=""
                                  disabled={updating === invoice.id}
                                >
                                  <option value="">Update...</option>
                                  {nextStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-400">No actions</span>
                              )}
                              {updating === invoice.id && (
                                <span className="text-xs text-gray-500 animate-pulse">⏳</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-1 order-1 sm:order-2">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
