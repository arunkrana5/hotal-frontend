import React from 'react';
import { UniversalSelect, SelectOption } from '@/components/common/UniversalSelect';

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

/**
 * DynamicDropdown - Backward compatible wrapper over enterprise UniversalSelect.
 * Seamlessly delivers Mode A server-side pagination (5 items initial batch),
 * debounced remote search, portal-based zero-clipping overlay, and full keyboard navigation.
 */
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
  return (
    <UniversalSelect
      masterType={masterCode}
      value={value !== undefined && value !== null ? String(value) : undefined}
      onChange={(val, opt) => {
        const option = opt as SelectOption | undefined;
        onChange(
          (val as string) || '',
          option
            ? {
                id: Number(option.value) || 0,
                code: String(option.value),
                name: option.label,
                description: option.description,
              }
            : undefined
        );
      }}
      label={label}
      placeholder={placeholder}
      parentValueId={parentValueId ?? undefined}
      propertyId={propertyId ?? undefined}
      disabled={disabled}
      error={error}
      required={isRequired}
      className={className}
      pageSize={5}
    />
  );
};
