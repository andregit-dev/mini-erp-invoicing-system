import { z } from 'zod';

const futureDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const invoiceItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(99999, 'Quantity must be less than 100,000'),
  
  unitPrice: z
    .number()
    .min(0, 'Price must be greater than 0')
    .max(999999999, 'Price must be less than 999,999,999'),
});

export const invoiceSchema = z.object({
  customerId: z
    .string()
    .min(1, 'Customer is required')
    .regex(/^[a-z0-9]+$/, 'Invalid customer ID format'),
  
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .regex(futureDateRegex, 'Invalid date format (use YYYY-MM-DD)')
    .refine(
      (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
      'Due date must be today or in the future'
    ),
  
  note: z
    .string()
    .max(200, 'Note must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least 1 item is required')
    .max(100, 'Maximum 100 items per invoice'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
