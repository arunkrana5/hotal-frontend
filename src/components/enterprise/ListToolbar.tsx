import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, SlidersHorizontal, Download, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface DropdownFilter {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  width?: string;
}

export interface ListToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: DropdownFilter[];
  onResetFilters?: () => void;
  isFiltered?: boolean;
  onOpenAdvancedFilters?: () => void;
  onExport?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const ListToolbar: React.FC<ListToolbarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records by name, code, ID...',
  filters = [],
  onResetFilters,
  isFiltered = false,
  onOpenAdvancedFilters,
  onExport,
  actions,
  className,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
  };

  const handleClear = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2.5 py-1.5 px-0 select-none',
        className
      )}
    >
      {/* Left: Single-row horizontal filter bar */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Compact Search Input */}
        {onSearchChange && (
          <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] max-w-xs flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all shadow-soft-xs"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        )}

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="relative shrink-0">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={cn(
                'h-8 px-2.5 text-xs rounded-lg border bg-brand-surface dark:bg-brand-darkSurface text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary shadow-soft-xs transition-colors cursor-pointer',
                filter.value && filter.value !== 'ALL'
                  ? 'border-brand-primary/60 font-semibold text-brand-primary dark:text-[#8495FF]'
                  : 'border-brand-border dark:border-brand-darkBorder text-slate-600 dark:text-slate-300',
                filter.width || 'w-auto'
              )}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Advanced Filters Button */}
        {onOpenAdvancedFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAdvancedFilters}
            className="h-8 text-xs text-slate-600 dark:text-slate-300 shadow-soft-xs"
            title="More Filters"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Filters
          </Button>
        )}

        {/* Reset / Clear Button */}
        {(isFiltered || localSearch) && onResetFilters && (
          <button
            type="button"
            onClick={() => {
              handleClear();
              onResetFilters();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#D44848] dark:hover:text-red-400 transition-colors px-1.5 py-1"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: Actions, Export */}
      <div className="flex items-center gap-2 shrink-0">
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-8 text-xs text-slate-600 dark:text-slate-300 shadow-soft-xs"
            title="Export Data"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        )}

        {actions}
      </div>
    </div>
  );
};
