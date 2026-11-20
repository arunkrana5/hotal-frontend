import React, { useState } from 'react';
import { X, Edit2, Trash2, Printer, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { StatusBadge } from './StatusBadge';

export interface DetailTab {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  tabs?: DetailTab[];
  children?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
  actions?: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  status,
  statusVariant,
  onEdit,
  onDelete,
  onPrint,
  tabs,
  children,
  width = 'lg',
  actions,
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabs && tabs.length > 0 ? tabs[0].id : '');

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  const currentTab = tabs?.find((t) => t.id === activeTab);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full h-full bg-brand-surface dark:bg-brand-darkSurface border-l border-brand-border dark:border-brand-darkBorder shadow-2xl flex flex-col animate-in slide-in-from-right duration-200',
          widthClasses[width]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-border dark:border-brand-darkBorder shrink-0 bg-brand-secondarySurface dark:bg-brand-darkCard">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-brand-text">{title}</h2>
                {status && <StatusBadge status={status} variant={statusVariant} />}
              </div>
              {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
            </div>

            <div className="flex items-center space-x-1.5">
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkSurface transition-colors"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary dark:hover:text-[#8495FF] hover:bg-slate-100 dark:hover:bg-brand-darkSurface transition-colors"
                  title="Edit Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#D44848] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkSurface transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Action Bar */}
          {actions && <div className="mt-3 pt-2 border-t border-brand-border dark:border-brand-darkBorder">{actions}</div>}

          {/* Tabs header if multiple tabs provided */}
          {tabs && tabs.length > 1 && (
            <div className="flex items-center space-x-1 mt-3 border-b border-brand-border dark:border-brand-darkBorder -mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-2 text-xs font-semibold border-b-2 transition-all relative',
                    activeTab === tab.id
                      ? 'border-brand-primary text-brand-primary dark:border-[#8495FF] dark:text-[#8495FF]'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {tabs && tabs.length > 0 ? currentTab?.content : children}
        </div>
      </div>
    </div>
  );
};
