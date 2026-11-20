import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { UniversalSelect, SelectOption } from '@/components/common/UniversalSelect';
import { ColumnVisibilityPopover, ColumnItem } from './ColumnVisibilityPopover';
import { ExportMenu } from './ExportMenu';
import { AdvancedFilterDrawer } from './AdvancedFilterDrawer';

export interface FilterConfig {
  id: string;
  label?: string;
  value: string | number;
  options?: SelectOption[];
  masterType?: string; // Mode A database options!
  placeholder?: string;
  onChange: (value: any) => void;
  width?: string;
  isSecondary?: boolean; // Folds into "More Filters" on tablet/mobile
}

export interface ListToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onResetFilters?: () => void;
  isFiltered?: boolean;
  moduleKey?: string;
  columns?: ColumnItem[];
  onColumnsChange?: (cols: ColumnItem[]) => void;
  onExportCsv?: () => Promise<void> | void;
  onExportExcel?: () => Promise<void> | void;
  onExportPdf?: () => Promise<void> | void;
  onExport?: () => void; // Legacy compatibility
  actions?: React.ReactNode;
  className?: string;
  advancedFilterContent?: React.ReactNode;
  enableExport?: boolean;
}

/**
 * Universal One-Row Enterprise List Toolbar
 * 
 * Layout Standard:
 * [Search Input................] [Filter 1 ▼] [Filter 2 ▼] [Date Range ▼] [More Filters] [Columns] [Export ▼] [Reset]
 * 
 * Guarantees:
 * - Fits into ONE single horizontal row on desktop (34–38px height)
 * - All dropdown filters use UniversalSelect with zero native <select>
 * - Compact Column Visibility & Multi-format Export dropdowns
 * - Responsive collapsing to More Filters drawer on tablet & mobile
 */
export const ListToolbar: React.FC<ListToolbarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records by name, code, ID...',
  filters = [],
  onResetFilters,
  isFiltered = false,
  moduleKey,
  columns,
  onColumnsChange,
  onExportCsv,
  onExportExcel,
  onExportPdf,
  onExport,
  actions,
  className,
  advancedFilterContent,
  enableExport = true,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  const hasAnyFilterActive = isFiltered || !!localSearch.trim();

  // Primary filters stay visible on tablet; secondary collapse
  const primaryFilters = filters.filter((f) => !f.isSecondary);
  const secondaryFilters = filters.filter((f) => f.isSecondary);
  const hasMoreFilters = secondaryFilters.length > 0 || !!advancedFilterContent;

  return (
    <>
      <div
        className={cn(
          'w-full flex items-center justify-between gap-2 py-1 select-none flex-nowrap overflow-x-auto min-h-[42px]',
          className
        )}
      >
        {/* Left: Search + Universal Select Filters in a Single Horizontal Row */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap">
          {/* Universal Search Input */}
          {onSearchChange && (
            <form
              onSubmit={handleSearchSubmit}
              className="relative min-w-[180px] max-w-[280px] flex-1 shrink-0"
            >
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onSearchChange(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="w-full h-8 sm:h-9 pl-8 pr-7 text-xs rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary shadow-soft-xs transition-all"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          )}

          {/* Primary Filters (Rendered as UniversalSelect) */}
          {primaryFilters.map((filter) => (
            <div
              key={filter.id}
              className={cn('shrink-0', filter.width || 'w-36 sm:w-44')}
            >
              <UniversalSelect
                size="sm"
                value={filter.value}
                onChange={(val) => filter.onChange(val)}
                options={filter.options}
                masterType={filter.masterType}
                placeholder={filter.placeholder || filter.label || 'Filter...'}
                clearable={true}
                className="w-full"
              />
            </div>
          ))}

          {/* Secondary Filters (Visible on large screens, hidden on tablet) */}
          {secondaryFilters.map((filter) => (
            <div
              key={filter.id}
              className={cn(
                'hidden xl:block shrink-0',
                filter.width || 'w-36 sm:w-44'
              )}
            >
              <UniversalSelect
                size="sm"
                value={filter.value}
                onChange={(val) => filter.onChange(val)}
                options={filter.options}
                masterType={filter.masterType}
                placeholder={filter.placeholder || filter.label || 'Filter...'}
                clearable={true}
                className="w-full"
              />
            </div>
          ))}

          {/* More Filters Trigger (Active if secondary filters or advanced content exist) */}
          {hasMoreFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdvancedOpen(true)}
              className="h-8 sm:h-9 px-2.5 text-xs text-brand-muted hover:text-brand-text shrink-0 shadow-soft-xs flex items-center space-x-1"
              title="More Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline text-xs">More Filters</span>
            </Button>
          )}

          {/* Reset Filters Icon Button */}
          {hasAnyFilterActive && onResetFilters && (
            <button
              type="button"
              onClick={() => {
                handleClearSearch();
                onResetFilters();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-muted hover:text-rose-500 transition-colors px-1.5 py-1 shrink-0"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Right: Custom Columns, Export Menu, Custom Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Column Visibility Popover */}
          {moduleKey && columns && onColumnsChange && (
            <ColumnVisibilityPopover
              moduleKey={moduleKey}
              columns={columns}
              onChange={onColumnsChange}
            />
          )}

          {/* Unified Export Menu */}
          {enableExport && (
            <ExportMenu
              onExportCsv={onExportCsv || onExport}
              onExportExcel={onExportExcel}
              onExportPdf={onExportPdf}
            />
          )}

          {/* Optional Page-level custom inline actions */}
          {actions}
        </div>
      </div>

      {/* Advanced Filters Drawer (Triggered by More Filters) */}
      {hasMoreFilters && (
        <AdvancedFilterDrawer
          isOpen={isAdvancedOpen}
          onClose={() => setIsAdvancedOpen(false)}
          onReset={() => {
            onResetFilters?.();
            handleClearSearch();
          }}
          onApply={() => setIsAdvancedOpen(false)}
        >
          <div className="space-y-4">
            {secondaryFilters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="text-xs font-bold text-brand-text">
                  {filter.label || filter.placeholder}
                </label>
                <UniversalSelect
                  size="md"
                  value={filter.value}
                  onChange={(val) => filter.onChange(val)}
                  options={filter.options}
                  masterType={filter.masterType}
                  placeholder={filter.placeholder || 'Select filter...'}
                  clearable={true}
                />
              </div>
            ))}
            {advancedFilterContent}
          </div>
        </AdvancedFilterDrawer>
      )}
    </>
  );
};
