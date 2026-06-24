import { z } from 'zod';

const phoneRegex = /^(?:\+62|0)[0-9]{9,13}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-.,&()]+$/, 'Name contains invalid characters'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .regex(phoneRegex, 'Invalid phone number format (use +62 or 0 prefix)')
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .max(250, 'Address must be less than 250 characters')
    .optional()
    .or(z.literal('')),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
