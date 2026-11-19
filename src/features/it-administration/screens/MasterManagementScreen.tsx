import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { MasterDefinitionDto, MasterValueDto, CreateMasterValueRequest } from '@/types/masters';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Input, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Database,
  Plus,
  CheckCircle,
  XCircle,
  Sliders,
  Sparkles,
  X,
  Layers,
  ArrowRight,
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [modalError, setModalError] = useState<string | null>(null);
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
    setModalError(null);

    if (!modalForm.code.trim() || !modalForm.name.trim()) {
      setModalError('Code and Name are required.');
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
        setIsModalOpen(false);
        setModalForm({
          code: '',
          name: '',
          description: '',
          displayOrder: values.length + 1,
          isDefault: false,
        });
        fetchValues();
      } else {
        setModalError(res.message || 'Failed to create master value.');
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
  const columns: ColumnDef<MasterValueDto>[] = [
    {
      accessorKey: 'code',
      header: 'Value Code',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Display Label',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white text-xs">{row.original.name}</div>
          {row.original.description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{row.original.description}</div>
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
          <Badge variant="brand" size="sm">Default</Badge>
        ) : (
          <span className="text-slate-400 text-xs">&mdash;</span>
        ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success" dot size="sm">Active</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Disabled</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Toggle',
      cell: ({ row }) => (
        <button
          onClick={() => handleToggleActive(row.original)}
          className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
            row.original.isActive
              ? 'border-border dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:text-danger'
              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
          title={row.original.isActive ? 'Deactivate' : 'Activate'}
        >
          {row.original.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        </button>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Master Options' },
        ]}
        title="Master Data Configuration & Option Sets"
        subtitle="Centralized database choices, zero hardcoding policy & real-time dynamic dropdown binding"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                setModalError(null);
                setModalForm({
                  code: '',
                  name: '',
                  description: '',
                  displayOrder: values.length + 1,
                  isDefault: false,
                });
                setIsModalOpen(true);
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
          <Card className="p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Master Registries</span>
              <Badge variant="neutral" size="sm">{definitions.length}</Badge>
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
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-indigo text-white shadow-soft-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
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
            <Card className="p-4 space-y-3 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-navy-900 dark:to-navy-800/80 border-border dark:border-navy-700">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-brand-indigo" />
                <span>Live Component Test</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Rendered with <code>DynamicDropdown</code>. Any added or updated options appear instantly.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-900 p-2 rounded-lg border border-border dark:border-navy-700">
                  Selected Code: <strong>{testDropdownValue}</strong>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Content: DataTable */}
        <div className="lg:col-span-3 space-y-6">
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

      {/* Add Master Value Modal */}
      {selectedDefinition && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Add Option to ${selectedDefinition.name}`}
          subtitle={`Master Code: ${selectedDefinition.code}`}
          icon={<Plus className="w-4 h-4" />}
          size="lg"
          onSubmit={handleCreateSubmit}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || !modalForm.code.trim() || !modalForm.name.trim()}
                isLoading={isSaving}
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Add Master Option
              </Button>
            </>
          }
        >
          {modalError && (
            <Alert type="error" message={modalError} />
          )}

          <FormGrid cols={2}>
            <Input
              label="System Code *"
              required
              value={modalForm.code}
              onChange={(e) => setModalForm({ ...modalForm, code: e.target.value })}
              placeholder="e.g. VIP_SUITE"
              className="font-mono uppercase"
            />
            <Input
              label="Display Label *"
              required
              value={modalForm.name}
              onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
              placeholder="e.g. Presidential VIP Suite"
            />
          </FormGrid>

          <div>
            <Textarea
              label="Description / Help Notes"
              rows={2}
              value={modalForm.description}
              onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              placeholder="Describe when this master choice should be selected..."
            />
          </div>

          <FormGrid cols={2}>
            <Input
              label="Sort Display Order"
              type="number"
              min="1"
              value={modalForm.displayOrder}
              onChange={(e) => setModalForm({ ...modalForm, displayOrder: Number(e.target.value) })}
              className="font-mono"
            />

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={modalForm.isDefault}
                  onChange={(e) => setModalForm({ ...modalForm, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-brand-indigo focus:ring-brand-indigo"
                />
                <span>Set as System Default Option</span>
              </label>
            </div>
          </FormGrid>
        </Modal>
      )}
    </PageContainer>
  );
};
