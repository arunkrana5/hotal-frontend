import React from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DocumentNumberFieldProps {
  value: string;
  label?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  helperText?: string;
}

/**
 * Universal First Field for all transactional Add/Create forms.
 * Displays the system-generated document sequence with lock icon and read-only protection.
 */
export const DocumentNumberField: React.FC<DocumentNumberFieldProps> = ({
  value,
  label = 'Document Number',
  isLoading = false,
  onRefresh,
  className,
  helperText = 'Auto-assigned by centralized numbering engine',
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
          <span>{label}</span>
          <span className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-navy-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-navy-700">
            System Assigned
          </span>
        </label>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 transition-colors disabled:opacity-50"
            title="Refresh sequence preview"
          >
            <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            <span>Sync</span>
          </button>
        )}
      </div>

      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          readOnly
          disabled
          value={isLoading ? 'Generating sequence...' : (value || 'Generating...')}
          aria-label={label}
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold tracking-wide bg-slate-100/80 dark:bg-navy-950/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-navy-700 rounded-lg cursor-not-allowed select-all focus:outline-none focus:ring-0"
        />
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
};
