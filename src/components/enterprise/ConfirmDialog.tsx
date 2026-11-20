import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertTriangle className="w-5 h-5 text-[#D44848] dark:text-[#F07878]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#C78B24] dark:text-[#E7B65A]" />,
    primary: <Info className="w-5 h-5 text-brand-primary dark:text-[#8495FF]" />,
  };

  const confirmVariantMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    primary: 'primary' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-brand-darkCard shrink-0">
              {iconMap[variant]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-text">{title}</h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-border dark:border-brand-darkBorder">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            {cancelText}
          </Button>

          <Button
            variant={confirmVariantMap[variant]}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="text-xs"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
