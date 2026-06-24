'use client';

import { ReactNode } from 'react';
import { Card } from './Card';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function FormCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Card className={`mb-6 ${className}`}>{children}</Card>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>;
}
