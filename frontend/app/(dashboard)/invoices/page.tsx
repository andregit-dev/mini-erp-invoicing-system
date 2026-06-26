'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import { Search, X, Loader2, Plus, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRangeKey, setDateRangeKey] = useState(0); // Trigger fetch
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
      
      if (startDate) {
        url += `&startDate=${startDate.toISOString().split('T')[0]}`;
      }
      if (endDate) {
        url += `&endDate=${endDate.toISOString().split('T')[0]}`;
      }
      
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      
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
  }, [router, filter, debouncedSearch, sortBy, sortOrder, dateRangeKey]);

  const applyDateRange = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date cannot be greater than end date');
      return;
    }
    setDateRangeKey((prev) => prev + 1);
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setDateRangeKey((prev) => prev + 1);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    if (!confirm(`Are you sure you want to change status to "${newStatus}" for invoice #${invoice.invoiceNumber}?`)) {
      return;
    }

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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortableHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field ? (
          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </div>
    </th>
  );


  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => router.push('/invoices/create')}
              className="flex items-center gap-1 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
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

          {/* Status Filter */}
          <div className="relative w-36 flex-shrink-0">
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

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Due date:</span>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-lg px-2 py-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start"
                className="w-24 text-sm bg-transparent focus:outline-none"
                dateFormat="MM/dd/yy"
                isClearable
              />
              <span className="text-gray-400 text-sm">→</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                placeholderText="End"
                className="w-24 text-sm bg-transparent focus:outline-none"
                dateFormat="MM/dd/yy"
                isClearable
              />
            </div>

            {/* Apply & Clear */}
            <button
              onClick={applyDateRange}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply
            </button>

            {(startDate || endDate) && (
              <button
                onClick={clearDateRange}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        {/* <span className="text-xs text-gray-500 mt-1 block mb-4">
          {loading ? 'Loading...' : `Found ${pagination.total} invoices`}
        </span> */}

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : invoices.length === 0 ? (
          <EmptyState
            title={
              search || filter || startDate || endDate
                ? `No invoices found${search ? ` for "${search}"` : ''}${filter ? ` with status "${filter}"` : ''}`
                : 'No invoices yet'
            }
            description={
              search || filter || startDate || endDate
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
                      <SortableHeader field="invoiceNumber" label="Invoice #" />
                      <SortableHeader field="customer" label="Customer" />
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                      <SortableHeader field="dueDate" label="Due Date" /> 
                      <SortableHeader field="status" label="Status" />
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const nextStatuses = getNextStatuses(invoice.status);
                      return (
                        <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline font-medium">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{invoice.customer.name}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            Rp {invoice.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={invoice.status as Status} showDot showIcon={false} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 min-w-[100px]">
                              {nextStatuses.length > 0 ? (
                                <select
                                  className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
                                  onChange={(e) => updateStatus(invoice.id, e.target.value)}
                                  value=""
                                  disabled={updating === invoice.id}
                                >
                                  <option value="">Update status</option>
                                  {nextStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-400 whitespace-nowrap">No actions</span>
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
