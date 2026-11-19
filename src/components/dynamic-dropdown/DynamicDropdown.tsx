import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { ChevronDown, Search, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DropdownOption {
  id: number;
  code: string;
  name: string;
  description?: string;
  numericValue?: number | null;
  parentValueId?: number | null;
  isDefault?: boolean;
}

export interface DynamicDropdownProps {
  masterCode: string;
  value?: string | number | null;
  onChange: (value: string, option?: DropdownOption) => void;
  label?: string;
  placeholder?: string;
  parentValueId?: number | null;
  propertyId?: number | null;
  disabled?: boolean;
  error?: string;
  className?: string;
  isRequired?: boolean;
}

export const DynamicDropdown: React.FC<DynamicDropdownProps> = ({
  masterCode,
  value,
  onChange,
  label,
  placeholder = 'Select an option...',
  parentValueId,
  propertyId,
  disabled = false,
  error,
  className,
  isRequired,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial batch (strictly 5 records as required by Section 8)
  const fetchOptions = async (pageNum: number, searchTerm: string, append: boolean = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '5', // Mandatory initial & incremental batch rule: max 5
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (propertyId) params.append('propertyId', propertyId.toString());
      if (parentValueId) params.append('parentValueId', parentValueId.toString());

      const res = await api.request<{
        items: DropdownOption[];
        totalCount: number;
        page: number;
        hasMore: boolean;
      }>(`/masters/${masterCode}/options?${params.toString()}`);

      if (res.success && res.data) {
        if (append) {
          setOptions((prev) => [...prev, ...res.data!.items]);
        } else {
          setOptions(res.data.items);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);

        // Resolve selected option if value is present
        if (value && !selectedOption) {
          const match = res.data.items.find(
            (o) => o.code === value || o.id.toString() === value.toString()
          );
          if (match) setSelectedOption(match);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when masterCode, parentValueId, or propertyId changes
  useEffect(() => {
    setPage(1);
    fetchOptions(1, '');
  }, [masterCode, parentValueId, propertyId]);

  // Handle server-side search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        fetchOptions(1, search);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    onChange(option.code, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange('', undefined);
  };

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchOptions(page + 1, search, true);
  };

  return (
    <div className={cn('relative w-full space-y-1 text-left', className)} ref={containerRef}>
      {label && (
        <label className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          {isRequired && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-xs text-slate-900 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-brand/20 dark:bg-brand-darkSurface dark:text-slate-100 shadow-soft-xs',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-brand-border focus:border-blue-brand dark:border-brand-darkBorder',
          disabled && 'cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-slate-400 dark:text-slate-500')}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>

        <div className="flex items-center space-x-1">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      {/* Dropdown popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Server-side Search input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-brand"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
            {options.map((option) => {
              const isSelected = selectedOption?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left',
                    isSelected
                      ? 'bg-blue-50 text-blue-brand dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-brand-darkCard text-slate-700 dark:text-slate-200'
                  )}
                >
                  <div className="truncate">
                    <div>{option.name}</div>
                    {option.description && (
                      <div className="text-[10px] text-slate-400 truncate">{option.description}</div>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-brand ml-2 flex-shrink-0" />}
                </button>
              );
            })}

            {options.length === 0 && !isLoading && (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching options found.
              </div>
            )}
          </div>

          {/* Show More action (Mandatory rule: fetch next 5 records) */}
          {hasMore && (
            <div className="pt-2 mt-1 border-t border-brand-border dark:border-brand-darkBorder text-center">
              <button
                type="button"
                onClick={handleShowMore}
                disabled={isLoading}
                className="w-full py-1 text-[11px] font-semibold text-blue-brand dark:text-blue-400 hover:underline flex items-center justify-center space-x-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    <span>Loading next 5 records...</span>
                  </>
                ) : (
                  <span>Show More (Next 5 records)</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
