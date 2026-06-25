'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { SkeletonForm } from '@/components/ui/Skeleton';
import { components, OptionProps } from 'react-select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, InvoiceFormData } from '@/lib/validations/invoice';
import { FormField } from '@/components/ui/Form';
import { X, Plus, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { customerSchema, CustomerFormData } from '@/lib/validations/customer';
import { FormActions } from '@/components/ui/Form';
import CreatableSelect from 'react-select/creatable';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface CustomerOption {
  value: string;
  label: string;
  __isNew?: boolean;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Form new customer
  const {
    register: registerCustomer,
    handleSubmit: handleCustomerSubmit,
    reset: resetCustomer,
    formState: { errors: customerErrors, isSubmitting: isCustomerSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', phone: '', address: '' },
  });

  // Form invoice
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      dueDate: '',
      note: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} - ${c.email}`,
  }));

  // Fetch customers
  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      const valid = await checkAuth();
      if (!valid) {
        router.push('/login');
        return;
      }
      try {
        const res = await api.get('/customers');
        setCustomers(res.data?.data || []);
      } catch {
        router.push('/login');
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [router, checkAuth]);

  if (pageLoading) {
    return <SkeletonForm />;
  }

  // Submit invoice
  const onSubmit = async (data: InvoiceFormData) => {
    if (!data.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!data.dueDate) {
      toast.error('Please select a due date');
      return;
    }
    if (data.items.some(item => !item.description || item.quantity < 1 || item.unitPrice < 0)) {
      toast.error('Please fill all item fields correctly');
      return;
    }

    setLoading(true);
    try {
      await api.post('/invoices', {
        customerId: data.customerId,
        dueDate: data.dueDate,
        note: data.note,
        items: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      toast.success('Invoice created successfully!');
      router.push('/invoices');
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to create invoice');
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new customer
  const onCustomerSubmit = async (data: CustomerFormData) => {
    try {
      const res = await api.post('/customers', data);
      toast.success('Customer created successfully!');
      
      // Refresh customer list
      const customerRes = await api.get('/customers');
      setCustomers(customerRes.data?.data || []);
      
      // Auto-select new created customer
      setValue('customerId', res.data.id);
      
      setIsCustomerModalOpen(false);
      resetCustomer();
      setNewCustomerName('');
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to create customer');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const CustomOption = (props: OptionProps<CustomerOption>) => {
    const { data } = props;
    
    if (data.__isNew) {
      return (
        <components.Option {...props}>
          <div 
            className="flex items-center gap-2 text-blue-600 font-medium cursor-pointer"
            onClick={() => {
              const cleanName = data.label.replace('+ Create "', '').replace('"', '');
              setNewCustomerName(cleanName);
              setIsCustomerModalOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4" />
            Create "{data.label.replace('+ Create "', '').replace('"', '')}"
          </div>
        </components.Option>
      );
    }
    
    return <components.Option {...props} />;
  };

  // Hitung totals
  const itemsValues = watch('items');
  const subtotal = itemsValues?.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0) || 0;
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <Button variant="secondary" onClick={() => router.push('/invoices')}>
          Cancel
        </Button>
      </div>

      {/* Info Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          📄 New invoice will be created as <strong>DRAFT</strong>.
          You can update the status to <strong>SENT</strong> or <strong>PAID</strong> later.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormField label="Customer" error={errors.customerId?.message} required>
                <CreatableSelect
                    options={customerOptions}
                    value={customerOptions.find((opt) => opt.value === watch('customerId'))}
                    onChange={(option) => {
                      if (option && !Array.isArray(option)) {
                        setValue('customerId', (option as { value: string })?.value || '');
                      } else {
                        setValue('customerId', '');
                      }
                    }}
                    placeholder="Search or create customer..."
                    isClearable
                    className="text-sm"
                    classNames={{
                      control: (state) => 
                        `rounded-lg border ${errors.customerId ? 'border-red-500' : 'border-gray-300'} 
                        ${state.isFocused ? 'border-blue-500 ring-2 ring-blue-200' : ''}`,
                    }}
                    components={{ Option: CustomOption }}
                    formatCreateLabel={(inputValue) => `+ Create "${inputValue}"`}
                    onCreateOption={(inputValue) => {
                      setNewCustomerName(inputValue);
                      setIsCustomerModalOpen(true);
                    }}
                  />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Type customer name and click "Create" to add new customer
                </p>
              </FormField>
            </div>
            <div>
              <FormField label="Due Date" error={errors.dueDate?.message} required>
                <Input
                  type="date"
                  {...register('dueDate')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <FormField label="Note" error={errors.note?.message}>
                <Input
                  type="text"
                  {...register('note')}
                  placeholder="Optional note..."
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Invoice Items */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const qty = watch(`items.${index}.quantity`) || 0;
              const price = watch(`items.${index}.unitPrice`) || 0;
              const itemTotal = qty * price;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                  {/* Description */}
                  <div className="sm:col-span-5">
                    <FormField label="Description" error={errors.items?.[index]?.description?.message}>
                      <Input {...register(`items.${index}.description`)} placeholder="Item description" />
                    </FormField>
                  </div>
                  
                  {/* Qty */}
                  <div className="sm:col-span-2">
                    <FormField label="Qty" error={errors.items?.[index]?.quantity?.message}>
                      <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    </FormField>
                  </div>
                  
                  {/* Price */}
                  <div className="sm:col-span-2">
                    <FormField label="Price" error={errors.items?.[index]?.unitPrice?.message}>
                      <Input type="number" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                    </FormField>
                  </div>
                  
                  {/* Total */}
                  <div className="sm:col-span-2">
                    <FormField label="Total">
                      <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg">
                        Rp {itemTotal.toLocaleString()}
                      </div>
                    </FormField>
                  </div>
                  
                  {/* Delete button */}
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="w-full px-2 py-2 text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center"
                      disabled={fields.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Item validation error */}
          {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && (
            <p className="text-sm text-red-500 mt-2">{errors.items.message}</p>
          )}
        </Card>

        <Card className="mb-6">
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (11%)</span>
              <span className="font-medium text-gray-900">Rp {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600">Rp {total.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push('/invoices')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading || isSubmitting}>
            Create Invoice (DRAFT)
          </Button>
        </div>
      </form>

      {/* Modal Create Customer */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          resetCustomer();
          setNewCustomerName('');
        }}
        title="Create New Customer"
      >
        <form onSubmit={handleCustomerSubmit(onCustomerSubmit)} className="space-y-4">
          <FormField label="Name" error={customerErrors.name?.message} required>
            <Input 
              {...registerCustomer('name')} 
              placeholder="Customer name"
              defaultValue={newCustomerName}
            />
          </FormField>
          <FormField label="Email" error={customerErrors.email?.message} required>
            <Input {...registerCustomer('email')} placeholder="customer@example.com" />
          </FormField>
          <FormField label="Phone" error={customerErrors.phone?.message}>
            <Input {...registerCustomer('phone')} placeholder="Phone number" />
          </FormField>
          <FormField label="Address" error={customerErrors.address?.message}>
            <Input {...registerCustomer('address')} placeholder="Address" />
          </FormField>
          <FormActions>
            <Button type="submit" loading={isCustomerSubmitting}>
              Create Customer
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setIsCustomerModalOpen(false);
                resetCustomer();
                setNewCustomerName('');
              }}
            >
              Cancel
            </Button>
          </FormActions>
        </form>
      </Modal>
    </div>
  );
}
