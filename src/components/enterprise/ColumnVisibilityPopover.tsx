import React, { useState, useEffect, useRef } from 'react';
import { Columns, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { OverlayPortal } from '@/components/common/OverlayPortal';
import { Z_INDEX } from '@/constants/zIndex';

export interface ColumnItem {
  id: string;
  label: string;
  isVisible: boolean;
  isMandatory?: boolean;
}

export interface ColumnVisibilityPopoverProps {
  moduleKey: string;
  columns: ColumnItem[];
  onChange: (columns: ColumnItem[]) => void;
  className?: string;
}

export const ColumnVisibilityPopover: React.FC<ColumnVisibilityPopoverProps> = ({
  moduleKey,
  columns,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hotelos_cols_${moduleKey}`);
      if (saved) {
        const savedIds: Record<string, boolean> = JSON.parse(saved);
        const updated = columns.map((col) => {
          if (col.isMandatory) return { ...col, isVisible: true };
          return {
            ...col,
            isVisible: savedIds[col.id] !== undefined ? savedIds[col.id] : col.isVisible,
          };
        });
        onChange(updated);
      }
    } catch {
      // Ignore fallback
    }
  }, [moduleKey]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popoverWidth = 240;

    let left = rect.right - popoverWidth;
    if (left < 10) left = 10;
    if (left + popoverWidth > viewportWidth - 10) {
      left = viewportWidth - popoverWidth - 10;
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: Z_INDEX.DROPDOWN_POPUP,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const el = document.getElementById('column-visibility-popover-content');
      if (el && !el.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside, true);
    return () => window.removeEventListener('mousedown', handleOutside, true);
  }, [isOpen]);

  const handleColumnToggle = (colId: string) => {
    const updated = columns.map((col) => {
      if (col.id === colId && !col.isMandatory) {
        return { ...col, isVisible: !col.isVisible };
      }
      return col;
    });

    onChange(updated);

    try {
      const map: Record<string, boolean> = {};
      updated.forEach((c) => {
        map[c.id] = c.isVisible;
      });
      localStorage.setItem(`hotelos_cols_${moduleKey}`, JSON.stringify(map));
    } catch {
      // Ignore storage error
    }
  };

  const handleResetDefaults = () => {
    const reset = columns.map((col) => ({ ...col, isVisible: true }));
    onChange(reset);
    try {
      localStorage.removeItem(`hotelos_cols_${moduleKey}`);
    } catch {
      // Ignore
    }
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className={cn(
          'h-[34px] px-2.5 text-xs text-brand-muted hover:text-brand-text flex items-center space-x-1.5 shadow-soft-xs border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface rounded-lg',
          isOpen && 'border-brand-primary text-brand-primary dark:text-[#8495FF]'
        )}
        title="Customize visible columns"
      >
        <Columns className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline text-xs font-medium">Columns</span>
      </Button>

      {isOpen && (
        <OverlayPortal>
          <div
            id="column-visibility-popover-content"
            style={popoverStyle}
            className="rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 text-xs text-brand-text"
          >
            <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-brand-border dark:border-brand-darkBorder px-1.5 pt-0.5">
              <span className="font-bold text-[11px] uppercase tracking-wider text-brand-muted">
                Display Columns
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] text-brand-primary dark:text-[#8495FF] hover:underline flex items-center space-x-1 font-semibold"
                title="Restore default columns"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {columns.map((col) => (
                <label
                  key={col.id}
                  onClick={() => handleColumnToggle(col.id)}
                  className={cn(
                    'flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                    col.isVisible
                      ? 'bg-indigo-50/50 dark:bg-brand-darkSecondary text-brand-text'
                      : 'text-brand-muted hover:bg-slate-50 dark:hover:bg-brand-darkSecondary/50',
                    col.isMandatory && 'cursor-not-allowed opacity-75'
                  )}
                >
                  <span className="truncate pr-2 font-medium">{col.label}</span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                      col.isVisible
                        ? 'bg-brand-primary border-brand-primary text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {col.isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
};
