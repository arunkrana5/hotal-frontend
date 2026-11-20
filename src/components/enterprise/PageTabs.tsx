import React from 'react';
import { cn } from '@/utils/cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface PageTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Enterprise PageTabs
 * Guarantees high-contrast readability in both Light and Dark themes.
 * Never produces white text on white/light background.
 */
export function PageTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}: PageTabsProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto py-1 border-b border-brand-border dark:border-brand-darkBorder select-none custom-scrollbar shrink-0',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'group relative inline-flex items-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs',
              isActive
                ? 'bg-brand-primary text-white shadow-soft-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-brand-darkCard/80'
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              >
                {tab.icon}
              </span>
            )}

            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold tracking-tight transition-colors',
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
