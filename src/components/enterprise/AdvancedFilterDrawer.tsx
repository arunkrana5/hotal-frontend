import React from 'react';
import { X, Filter, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { OverlayPortal } from '@/components/common/OverlayPortal';
import { Z_INDEX } from '@/constants/zIndex';

export interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReset?: () => void;
  onApply?: () => void;
  title?: string;
  children: React.ReactNode;
}

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  onReset,
  onApply,
  title = 'Advanced Filters',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        style={{ zIndex: Z_INDEX.DRAWER_BACKDROP }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{ zIndex: Z_INDEX.DRAWER_CONTENT }}
          className="w-full max-w-sm sm:max-w-md h-full bg-brand-surface dark:bg-brand-darkSurface border-l border-brand-border dark:border-brand-darkBorder shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 text-xs text-brand-text"
        >
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-brand-darkCard">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF]">
                <Filter className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-brand-text">{title}</h3>
                <p className="text-[11px] text-brand-muted">Refine listing records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-slate-100 dark:hover:bg-brand-darkSecondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {children}
          </div>

          {/* Drawer Footer */}
          <div className="px-5 py-3.5 border-t border-brand-border dark:border-brand-darkBorder bg-slate-50/80 dark:bg-brand-darkCard flex items-center justify-between shrink-0">
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs text-brand-muted hover:text-brand-text"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
            <div className="flex items-center space-x-2 ml-auto">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onApply?.();
                  onClose();
                }}
                className="text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
