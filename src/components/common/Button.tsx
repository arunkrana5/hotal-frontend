import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      icon,
      ...props
    },
    ref
  ) => {
    const effectiveLeftIcon = leftIcon || icon;

    const baseStyles =
      'btn inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] whitespace-nowrap flex-nowrap shrink-0';

    const variants = {
      primary:
        'bg-[#354FC7] hover:bg-[#293FA8] active:bg-[#213388] dark:bg-[#354FC7] dark:hover:bg-[#293FA8] text-white shadow-soft-xs focus:ring-[#354FC7]/40 border border-[#354FC7]/30',
      secondary:
        'bg-slate-900 hover:bg-slate-800 text-white shadow-soft-xs focus:ring-slate-900/40 border border-slate-800 dark:bg-navy-800 dark:hover:bg-navy-700 dark:border-navy-600',
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:ring-[#354FC7]/20 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800 dark:hover:border-navy-600 shadow-soft-xs',
      danger:
        'bg-[#D44848] hover:bg-[#b83838] text-white shadow-soft-xs focus:ring-[#D44848]/40 border border-[#D44848]/30',
      success:
        'bg-[#16845B] hover:bg-[#126b4a] text-white shadow-soft-xs focus:ring-[#16845B]/40 border border-[#16845B]/30',
      ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white',
    };

    const sizes = {
      xs: 'text-[11px] px-2 py-0.5 h-7 gap-1.5',
      sm: 'text-xs px-2.5 py-1 h-8 gap-1.5',
      md: 'text-xs px-3.5 py-1.5 h-8.5 gap-2',
      lg: 'text-sm px-4 py-2 h-9.5 gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-1.5 flex-nowrap shrink-0">
            <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 inline-block shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs">Loading...</span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 flex-nowrap shrink-0 leading-none">
            {effectiveLeftIcon && (
              <span className="inline-flex items-center justify-center shrink-0">
                {effectiveLeftIcon}
              </span>
            )}
            {children && (
              <span className="inline-flex items-center gap-1.5 flex-nowrap">
                {children}
              </span>
            )}
            {rightIcon && (
              <span className="inline-flex items-center justify-center shrink-0">
                {rightIcon}
              </span>
            )}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
