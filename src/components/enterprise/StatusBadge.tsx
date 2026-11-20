import React from 'react';
import { cn } from '@/utils/cn';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'purple';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  dot?: boolean;
  className?: string;
}

// Automatically resolve standard status strings to semantic color variants
function resolveStatusVariant(status: string): StatusVariant {
  const s = status.toUpperCase().replace(/\s+|_/g, '');

  switch (s) {
    // Success / Completed / Clean
    case 'ACTIVE':
    case 'AVAILABLE':
    case 'CLEAN':
    case 'INSPECTED':
    case 'CONFIRMED':
    case 'APPROVED':
    case 'POSTED':
    case 'PAID':
    case 'SETTLED':
    case 'COMPLETED':
    case 'CHECKEDOUT':
    case 'DELIVERED':
    case 'READY':
    case 'NOMINAL':
    case 'HEALTHY':
    case 'INHOUSE':
      return 'success';

    // Warning / Pending / Occupied
    case 'PENDING':
    case 'PENDINGAPPROVAL':
    case 'SUBMITTED':
    case 'INPROGRESS':
    case 'OCCUPIED':
    case 'DIRTY':
    case 'PARTIALLYPAID':
    case 'PARTIALLYRECEIVED':
    case 'PREPARING':
    case 'RESERVED':
    case 'OVERDUE':
    case 'MAINTENANCE':
    case 'DUEOUT':
      return 'warning';

    // Danger / Cancelled / Out of Order
    case 'INACTIVE':
    case 'CANCELLED':
    case 'REJECTED':
    case 'DELETED':
    case 'OUTOFORDER':
    case 'OUTOFSERVICE':
    case 'LOCKED':
    case 'NOSHOW':
    case 'UNPAID':
    case 'CRITICAL':
    case 'FAILED':
    case 'REVERSED':
      return 'danger';

    // Info / Arrivals
    case 'ARRIVING':
    case 'UPCOMING':
    case 'OPEN':
    case 'ISSUED':
    case 'VIP':
    case 'CORPORATE':
    case 'DRAFT':
    case 'NEW':
      return 'info';

    // Primary
    case 'CHECKEDIN':
    case 'OCC':
    case 'BILLED':
      return 'primary';

    default:
      return 'neutral';
  }
}

const variantStyles: Record<
  StatusVariant,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  success: {
    bg: 'bg-[#16845B]/10 dark:bg-[#45C79A]/15',
    text: 'text-[#16845B] dark:text-[#45C79A]',
    border: 'border-[#16845B]/25 dark:border-[#45C79A]/30',
    dot: 'bg-[#16845B] dark:bg-[#45C79A]',
  },
  warning: {
    bg: 'bg-[#C78B24]/10 dark:bg-[#E7B65A]/15',
    text: 'text-[#9A670D] dark:text-[#E7B65A]',
    border: 'border-[#C78B24]/25 dark:border-[#E7B65A]/30',
    dot: 'bg-[#C78B24] dark:bg-[#E7B65A]',
  },
  danger: {
    bg: 'bg-[#D44848]/10 dark:bg-[#F07878]/15',
    text: 'text-[#D44848] dark:text-[#F07878]',
    border: 'border-[#D44848]/25 dark:border-[#F07878]/30',
    dot: 'bg-[#D44848] dark:bg-[#F07878]',
  },
  info: {
    bg: 'bg-[#2876C7]/10 dark:bg-[#70B5F5]/15',
    text: 'text-[#2876C7] dark:text-[#70B5F5]',
    border: 'border-[#2876C7]/25 dark:border-[#70B5F5]/30',
    dot: 'bg-[#2876C7] dark:bg-[#70B5F5]',
  },
  primary: {
    bg: 'bg-[#354FC7]/10 dark:bg-[#8495FF]/15',
    text: 'text-[#354FC7] dark:text-[#8495FF]',
    border: 'border-[#354FC7]/25 dark:border-[#8495FF]/30',
    dot: 'bg-[#354FC7] dark:bg-[#8495FF]',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-400/15',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/25 dark:border-purple-400/30',
    dot: 'bg-purple-600 dark:bg-purple-400',
  },
  neutral: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  dot = true,
  className,
}) => {
  const chosenVariant = variant || resolveStatusVariant(status);
  const styles = variantStyles[chosenVariant];
  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border select-none transition-colors shrink-0',
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />}
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};
