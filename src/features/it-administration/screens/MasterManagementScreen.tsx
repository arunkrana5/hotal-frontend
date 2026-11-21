import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { MasterDefinitionDto, MasterValueDto, CreateMasterValueRequest } from '@/types/masters';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { FormDrawer, FormSection, RowActions, StatusBadge } from '@/components/enterprise';
import {
  Database,
  Plus,
  Sliders,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const MasterManagementScreen: React.FC = () => {
  const [definitions, setDefinitions] = useState<MasterDefinitionDto[]>([]);
  const [selectedDefinition, setSelectedDefinition] = useState<MasterDefinitionDto | null>(null);

  // Table State
  const [values, setValues] = useState<MasterValueDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Interactive Live Dropdown Test
  const [testDropdownValue, setTestDropdownValue] = useState<string>('');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalForm, setModalForm] = useState<{
    code: string;
    name: string;
    description: string;
    numericValue?: number;
    displayOrder: number;
    isDefault: boolean;
  }>({
    code: '',
    name: '',
    description: '',
    displayOrder: 1,
    isDefault: false,
  });
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Definitions
  useEffect(() => {
    const fetchDefinitions = async () => {
      const res = await api.request<MasterDefinitionDto[]>('/masters/definitions');
      if (res.success && res.data && res.data.length > 0) {
        setDefinitions(res.data);
        setSelectedDefinition(res.data[0]);
      }
    };
    fetchDefinitions();
  }, []);

  // Fetch Master Values
  const fetchValues = useCallback(async () => {
    if (!selectedDefinition) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await api.request<PagedResult<MasterValueDto>>(
        `/masters/${selectedDefinition.code}/values?${params.toString()}`
      );
      if (res.success && res.data) {
        setValues(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedDefinition, pageIndex, pageSize, search]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  // Handle Create New Master Value
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDefinition) return;
    setDrawerError(null);

    if (!modalForm.code.trim() || !modalForm.name.trim()) {
      setDrawerError('Code and Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateMasterValueRequest = {
        masterDefinitionId: selectedDefinition.id,
        code: modalForm.code.trim().toUpperCase(),
        name: modalForm.name.trim(),
        description: modalForm.description.trim(),
        numericValue: modalForm.numericValue,
        displayOrder: modalForm.displayOrder,
        isDefault: modalForm.isDefault,
      };

      const res = await api.request('/masters/values', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setIsDrawerOpen(false);
        setModalForm({
          code: '',
          name: '',
          description: '',
          displayOrder: values.length + 1,
          isDefault: false,
        });
        fetchValues();
      } else {
        setDrawerError(res.message || 'Failed to create master value.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (val: MasterValueDto) => {
    const res = await api.request(`/masters/values/${val.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: val.name,
        description: val.description,
        numericValue: val.numericValue,
        displayOrder: val.displayOrder,
        isActive: !val.isActive,
        isDefault: val.isDefault,
      }),
    });

    if (res.success) {
      fetchValues();
    }
  };

  // Columns
  const columns = useMemo<ColumnDef<MasterValueDto>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Value Code',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-[#354FC7] dark:text-[#8495FF]">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Display Label',
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
              {row.original.name}
            </span>
            {row.original.description && (
              <span className="text-[11px] text-brand-muted truncate">
                • {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'displayOrder',
        header: 'Sort Order',
        cell: ({ row }) => (
          <span className="text-slate-500 font-mono text-xs">{row.original.displayOrder}</span>
        ),
      },
      {
        accessorKey: 'isDefault',
        header: 'Default Flag',
        cell: ({ row }) =>
          row.original.isDefault ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-[#354FC7] dark:bg-brand-darkSecondary dark:text-[#8495FF] border border-indigo-100 dark:border-brand-darkBorder">
              Default
            </span>
          ) : (
            <span className="text-slate-400 text-xs">&mdash;</span>
          ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            isActive={row.original.isActive}
            onToggleStatus={() => handleToggleActive(row.original)}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Master Registries' },
        ]}
        title="Master Data Configuration & Option Sets"
        subtitle="Centralized database choices, zero hardcoding policy & real-time dynamic dropdown binding"
        icon={<Database className="w-4 h-4" />}
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                setDrawerError(null);
                setModalForm({
                  code: '',
                  name: '',
                  description: '',
                  displayOrder: values.length + 1,
                  isDefault: false,
                });
                setIsDrawerOpen(true);
              }}
              disabled={!selectedDefinition}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Option to {selectedDefinition?.code || 'Master'}
            </Button>
          </PageActions>
        }
      />

      {/* Main Grid: Master Selector Tabs (Left) + Table & Live Test (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Master Categories */}
        <div className="space-y-4">
          <Card className="p-3.5 space-y-2 border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
            <div className="text-xs font-bold text-brand-text uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Master Registries</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-brand-darkCard text-slate-600 dark:text-slate-400">
                {definitions.length}
              </span>
            </div>

            <div className="space-y-1">
              {definitions.map((def) => {
                const isSelected = selectedDefinition?.id === def.id;
                return (
                  <button
                    key={def.id}
                    onClick={() => {
                      setSelectedDefinition(def);
                      setPageIndex(0);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-soft-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-darkCard'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{def.name}</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {def.code}
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Live Interactive Dropdown Preview */}
          {selectedDefinition && (
            <Card className="p-4 space-y-3 bg-slate-50/60 dark:bg-brand-darkCard border border-brand-border dark:border-brand-darkBorder shadow-soft-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
                <Sparkles className="w-4 h-4 text-brand-primary dark:text-[#8495FF]" />
                <span>Live Component Test</span>
              </div>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Rendered with <code>DynamicDropdown</code>. Any added or updated options appear instantly.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-brand-text mb-1">
                  {selectedDefinition.name} Selector:
                </label>
                <DynamicDropdown
                  masterCode={selectedDefinition.code}
                  value={testDropdownValue}
                  onChange={(val) => setTestDropdownValue(val)}
                  placeholder={`Choose ${selectedDefinition.name}...`}
                />
              </div>
              {testDropdownValue && (
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-brand-darkSurface p-2 rounded-lg border border-brand-border dark:border-brand-darkBorder">
                  Selected Code: <strong>{testDropdownValue}</strong>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Content: DataTable */}
        <div className="lg:col-span-3 space-y-4">
          <DataTable<MasterValueDto>
            title={`${selectedDefinition?.name || 'Master'} Values Manifest`}
            subtitle={selectedDefinition?.description || 'Zero-hardcoding central database values'}
            data={values}
            columns={columns}
            totalCount={totalCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            onSearchChange={(s) => {
              setSearch(s);
              setPageIndex(0);
            }}
            onRefresh={fetchValues}
            searchPlaceholder="Filter values by code or label..."
            exportFileName={`${selectedDefinition?.code.toLowerCase()}_master_values.csv`}
          />
        </div>
      </div>

      {/* Slide-over FormDrawer for Adding Option */}
      {selectedDefinition && (
        <FormDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleCreateSubmit}
          title={`Add Option to ${selectedDefinition.name}`}
          subtitle={`Master Code: ${selectedDefinition.code}`}
          submitText={isSaving ? 'Saving Option...' : 'Save Master Option'}
          isLoading={isSaving}
          width="md"
        >
          {drawerError && (
            <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{drawerError}</span>
            </div>
          )}

          <FormSection title="Option Identification" description="Code and display text for dynamic form bindings">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                System Code *
              </label>
              <input
                type="text"
                required
                value={modalForm.code}
                onChange={(e) => setModalForm({ ...modalForm, code: e.target.value })}
                placeholder="e.g. VIP_SUITE"
                className="w-full h-8 px-2.5 text-xs font-mono uppercase rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Display Label *
              </label>
              <input
                type="text"
                required
                value={modalForm.name}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                placeholder="e.g. Presidential VIP Suite"
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Description / Help Notes
              </label>
              <textarea
                rows={2}
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                placeholder="Describe when this master choice should be selected..."
                className="w-full p-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none resize-none"
              />
            </div>
          </FormSection>

          <FormSection title="Ordering & Defaults" description="Sorting behavior in dynamic selects">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Sort Display Order
              </label>
              <input
                type="number"
                min="1"
                value={modalForm.displayOrder}
                onChange={(e) => setModalForm({ ...modalForm, displayOrder: Number(e.target.value) })}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer select-none text-xs font-semibold text-brand-text">
                <input
                  type="checkbox"
                  checked={modalForm.isDefault}
                  onChange={(e) => setModalForm({ ...modalForm, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>Set as Default Option</span>
              </label>
            </div>
          </FormSection>
        </FormDrawer>
      )}
    </PageContainer>
  );
};
