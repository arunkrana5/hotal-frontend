import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { UniversalSelect, SelectOption } from './UniversalSelect';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, isRequired, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            <span>{label}</span>
            {isRequired && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-9 w-full rounded-lg border bg-white px-3 py-1.5 text-xs text-slate-900 transition-all duration-150',
              'placeholder:text-slate-400 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-offset-0',
              'dark:bg-brand-darkSurface dark:text-slate-100 dark:placeholder:text-slate-500 shadow-soft-xs',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-400/20'
                : 'border-brand-border focus:border-blue-brand focus:ring-blue-brand/20 dark:border-brand-darkBorder',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, isRequired, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            <span>{label}</span>
            {isRequired && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 transition-all duration-150',
            'placeholder:text-slate-400 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-offset-0',
            'dark:bg-brand-darkSurface dark:text-slate-100 dark:placeholder:text-slate-500 shadow-soft-xs',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-400/20'
              : 'border-brand-border focus:border-blue-brand focus:ring-blue-brand/20 dark:border-brand-darkBorder',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          rows={props.rows || 3}
          {...props}
        />
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  options?: { value: string | number; label: string }[];
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, label, error, helperText, isRequired, children, options, id, value, onChange, disabled, placeholder, size = 'sm', ...props }, ref) => {
    const selectOptions = React.useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) => ({
          value: String(opt.value),
          label: opt.label,
        }));
      }

      const parsed: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any;
          parsed.push({
            value: childProps.value !== undefined ? String(childProps.value) : String(childProps.children || ''),
            label: String(childProps.children || childProps.value || ''),
            disabled: childProps.disabled,
          });
        }
      });
      return parsed;
    }, [options, children]);

    const handleChange = (val: any) => {
      if (onChange) {
        const syntheticEvent = {
          target: { value: val ?? '', name: props.name },
          currentTarget: { value: val ?? '', name: props.name },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="w-full space-y-1 text-left">
        <UniversalSelect
          ref={ref}
          id={id || props.name}
          name={props.name}
          label={label}
          description={helperText}
          error={error}
          required={isRequired}
          disabled={disabled}
          options={selectOptions}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={handleChange}
          placeholder={placeholder || 'Select...'}
          size={size}
          className={className}
          clearable={false}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

export const FormGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, columns, cols, className }) => {
  const activeCols = columns ?? cols ?? 2;
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={cn('grid gap-4', colStyles[activeCols], className)}>{children}</div>;
};

export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => {
  return (
    <div className={cn('space-y-3 pb-5 border-b border-brand-border dark:border-brand-darkBorder last:border-b-0', className)}>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">{title}</h4>
        {description && <p className="text-[11px] text-brand-muted dark:text-brand-darkMuted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
};
