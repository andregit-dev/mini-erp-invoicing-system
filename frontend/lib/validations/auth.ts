import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// export const registerSchema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   email: z
//     .string()
//     .min(1, 'Email is required')
//     .email('Invalid email format')
//     .max(100, 'Email must be less than 100 characters')
//     .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  
//   password: z.string().min(6, 'Password must be at least 6 characters'),
// });

export type LoginFormData = z.infer<typeof loginSchema>;
// export type RegisterFormData = z.infer<typeof registerSchema>;
