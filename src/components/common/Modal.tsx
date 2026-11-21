import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
};

/**
 * Universal Premium Enterprise Modal Dialog
 * Clean header, deep-tinted backdrop blur, sleek border radius, and structured footer.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  className,
  closeOnEsc = true,
  closeOnBackdrop = true,
  onSubmit,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const content = (
    <>
      {/* Modal Body */}
      <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-brand-text flex-1">
        {children}
      </div>

      {/* Modal Footer (Optional) */}
      {footer && (
        <div className="px-5 py-3 sm:px-6 bg-slate-50/80 dark:bg-brand-darkCard border-t border-brand-border dark:border-brand-darkBorder flex items-center justify-end gap-2.5 shrink-0 rounded-b-2xl">
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 1000, marginTop: 0 }}
      className="fixed inset-0 z-[1000] !mt-0 !m-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{ marginTop: 0 }}
        className={cn(
          'w-full !mt-0 rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-slide-up',
          sizeClasses[size] || 'max-w-lg',
          className
        )}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-brand-darkCard">
          <div className="flex items-center space-x-2.5 min-w-0">
            {icon && (
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF] shrink-0">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-brand-text truncate">{title}</h2>
              {subtitle && (
                <p className="text-[11px] text-brand-muted truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>
  );
};
