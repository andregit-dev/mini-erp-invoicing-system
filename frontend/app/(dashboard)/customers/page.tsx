'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, X, Loader2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { customerSchema, CustomerFormData } from '@/lib/validations/customer';
import { FormField, FormActions } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', phone: '', address: '' },
  });

  const fetchCustomers = async (page: number = 1) => {
    setLoading(true);
    setIsSearching(false);
    try {
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const url = `/customers?page=${page}&limit=10${searchParam}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      const res = await api.get(url);
      
      if (res.data && res.data.data) {
        setCustomers(res.data.data);
        setPagination(res.data.meta);
      } else {
        setCustomers(res.data);
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
      fetchCustomers();
    };
    init();
  }, [router, debouncedSearch, sortBy, sortOrder]);

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

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (editingId) {
        await api.patch(`/customers/${editingId}`, data);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created successfully!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      reset();
      fetchCustomers(pagination.page);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to save customer');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setValue('name', customer.name);
    setValue('email', customer.email);
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers(pagination.page);
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchCustomers(page);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <Button
            onClick={() => {
              setEditingId(null);
              reset();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        {/* Search Box */}
        <div className="relative mb-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setIsSearching(true);
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setIsSearching(false);
                }}
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
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingId ? 'Edit Customer' : 'Add New Customer'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Name" error={errors.name?.message} required>
              <Input {...register('name')} placeholder="Customer name" />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input {...register('email')} placeholder="customer@example.com" />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input {...register('phone')} placeholder="Phone number" />
            </FormField>
            <FormField label="Address" error={errors.address?.message}>
              <Input {...register('address')} placeholder="Address" />
            </FormField>
            <FormActions>
              <Button type="submit" loading={isSubmitting}>
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
            </FormActions>
          </form>
        </Modal>

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : customers.length === 0 ? (
          <EmptyState
            title={search ? `No customers found for "${search}"` : 'No customers yet'}
            description={search ? 'Try adjusting your search or clear the filter' : 'Add your first customer to get started'}
            icon={search ? 'search' : 'empty'}
            searchQuery={search || undefined}
            onClearSearch={search ? () => {
              setSearch('');
              setDebouncedSearch('');
            } : undefined}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader field="name" label="Name" />
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <SortableHeader field="phone" label="Phone" />
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                            {customer.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => handleEdit(customer)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(customer.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
