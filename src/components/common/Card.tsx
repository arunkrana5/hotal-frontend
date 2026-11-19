import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-brand-border bg-brand-surface shadow-soft-xs transition-all duration-200',
        'dark:border-brand-darkBorder dark:bg-brand-darkSurface',
        hoverable && 'hover:shadow-card-hover hover:border-brand-primary/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, className, icon }) => {
  return (
    <div className={cn('flex items-center justify-between pb-3 mb-4 border-b border-brand-border dark:border-brand-darkBorder', className)}>
      <div className="flex items-center space-x-2.5">
        {icon && <span className="text-brand-primary shrink-0">{icon}</span>}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">{title}</h3>
          {subtitle && <p className="text-[11px] text-brand-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'teal'
  | 'neutral'
  | 'brand'
  | 'indigo';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  className,
  dot = false,
  size = 'sm',
}) => {
  const styles: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-[#16845B]/10 text-[#16845B] border-[#16845B]/20 dark:bg-[#45C79A]/15 dark:text-[#45C79A] dark:border-[#45C79A]/30',
      dot: 'bg-[#16845B] dark:bg-[#45C79A]',
    },
    warning: {
      container: 'bg-[#C78B24]/10 text-[#C78B24] border-[#C78B24]/20 dark:bg-[#E7B65A]/15 dark:text-[#E7B65A] dark:border-[#E7B65A]/30',
      dot: 'bg-[#C78B24] dark:bg-[#E7B65A]',
    },
    danger: {
      container: 'bg-[#D44848]/10 text-[#D44848] border-[#D44848]/20 dark:bg-[#F07878]/15 dark:text-[#F07878] dark:border-[#F07878]/30',
      dot: 'bg-[#D44848] dark:bg-[#F07878]',
    },
    info: {
      container: 'bg-[#2876C7]/10 text-[#2876C7] border-[#2876C7]/20 dark:bg-[#70B5F5]/15 dark:text-[#70B5F5] dark:border-[#70B5F5]/30',
      dot: 'bg-[#2876C7] dark:bg-[#70B5F5]',
    },
    brand: {
      container: 'bg-[#354FC7]/10 text-[#354FC7] border-[#354FC7]/20 dark:bg-[#8495FF]/15 dark:text-[#8495FF] dark:border-[#8495FF]/30',
      dot: 'bg-[#354FC7] dark:bg-[#8495FF]',
    },
    indigo: {
      container: 'bg-[#354FC7]/10 text-[#354FC7] border-[#354FC7]/20 dark:bg-[#8495FF]/15 dark:text-[#8495FF] dark:border-[#8495FF]/30',
      dot: 'bg-[#354FC7] dark:bg-[#8495FF]',
    },
    purple: {
      container: 'bg-[#8064D8]/10 text-[#8064D8] border-[#8064D8]/20 dark:bg-[#A78BFA]/15 dark:text-[#A78BFA] dark:border-[#8064D8]/30',
      dot: 'bg-[#8064D8]',
    },
    teal: {
      container: 'bg-[#159E9A]/10 text-[#159E9A] border-[#159E9A]/20 dark:bg-[#2DD4BF]/15 dark:text-[#2DD4BF] dark:border-[#159E9A]/30',
      dot: 'bg-[#159E9A]',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-semibold border tracking-tight select-none space-x-1.5',
        styles[variant].container,
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles[variant].dot)} />}
      <span>{children}</span>
    </span>
  );
};

export interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  title?: string;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  title,
  className,
  onClose,
}) => {
  const styles = {
    success: 'bg-[#16845B]/10 text-[#16845B] border-[#16845B]/30 dark:bg-[#45C79A]/15 dark:text-[#45C79A]',
    warning: 'bg-[#C78B24]/10 text-[#C78B24] border-[#C78B24]/30 dark:bg-[#E7B65A]/15 dark:text-[#E7B65A]',
    error: 'bg-[#D44848]/10 text-[#D44848] border-[#D44848]/30 dark:bg-[#F07878]/15 dark:text-[#F07878]',
    info: 'bg-[#2876C7]/10 text-[#2876C7] border-[#2876C7]/30 dark:bg-[#70B5F5]/15 dark:text-[#70B5F5]',
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border text-xs flex items-start justify-between',
        styles[type],
        className
      )}
    >
      <div>
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal';
  iconBgColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBgColor,
  className,
}) => {
  return (
    <Card className={cn('p-3.5 sm:p-4 transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted truncate">
          {title}
        </span>
        {icon && (
          <span className={cn('shrink-0 p-1.5 rounded-lg text-sm', iconBgColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-brand-text">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 flex items-center',
              trend.isPositive !== false
                ? 'bg-[#16845B]/10 text-[#16845B] dark:bg-[#45C79A]/15 dark:text-[#45C79A]'
                : 'bg-[#D44848]/10 text-[#D44848] dark:bg-[#F07878]/15 dark:text-[#F07878]'
            )}
          >
            {typeof trend.value === 'number' && trend.isPositive ? '+' : ''}
            {trend.value}
            {typeof trend.value === 'number' ? '%' : ''}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] text-brand-muted truncate">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
