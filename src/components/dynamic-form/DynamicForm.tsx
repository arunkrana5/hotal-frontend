import React, { useState } from 'react';
import { DynamicFormDto, DynamicFormFieldDto } from '@/types/configuration';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { Button } from '@/components/common/Button';
import { AlertCircle, CheckCircle, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DynamicFormProps {
  formDefinition: DynamicFormDto;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  isLoading?: boolean;
  submitButtonText?: string;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  formDefinition,
  initialValues = {},
  onSubmit,
  isLoading = false,
  submitButtonText = 'Save Changes',
  className,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = { ...initialValues };
    formDefinition.fields.forEach((field) => {
      if (defaults[field.fieldKey] === undefined && field.defaultValue) {
        defaults[field.fieldKey] = field.defaultValue;
      }
    });
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    formDefinition.fields.forEach((field) => {
      const val = formData[field.fieldKey];
      if (field.isMandatory) {
        if (val === undefined || val === null || val === '') {
          newErrors[field.fieldKey] = `${field.fieldLabel} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
      setSuccessMessage('Form submitted successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to submit form' });
    }
  };

  const handleReset = () => {
    const defaults: Record<string, any> = { ...initialValues };
    formDefinition.fields.forEach((field) => {
      if (defaults[field.fieldKey] === undefined && field.defaultValue) {
        defaults[field.fieldKey] = field.defaultValue;
      }
    });
    setFormData(defaults);
    setErrors({});
    setSuccessMessage(null);
  };

  // Group fields by SectionName
  const groupedFields = formDefinition.fields
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .reduce((acc, field) => {
      const section = field.sectionName || 'General Information';
      if (!acc[section]) acc[section] = [];
      acc[section].push(field);
      return acc;
    }, {} as Record<string, DynamicFormFieldDto[]>);

  const renderField = (field: DynamicFormFieldDto) => {
    const error = errors[field.fieldKey];
    const value = formData[field.fieldKey] ?? '';

    switch (field.fieldType.toUpperCase()) {
      case 'SELECT':
        if (field.masterDefinitionCode) {
          return (
            <DynamicDropdown
              masterCode={field.masterDefinitionCode}
              value={value}
              onChange={(val) => handleFieldChange(field.fieldKey, val)}
              placeholder={field.placeholder || `Select ${field.fieldLabel}...`}
              error={error}
            />
          );
        }
        return (
          <UniversalSelect
            options={[]}
            value={value ? String(value) : ''}
            onChange={(val) => handleFieldChange(field.fieldKey, val)}
            placeholder={field.placeholder || `Select ${field.fieldLabel}...`}
            error={error}
          />
        );

      case 'CHECKBOX':
        return (
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id={field.fieldKey}
              checked={Boolean(formData[field.fieldKey])}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={field.fieldKey} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              {field.fieldLabel} {field.isMandatory && <span className="text-red-500">*</span>}
            </label>
          </div>
        );

      case 'TEXTAREA':
        return (
          <textarea
            rows={3}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );

      case 'NUMBER':
      case 'DECIMAL':
        return (
          <input
            type="number"
            step={field.fieldType.toUpperCase() === 'DECIMAL' ? '0.01' : '1'}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value === '' ? '' : Number(e.target.value))}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );

      case 'TIME':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );

      case 'TEXT':
      default:
        return (
          <input
            type="text"
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700'
            )}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {errors.form && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {Object.entries(groupedFields).map(([sectionTitle, fields]) => (
        <div
          key={sectionTitle}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{sectionTitle}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.fieldKey}
                className={cn(
                  'space-y-1',
                  field.fieldType.toUpperCase() === 'TEXTAREA' ? 'sm:col-span-2' : ''
                )}
              >
                {field.fieldType.toUpperCase() !== 'CHECKBOX' && (
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {field.fieldLabel} {field.isMandatory && <span className="text-red-500">*</span>}
                  </label>
                )}

                {renderField(field)}

                {errors[field.fieldKey] && (
                  <p className="text-[11px] text-red-500 mt-1">{errors[field.fieldKey]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Action Controls */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
          className="flex items-center space-x-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>

        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Saving...' : submitButtonText}</span>
        </Button>
      </div>
    </form>
  );
};
