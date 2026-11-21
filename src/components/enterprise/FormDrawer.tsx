import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

export interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  width?: 'md' | 'lg' | 'xl';
  secondaryAction?: React.ReactNode;
}

export const FormDrawer: React.FC<FormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  submitText = 'Save Changes',
  cancelText = 'Cancel',
  isLoading = false,
  width = 'lg',
  secondaryAction,
}) => {
  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'w-full sm:max-w-xl md:max-w-2xl',
    lg: 'w-full sm:max-w-2xl md:max-w-3xl',
    xl: 'w-full sm:max-w-3xl md:max-w-4xl',
  };

  return (
    <div
      style={{ zIndex: 1000 }}
      className="fixed inset-0 z-[1000] overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full h-full bg-brand-surface dark:bg-brand-darkSurface border-l border-brand-border dark:border-brand-darkBorder shadow-2xl flex flex-col animate-in slide-in-from-right duration-200',
          widthClasses[width]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Compact Header */}
        <div className="px-5 py-3 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between shrink-0 bg-brand-secondarySurface dark:bg-brand-darkCard min-h-[48px]">
          <div>
            <h2 className="text-sm font-bold text-brand-text">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkSurface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {children}

          {/* Hidden submit trigger so pressing Enter submits the form */}
          <button type="submit" className="hidden" />
        </form>

        {/* Sticky Footer */}
        <div className="px-5 py-3 border-t border-brand-border dark:border-brand-darkBorder flex items-center justify-between shrink-0 bg-slate-50/75 dark:bg-brand-darkCard">
          <div>{secondaryAction}</div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-[34px]"
            >
              {cancelText}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSubmit}
              isLoading={isLoading}
              className="text-xs h-[34px]"
            >
              {submitText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}> = ({ title, children, className, columns = 2 }) => {
  const colClass =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : columns === 1
      ? 'grid-cols-1'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={cn('space-y-1.5 pt-3 border-t first:border-0 first:pt-0 border-brand-border dark:border-brand-darkBorder', className)}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      <div className={cn('grid gap-3 pt-0.5', colClass)}>{children}</div>
    </div>
  );
};
