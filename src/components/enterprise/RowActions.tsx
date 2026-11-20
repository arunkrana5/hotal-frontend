import React, { useState, useRef, useEffect } from 'react';
import { Eye, Edit2, MoreHorizontal, Power, Trash2, Copy, Printer, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CustomAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  isActive?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPrint?: () => void;
  customActions?: CustomAction[];
  className?: string;
  canDelete?: boolean;
}

export const RowActions: React.FC<RowActionsProps> = ({
  onView,
  onEdit,
  onToggleStatus,
  isActive = true,
  onDelete,
  onDuplicate,
  onPrint,
  customActions = [],
  className,
  canDelete = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const hasMoreActions =
    onToggleStatus ||
    (onDelete && canDelete) ||
    onDuplicate ||
    onPrint ||
    customActions.length > 0;

  return (
    <div className={cn('flex items-center space-x-1 select-none', className)}>
      {/* 1. View Details Action */}
      {onView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-1 rounded-md text-slate-500 hover:text-brand-primary hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#8495FF] dark:hover:bg-brand-darkCard transition-colors"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 2. Edit Action */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-brand-darkCard transition-colors"
          title="Edit Record"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 3. More Actions Dropdown */}
      {hasMoreActions && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-brand-darkCard transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-1 w-44 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              {onToggleStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onToggleStatus();
                  }}
                  className="flex items-center w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-slate-700 dark:text-slate-200 font-medium text-left"
                >
                  <Power className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
              )}

              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onDuplicate();
                  }}
                  className="flex items-center w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-slate-700 dark:text-slate-200 font-medium text-left"
                >
                  <Copy className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <span>Duplicate</span>
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onPrint();
                  }}
                  className="flex items-center w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-slate-700 dark:text-slate-200 font-medium text-left"
                >
                  <Printer className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <span>Print Document</span>
                </button>
              )}

              {customActions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    action.onClick();
                  }}
                  className={cn(
                    'flex items-center w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-brand-darkCard font-medium text-left',
                    action.variant === 'danger'
                      ? 'text-[#D44848] dark:text-[#F07878] hover:bg-red-50 dark:hover:bg-red-950/20'
                      : 'text-slate-700 dark:text-slate-200'
                  )}
                >
                  {action.icon && <span className="mr-2 shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}

              {onDelete && canDelete && (
                <>
                  <div className="my-1 border-t border-brand-border dark:border-brand-darkBorder" />
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onDelete();
                    }}
                    className="flex items-center w-full px-3 py-1.5 text-[#D44848] dark:text-[#F07878] hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    <span>Delete Record</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
