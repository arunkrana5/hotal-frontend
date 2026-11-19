import React from 'react';
import { cn } from '@/utils/cn';

export interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  children,
  left,
  right,
  className,
  ...props
}) => {
  if (left || right) {
    return (
      <div
        className={cn(
          'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-1',
          className
        )}
        {...props}
      >
        <div className="flex items-center flex-wrap gap-2 flex-1 min-w-0">{left}</div>
        {right && <div className="flex items-center flex-wrap gap-2 shrink-0">{right}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const PageActions: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center space-x-1.5 sm:space-x-2 shrink-0', className)}>
      {children}
    </div>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className }) => {
  return (
    <div className={cn('flex items-center justify-between pb-2 border-b border-border dark:border-navy-700/60 mb-3', className)}>
      <div className="flex items-center space-x-2">
        {icon && <span className="text-indigo-600 dark:text-indigo-400 shrink-0">{icon}</span>}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const ContentCard: React.FC<React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border dark:border-navy-700/80 bg-surface dark:bg-navy-900 shadow-soft-xs p-3.5 sm:p-4 transition-all duration-150',
        hoverable && 'hover:shadow-card-hover hover:border-indigo-300 dark:hover:border-indigo-700/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const StickyActionBar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 py-2.5 px-4 rounded-xl border border-border dark:border-navy-700 bg-surface/95 dark:bg-navy-900/95 backdrop-blur-md shadow-lg flex items-center justify-between gap-3 mt-4',
        className
      )}
    >
      {children}
    </div>
  );
};

export const FilterPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'p-3 rounded-xl border border-border dark:border-navy-700/80 bg-slate-50/60 dark:bg-navy-800/40 flex flex-wrap items-center gap-2.5 text-xs',
        className
      )}
    >
      {children}
    </div>
  );
};
