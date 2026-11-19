import React from 'react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode; // Retained in interface for type compatibility, strictly omitted from minimal render
  breadcrumb?: BreadcrumbItem[] | React.ReactNode; // Retained for type compatibility, strictly omitted from minimal render
  icon?: React.ReactNode; // Retained for type compatibility, strictly omitted from minimal render
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Universal Minimal Enterprise PageHeader
 * Left: Page Title (18-21px, bold, clean)
 * Right: Single-row Action Buttons (32-36px)
 * Strictly zero breadcrumbs, subtitles, banners or clutter.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 pb-2.5 border-b border-border dark:border-navy-700/60 transition-all min-h-[44px] sm:min-h-[48px]',
        className
      )}
    >
      {/* Left: Strictly Page Title ONLY (+ optional inline status badge) */}
      <div className="flex items-center space-x-2.5 min-w-0 flex-1 overflow-hidden">
        <h1 className="text-lg sm:text-[19px] font-bold tracking-tight text-slate-900 dark:text-white shrink-0 truncate">
          {title}
        </h1>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Right: Same Horizontal Single-Line Page Actions */}
      {actions && (
        <div className="flex items-center space-x-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
