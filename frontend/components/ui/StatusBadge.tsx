'use client';

import { Clock, Send, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export type Status = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface StatusBadgeProps {
  status: Status;
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<Status, {
  label: string;
  color: string;
  dotColor: string;
  icon: React.ElementType;
}> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-400',
    icon: Clock,
  },
  SENT: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
    icon: Send,
  },
  PAID: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    icon: CheckCircle,
  },
  OVERDUE: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
    icon: AlertCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-500 border-gray-300',
    dotColor: 'bg-gray-400',
    icon: XCircle,
  },
};

export function StatusBadge({
  status,
  showDot = true,
  showIcon = false,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border ${config.color} ${className}
      `}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />}
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
