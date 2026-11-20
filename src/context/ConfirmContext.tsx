import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  LogOut,
  FileQuestion,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export type ConfirmVariant =
  | 'default'
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'cancel'
  | 'reject'
  | 'reverse'
  | 'logout'
  | 'unsaved_changes'
  | 'irreversible';

export interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonLabel?: string;
  requiresMatchText?: string; // e.g. type "DELETE" to confirm
  entityName?: string;
  onConfirm?: (reason?: string) => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<{ confirmed: boolean; reason?: string }>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState('');
  const [matchInput, setMatchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resolveRef = useRef<((val: { confirmed: boolean; reason?: string }) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setReason('');
    setMatchInput('');
    setErrorMsg(null);
    setIsLoading(false);
    setIsOpen(true);

    return new Promise<{ confirmed: boolean; reason?: string }>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current({ confirmed: false });
      resolveRef.current = null;
    }
    options?.onCancel?.();
  }, [isLoading, options]);

  const handleExecuteConfirm = async () => {
    if (!options) return;

    if (options.requireReason && !reason.trim()) {
      setErrorMsg('A reason is required to proceed with this action.');
      return;
    }

    if (options.requiresMatchText && matchInput.trim() !== options.requiresMatchText) {
      setErrorMsg(`Please type exactly "${options.requiresMatchText}" to confirm.`);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (options.onConfirm) {
        await options.onConfirm(reason.trim() || undefined);
      }
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current({ confirmed: true, reason: reason.trim() || undefined });
        resolveRef.current = null;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantStyles = (variant: ConfirmVariant = 'default') => {
    switch (variant) {
      case 'delete':
      case 'irreversible':
        return {
          icon: Trash2,
          iconColor: 'text-[#D44848] dark:text-[#F07878]',
          iconBg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
          confirmBtn: 'bg-[#D44848] hover:bg-[#B83E3E] text-white',
          defaultConfirmText: 'Delete Permanently',
        };
      case 'deactivate':
      case 'cancel':
        return {
          icon: Ban,
          iconColor: 'text-[#C78B24] dark:text-[#FBBF24]',
          iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          confirmBtn: 'bg-[#C78B24] hover:bg-[#A8741C] text-white',
          defaultConfirmText: 'Deactivate',
        };
      case 'activate':
        return {
          icon: CheckCircle,
          iconColor: 'text-[#16845B] dark:text-[#45C79A]',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          confirmBtn: 'bg-[#16845B] hover:bg-[#116947] text-white',
          defaultConfirmText: 'Activate Now',
        };
      case 'reject':
        return {
          icon: XCircle,
          iconColor: 'text-[#D44848] dark:text-[#F07878]',
          iconBg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
          confirmBtn: 'bg-[#D44848] hover:bg-[#B83E3E] text-white',
          defaultConfirmText: 'Reject Request',
        };
      case 'reverse':
        return {
          icon: RotateCcw,
          iconColor: 'text-[#8064D8] dark:text-[#A78BFA]',
          iconBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
          confirmBtn: 'bg-[#8064D8] hover:bg-[#684FB8] text-white',
          defaultConfirmText: 'Reverse Transaction',
        };
      case 'logout':
        return {
          icon: LogOut,
          iconColor: 'text-slate-600 dark:text-slate-300',
          iconBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          confirmBtn: 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white hover:bg-slate-800',
          defaultConfirmText: 'Sign Out',
        };
      case 'unsaved_changes':
        return {
          icon: FileQuestion,
          iconColor: 'text-[#C78B24] dark:text-[#FBBF24]',
          iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          confirmBtn: 'bg-[#C78B24] hover:bg-[#A8741C] text-white',
          defaultConfirmText: 'Discard & Leave',
        };
      default:
        return {
          icon: ShieldAlert,
          iconColor: 'text-[#354FC7] dark:text-[#8495FF]',
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
          confirmBtn: 'bg-brand-primary hover:bg-[#2A3FA3] text-white',
          defaultConfirmText: 'Confirm',
        };
    }
  };

  const style = getVariantStyles(options?.variant);
  const IconComponent = style.icon;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && options && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 1100 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isLoading) handleClose();
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExecuteConfirm();
          }}
        >
          <div className="w-full max-w-md bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 select-none">
            {/* Header Icon + Title */}
            <div className="flex items-start space-x-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-soft-xs',
                  style.iconBg
                )}
              >
                <IconComponent className={cn('w-5 h-5', style.iconColor)} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-extrabold text-base text-brand-text leading-tight">
                  {options.title}
                </h3>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs font-medium text-[#D44848] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Reason Field */}
            {options.requireReason && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {options.reasonLabel || 'Reason for this action'} *
                </label>
                <textarea
                  rows={2}
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={options.reasonPlaceholder || 'Enter operational rationale...'}
                  className="w-full p-2.5 text-xs rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>
            )}

            {/* Requires Exact Match */}
            {options.requiresMatchText && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Type <span className="font-mono text-red-600 dark:text-red-400 font-black">{options.requiresMatchText}</span> to proceed *
                </label>
                <input
                  type="text"
                  value={matchInput}
                  onChange={(e) => setMatchInput(e.target.value)}
                  placeholder={`Type "${options.requiresMatchText}"`}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-2 border-t border-brand-border dark:border-brand-darkBorder flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-brand-border bg-brand-surface hover:bg-slate-50 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-text hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-xl shadow-soft-xs transition-all flex items-center space-x-1.5 disabled:opacity-60',
                  style.confirmBtn
                )}
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{options.confirmText || style.defaultConfirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
