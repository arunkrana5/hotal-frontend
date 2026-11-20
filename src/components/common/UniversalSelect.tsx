import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
} from 'react';
import {
  Search,
  ChevronDown,
  X,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { OverlayPortal } from './OverlayPortal';
import { Z_INDEX } from '@/constants/zIndex';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  numericValue?: number;
  parentValueId?: number | null;
  badge?: string;
}

export interface UniversalSelectProps {
  value?: string | number | (string | number)[] | null;
  defaultValue?: string | number | (string | number)[] | null;
  onChange?: (value: any, option?: SelectOption | SelectOption[] | null) => void;
  options?: SelectOption[];
  masterType?: string; // Mode A: Database-backed masters e.g. "ROOM", "GUEST", "DEPARTMENT", etc.
  propertyId?: number;
  parentValueId?: number | null;
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => void;
  leadingIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dropdownClassName?: string;
  id?: string;
  name?: string;
  autoFocusSearch?: boolean;
  pageSize?: number;
}

interface PagedOptionsResponse {
  items: Array<{
    id: number;
    code: string;
    name: string;
    description?: string;
    numericValue?: number;
    parentValueId?: number | null;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * UniversalSelect — Single Unified Enterprise Select Component
 * 
 * Supports:
 * - Mode A: Database Options (with 5-item batching, remote debounced search & server pagination)
 * - Mode B: Configured/Static Options (with local search and identical UI)
 * - Single-Select & Multi-Select
 * - Dependent cascading dropdowns (Country -> State -> City, Property -> Floor -> Room)
 * - Keyboard navigation (Arrows, Enter, Escape)
 * - Zero clipping via portal rendering with auto-positioning
 * - Full Dark & Light theme synchronization
 */
export const UniversalSelect = forwardRef<HTMLButtonElement, UniversalSelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      options: staticOptions,
      masterType,
      propertyId,
      parentValueId,
      placeholder = 'Select an option...',
      label,
      description,
      error,
      required = false,
      disabled = false,
      clearable = true,
      isSearchable = true,
      isMulti = false,
      creatable = false,
      onCreateOption,
      leadingIcon,
      size = 'sm',
      className,
      dropdownClassName,
      id,
      name,
      autoFocusSearch = true,
      pageSize = 5, // Strict requirement: initial batch 5
    },
    ref
  ) => {
    // Uncontrolled vs Controlled state
    const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
      () => value ?? defaultValue ?? (isMulti ? [] : '')
    );

    const currentValue = value !== undefined ? value : internalValue;

    // Open/Closed State
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Mode A: Async Database Options State
    const [remoteOptions, setRemoteOptions] = useState<SelectOption[]>([]);
    const [remotePage, setRemotePage] = useState<number>(1);
    const [remoteTotal, setRemoteTotal] = useState<number>(0);
    const [remoteHasNext, setRemoteHasNext] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    // Coordinates for floating portal dropdown
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const optionsContainerRef = useRef<HTMLDivElement | null>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Debounce timer for remote search
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync value if parent changes
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value ?? (isMulti ? [] : ''));
      }
    }, [value, isMulti]);

    // Mode A: Fetch options from backend API
    const fetchRemoteOptions = useCallback(
      async (pageToFetch: number, query: string, isAppend = false) => {
        if (!masterType) return;

        if (isAppend) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        try {
          const params = new URLSearchParams({
            page: String(pageToFetch),
            pageSize: String(pageSize),
          });

          if (query.trim()) {
            params.append('search', query.trim());
          }
          if (propertyId !== undefined && propertyId !== null) {
            params.append('propertyId', String(propertyId));
          }
          if (parentValueId !== undefined && parentValueId !== null) {
            params.append('parentValueId', String(parentValueId));
          }

          const res = await api.request<PagedOptionsResponse>(
            `/masters/${masterType}/options?${params.toString()}`
          );

          if (res.success && res.data) {
            const mapped: SelectOption[] = (res.data.items || []).map((it) => ({
              value: it.id,
              label: it.name,
              description: it.description,
              numericValue: it.numericValue,
              parentValueId: it.parentValueId,
              badge: it.code,
            }));

            if (isAppend) {
              setRemoteOptions((prev) => {
                const existingIds = new Set(prev.map((p) => p.value));
                const newItems = mapped.filter((m) => !existingIds.has(m.value));
                return [...prev, ...newItems];
              });
            } else {
              setRemoteOptions(mapped);
            }

            setRemotePage(res.data.page);
            setRemoteTotal(res.data.totalCount);
            setRemoteHasNext(res.data.hasNextPage);
          }
        } catch (err) {
          console.error(`Failed to fetch master options for ${masterType}:`, err);
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
      },
      [masterType, propertyId, parentValueId, pageSize]
    );

    // Initial load for Mode A
    useEffect(() => {
      if (masterType) {
        fetchRemoteOptions(1, '');
      }
    }, [masterType, propertyId, parentValueId, fetchRemoteOptions]);

    // Handle debounced search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      setHighlightedIndex(0);

      if (masterType) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetchRemoteOptions(1, q);
        }, 280);
      }
    };

    // Load More callback for Mode A
    const handleLoadMore = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!loadingMore && remoteHasNext) {
        fetchRemoteOptions(remotePage + 1, searchQuery, true);
      }
    };

    // Consolidated Options (Static vs Remote)
    const activeOptions = useMemo(() => {
      if (masterType) {
        return remoteOptions;
      }
      return staticOptions || [];
    }, [masterType, remoteOptions, staticOptions]);

    // Filtered static options when not using remote search
    const displayedOptions = useMemo(() => {
      if (masterType) {
        // Backend handles filtering
        return activeOptions;
      }
      if (!searchQuery.trim()) {
        return activeOptions;
      }
      const q = searchQuery.toLowerCase();
      return activeOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.description && opt.description.toLowerCase().includes(q)) ||
          (opt.badge && opt.badge.toLowerCase().includes(q))
      );
    }, [masterType, activeOptions, searchQuery]);

    // Map current selected values to labels for trigger display
    const selectedOptions = useMemo<SelectOption[]>(() => {
      if (isMulti) {
        const arr = Array.isArray(currentValue) ? currentValue : [];
        return arr
          .map((val) => {
            const found = activeOptions.find((opt) => String(opt.value) === String(val));
            return found || { value: String(val), label: String(val) };
          })
          .filter(Boolean);
      } else {
        if (currentValue === null || currentValue === undefined || currentValue === '') {
          return [];
        }
        const found = activeOptions.find((opt) => String(opt.value) === String(currentValue));
        return found ? [found] : [{ value: String(currentValue), label: String(currentValue) }];
      }
    }, [isMulti, currentValue, activeOptions]);

    // Compute Dropdown Position
    const updateDropdownPosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = 280;

      const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        top: placeAbove ? 'auto' : `${rect.bottom + 4}px`,
        bottom: placeAbove ? `${viewportHeight - rect.top + 4}px` : 'auto',
        zIndex: Z_INDEX.DROPDOWN_POPUP,
      });
    }, []);

    // Open/Close Handlers
    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen) {
        updateDropdownPosition();
        setIsOpen(true);
        setSearchQuery('');
        setHighlightedIndex(-1);
      } else {
        setIsOpen(false);
      }
    };

    // Close on click outside or window resize
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current?.contains(e.target as Node) ||
          optionsContainerRef.current?.contains(e.target as Node)
        ) {
          return;
        }
        setIsOpen(false);
      };

      const handleScroll = (e: Event) => {
        // Close or reposition on scroll outside dropdown
        if (!optionsContainerRef.current?.contains(e.target as Node)) {
          updateDropdownPosition();
        }
      };

      window.addEventListener('mousedown', handleClickOutside, true);
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [isOpen, updateDropdownPosition]);

    // Auto-focus search input when opened
    useEffect(() => {
      if (isOpen && autoFocusSearch) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [isOpen, autoFocusSearch]);

    // Selection Handler
    const handleSelectOption = (option: SelectOption) => {
      if (option.disabled) return;

      if (isMulti) {
        const curArr = Array.isArray(currentValue) ? [...currentValue] : [];
        const index = curArr.findIndex((v) => String(v) === String(option.value));
        let nextArr: (string | number)[];
        if (index >= 0) {
          nextArr = curArr.filter((_, i) => i !== index);
        } else {
          nextArr = [...curArr, option.value];
        }
        setInternalValue(nextArr);
        onChange?.(nextArr, selectedOptions);
      } else {
        setInternalValue(option.value);
        onChange?.(option.value, option);
        setIsOpen(false);
      }
    };

    // Clear Selection
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      const emptyVal = isMulti ? [] : '';
      setInternalValue(emptyVal);
      onChange?.(emptyVal, isMulti ? [] : null);
    };

    // Remove single tag in multi-select
    const handleRemoveTag = (e: React.MouseEvent, valToRemove: string | number) => {
      e.stopPropagation();
      if (!isMulti) return;
      const curArr = Array.isArray(currentValue) ? [...currentValue] : [];
      const nextArr = curArr.filter((v) => String(v) !== String(valToRemove));
      setInternalValue(nextArr);
      onChange?.(nextArr, selectedOptions);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < displayedOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : displayedOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < displayedOptions.length) {
            handleSelectOption(displayedOptions[highlightedIndex]);
          } else if (creatable && searchQuery.trim()) {
            onCreateOption?.(searchQuery.trim());
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    // Size-based styling
    const sizeClasses = {
      sm: 'min-h-[34px] h-[34px] text-xs px-2.5',
      md: 'min-h-[38px] h-[38px] text-xs px-3',
      lg: 'min-h-[44px] h-[44px] text-sm px-3.5',
    };

    const hasSelection = isMulti
      ? Array.isArray(currentValue) && currentValue.length > 0
      : currentValue !== null && currentValue !== undefined && currentValue !== '';

    return (
      <div className={cn('relative flex flex-col space-y-1', className)}>
        {/* Optional Label */}
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-brand-text flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </span>
            {masterType && (
              <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
                {masterType}
              </span>
            )}
          </label>
        )}

        {/* Trigger Button */}
        <button
          ref={(node) => {
            triggerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'w-full flex items-center justify-between rounded-lg border transition-all text-left bg-brand-surface dark:bg-brand-darkSurface',
            'border-brand-border dark:border-brand-darkBorder text-brand-text',
            'hover:border-brand-primary/50 dark:hover:border-brand-primary/50',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
            isOpen && 'ring-2 ring-brand-primary/20 border-brand-primary',
            error && 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20',
            disabled && 'opacity-60 bg-slate-100 dark:bg-slate-900 cursor-not-allowed',
            sizeClasses[size]
          )}
        >
          {/* Leading Icon & Value */}
          <div className="flex items-center space-x-2 truncate flex-1 mr-2">
            {leadingIcon && (
              <span className="text-brand-muted shrink-0 flex items-center">
                {leadingIcon}
              </span>
            )}

            {isMulti && Array.isArray(currentValue) && currentValue.length > 0 ? (
              <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-secondarySurface dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF] border border-brand-border dark:border-brand-darkBorder"
                  >
                    <span className="truncate max-w-[90px]">{opt.label}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(e, opt.value)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : hasSelection && selectedOptions.length > 0 ? (
              <div className="flex items-center space-x-1.5 truncate">
                {selectedOptions[0].icon && (
                  <span className="shrink-0">{selectedOptions[0].icon}</span>
                )}
                <span className="truncate font-medium">{selectedOptions[0].label}</span>
                {selectedOptions[0].badge && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-brand-darkCard text-brand-muted shrink-0">
                    {selectedOptions[0].badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-brand-muted truncate select-none">
                {placeholder}
              </span>
            )}
          </div>

          {/* Action Icons (Clear + Chevron) */}
          <div className="flex items-center space-x-1 shrink-0 text-brand-muted">
            {clearable && hasSelection && !disabled && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-0.5 hover:text-brand-text rounded transition-colors"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </div>
            )}
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                isOpen && 'transform rotate-180 text-brand-primary'
              )}
            />
          </div>
        </button>

        {/* Optional Description / Error */}
        {error ? (
          <p className="text-[11px] text-rose-500 font-medium flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : description ? (
          <p className="text-[11px] text-brand-muted">{description}</p>
        ) : null}

        {/* PORTAL DROPDOWN POPUP */}
        {isOpen && (
          <OverlayPortal>
            <div
              ref={optionsContainerRef}
              style={dropdownStyle}
              className={cn(
                'rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150',
                dropdownClassName
              )}
            >
              {/* Sticky Search Header */}
              {isSearchable && (
                <div className="p-2 border-b border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkCard shrink-0">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-brand-muted pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        masterType
                          ? `Search ${masterType} options...`
                          : 'Search options...'
                      }
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    {loading && (
                      <Loader2 className="w-3 h-3 text-brand-primary animate-spin absolute right-2.5" />
                    )}
                  </div>
                </div>
              )}

              {/* Options List */}
              <div
                role="listbox"
                className="overflow-y-auto divide-y divide-brand-border/40 dark:divide-brand-darkBorder/40 p-1 flex-1 text-xs"
              >
                {loading && activeOptions.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2 text-brand-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span className="text-[11px]">Loading options...</span>
                  </div>
                ) : displayedOptions.length === 0 ? (
                  <div className="py-6 px-4 text-center space-y-1">
                    <p className="text-brand-muted text-xs">No matching options</p>
                    {creatable && searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          onCreateOption?.(searchQuery.trim());
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-brand-primary hover:underline font-semibold mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create &ldquo;{searchQuery.trim()}&rdquo;</span>
                      </button>
                    )}
                  </div>
                ) : (
                  displayedOptions.map((option, idx) => {
                    const isSelected = isMulti
                      ? Array.isArray(currentValue) &&
                        currentValue.some((v) => String(v) === String(option.value))
                      : String(currentValue) === String(option.value);

                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(option)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          'p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                          isHighlighted && 'bg-slate-100 dark:bg-brand-darkSecondary',
                          isSelected &&
                            'bg-indigo-50/70 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF]',
                          option.disabled &&
                            'opacity-40 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          {option.icon && (
                            <span className="text-brand-muted shrink-0">
                              {option.icon}
                            </span>
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-brand-text truncate flex items-center space-x-1.5">
                              <span>{option.label}</span>
                              {option.badge && (
                                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-brand-darkCard text-brand-muted font-normal">
                                  {option.badge}
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <div className="text-[10px] text-brand-muted truncate mt-0.5">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-brand-primary dark:text-[#8495FF] shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}

                {/* Mode A: Load More (Pagination next 5 records) */}
                {masterType && remoteHasNext && (
                  <div className="p-1 pt-1.5">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={handleLoadMore}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-brand-primary dark:text-[#8495FF] hover:bg-indigo-50 dark:hover:bg-brand-darkSecondary transition-colors flex items-center justify-center space-x-1.5 border border-dashed border-brand-primary/30"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading next batch...</span>
                        </>
                      ) : (
                        <span>
                          Show More ({remoteTotal - remoteOptions.length} remaining) &darr;
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </OverlayPortal>
        )}
      </div>
    );
  }
);

UniversalSelect.displayName = 'UniversalSelect';

/**
 * UniversalMultiSelect Convenience Wrapper
 */
export const UniversalMultiSelect: React.FC<Omit<UniversalSelectProps, 'isMulti'>> = (
  props
) => <UniversalSelect {...props} isMulti={true} />;

/**
 * UniversalAsyncSelect Convenience Wrapper (Mode A)
 */
export const UniversalAsyncSelect: React.FC<UniversalSelectProps> = (props) => (
  <UniversalSelect {...props} />
);

/**
 * UniversalDependentSelect Convenience Wrapper (Parent-child cascading e.g. Floor -> Room)
 */
export const UniversalDependentSelect: React.FC<
  UniversalSelectProps & { parentValue?: string | number | null }
> = ({ parentValue, parentValueId, onChange, ...rest }) => {
  const previousParent = useRef(parentValue ?? parentValueId);

  useEffect(() => {
    const current = parentValue ?? parentValueId;
    if (previousParent.current !== undefined && previousParent.current !== current) {
      // Clear selection when parent changes
      onChange?.(rest.isMulti ? [] : '', null);
    }
    previousParent.current = current;
  }, [parentValue, parentValueId, onChange, rest.isMulti]);

  return (
    <UniversalSelect
      {...rest}
      parentValueId={parentValueId ?? (typeof parentValue === 'number' ? parentValue : undefined)}
      onChange={onChange}
    />
  );
};
