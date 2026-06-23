'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    dueDate: '',
    note: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    api.get('/customers')
      .then((res) => setCustomers(res.data))
      .catch(() => router.push('/login'));
  }, [router]);

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = calculateItemTotal(
              field === 'quantity' ? Number(value) : item.quantity,
              field === 'unitPrice' ? Number(value) : item.unitPrice
            );
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    const newId = String(Date.now());
    setItems([
      ...items,
      { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      alert('Minimal 1 item');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔍 Customer ID:', form.customerId); // ← TAMBAHKAN INI
    console.log('🔍 Items:', items);

    // Validasi customerId
    if (!form.customerId) {
      alert('Please select a customer');
      setLoading(false);
      return;
    }

    if (items.some((item) => !item.description || item.quantity < 1 || item.unitPrice < 1)) {
      alert('Please fill all item fields correctly');
      setLoading(false);
      return;
    }

    try {
      await api.post('/invoices', {
        customerId: form.customerId,
        dueDate: form.dueDate,
        note: form.note,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      router.push('/invoices');
    } catch (error) {
      alert('Failed to create invoice');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <Button variant="secondary" onClick={() => router.push('/invoices')}>
          Cancel
        </Button>
      </div>

      {/* 🔥 TAMBAHKAN INI - Info Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          📄 New invoice will be created as <strong>DRAFT</strong>.
          You can update the status to <strong>SENT</strong> or <strong>PAID</strong> later.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Optional note..."
              />
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              + Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg">
                    Rp {item.total.toLocaleString()}
                  </div>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-full px-2 py-2 text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          <Button type="submit" loading={loading}>
            Create Invoice (DRAFT)
          </Button>
        </div>
      </form>
    </div>
  );
}
