import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { AssetDto, CreateAssetRequest } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  RowActions,
  DetailDrawer,
  FormDrawer,
  FormSection,
  StatusBadge,
} from '@/components/enterprise';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import {
  Wrench,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  X,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Building,
  AlertCircle,
  Download,
} from 'lucide-react';

export const AssetRegisterScreen: React.FC = () => {
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Drawers state
  const [showFormDrawer, setShowFormDrawer] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<AssetDto | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAssetRequest>({
    assetCode: '',
    assetName: '',
    category: 'HVAC',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 5000,
    warrantyExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    serialNumber: '',
    manufacturer: '',
  });

  const fetchAssets = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search) query.append('search', search);
    if (categoryFilter) query.append('category', categoryFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<AssetDto>>(`/maintenance/assets?${query.toString()}`);
    if (res.success && res.data) {
      setAssets(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [pageIndex, pageSize, search, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({
      assetCode: '',
      assetName: '',
      category: 'HVAC',
      location: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 5000,
      warrantyExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      serialNumber: '',
      manufacturer: '',
    });
    setErrorMsg(null);
    setShowFormDrawer(true);
  };

  const handleOpenEdit = (asset: AssetDto) => {
    setEditingAsset(asset);
    setFormData({
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      category: asset.category,
      location: asset.location,
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      warrantyExpiryDate: asset.warrantyExpiryDate || '',
      serialNumber: asset.serialNumber || '',
      manufacturer: asset.manufacturer || '',
    });
    setErrorMsg(null);
    setShowFormDrawer(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetCode.trim() || !formData.assetName.trim()) {
      setErrorMsg('Asset code and name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    if (editingAsset) {
      const res = await api.put<AssetDto>(`/maintenance/assets/${editingAsset.id}`, {
        assetName: formData.assetName.trim(),
        category: formData.category.trim().toUpperCase(),
        location: formData.location.trim(),
        purchaseDate: formData.purchaseDate,
        purchaseCost: Number(formData.purchaseCost),
        warrantyExpiryDate: formData.warrantyExpiryDate?.trim() || null,
        serialNumber: formData.serialNumber?.trim() || null,
        manufacturer: formData.manufacturer?.trim() || null,
      });

      if (res.success) {
        setShowFormDrawer(false);
        setEditingAsset(null);
        fetchAssets();
      } else {
        setErrorMsg(res.message || 'Failed to update asset.');
      }
    } else {
      const res = await api.post<AssetDto>('/maintenance/assets', formData);
      if (res.success) {
        setShowFormDrawer(false);
        fetchAssets();
      } else {
        setErrorMsg(res.message || 'Failed to register asset.');
      }
    }
    setSubmitting(false);
  };

  const totalAssetValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  }, [assets]);

  const columns = useMemo<ColumnDef<AssetDto>[]>(
    () => [
      {
        accessorKey: 'assetCode',
        header: 'Asset Tag',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'assetName',
        header: 'Equipment Name',
        cell: (info) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Plant Location',
        cell: (info) => (
          <div className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'purchaseCost',
        header: 'Capital Value',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'warrantyExpiryDate',
        header: 'Warranty Till',
        cell: (info) => {
          const val = info.getValue() as string | undefined;
          return val ? (
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              {new Date(val).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-slate-400">&mdash;</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Health Status',
        cell: (info) => {
          const s = (info.getValue() as string) || 'OPERATIONAL';
          return (
            <StatusBadge
              status={s === 'OPERATIONAL' ? 'ACTIVE' : s === 'UNDER_MAINTENANCE' ? 'WARNING' : 'INACTIVE'}
              label={s.replace(/_/g, ' ')}
            />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedAsset(row.original)}
            onEdit={() => handleOpenEdit(row.original)}
            isActive={row.original.status === 'OPERATIONAL'}
            onToggleStatus={() => {}}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Fixed Asset Register & Plant Registry"
        badge={<StatusBadge status="ACTIVE" label="Capital Assets" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Capital Asset
            </Button>
          </PageActions>
        }
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Capital Assets
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Units
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Capital Valuation
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Operational Health
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {assets.filter((a) => a.status === 'OPERATIONAL').length} / {assets.length} Online
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Warranty Protected
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {assets.filter((a) => a.warrantyExpiryDate && new Date(a.warrantyExpiryDate) > new Date()).length} Assets
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Data Table with Integrated Toolbar */}
      <DataTable
        data={assets}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search asset tag, equipment name, location..."
        filters={[
          {
            id: 'category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            placeholder: 'All Categories',
            options: [
              { value: '', label: 'All Categories' },
              { value: 'HVAC', label: 'HVAC & Ventilation' },
              { value: 'ELECTRICAL', label: 'Electrical & Backup' },
              { value: 'PLUMBING', label: 'Plumbing & Water Heating' },
              { value: 'KITCHEN', label: 'Commercial Kitchen' },
              { value: 'ELEVATOR', label: 'Elevators & Escalators' },
            ],
          },
          {
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'All Health Statuses',
            options: [
              { value: '', label: 'All Health Statuses' },
              { value: 'OPERATIONAL', label: 'Operational', badge: 'ACT' },
              { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance', badge: 'WRN' },
              { value: 'DECOMMISSIONED', label: 'Decommissioned', badge: 'DEC' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setCategoryFilter('');
          setStatusFilter('');
        }}
        isFiltered={search !== '' || categoryFilter !== '' || statusFilter !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="asset_register.csv"
        onRefresh={fetchAssets}
      />

      {/* 4. Create / Edit Asset Drawer */}
      <FormDrawer
        isOpen={showFormDrawer}
        onClose={() => {
          setShowFormDrawer(false);
          setEditingAsset(null);
        }}
        onSubmit={handleSaveAsset}
        title={editingAsset ? `Edit Asset #${editingAsset.assetCode}` : 'Register Capital Asset'}
        submitText={submitting ? 'Saving...' : editingAsset ? 'Update Asset' : 'Save Asset Record'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Equipment Identification" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Asset Tag / Code *
            </label>
            <input
              type="text"
              required
              disabled={!!editingAsset}
              placeholder="e.g. AST-CHLR-01"
              value={formData.assetCode}
              onChange={(e) => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Trane Centrifugal Chiller 500T"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="Asset Category"
              required
              size="sm"
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val || 'HVAC' })}
              options={[
                { value: 'HVAC', label: 'HVAC & Ventilation', badge: 'HVAC' },
                { value: 'ELECTRICAL', label: 'Electrical & Backup', badge: 'ELEC' },
                { value: 'PLUMBING', label: 'Plumbing & Water Heating', badge: 'PLMB' },
                { value: 'KITCHEN', label: 'Kitchen Commercial Range', badge: 'KIT' },
                { value: 'ELEVATOR', label: 'Elevators & Vertical Transport', badge: 'ELEV' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Plant Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rooftop Mechanical Plant 4"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Financial & Warranty Terms" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Purchase Cost ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.purchaseCost}
              onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Commissioning Date *
            </label>
            <input
              type="date"
              required
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Warranty Expiry Date
            </label>
            <input
              type="date"
              value={formData.warrantyExpiryDate || ''}
              onChange={(e) => setFormData({ ...formData, warrantyExpiryDate: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              OEM Serial Number
            </label>
            <input
              type="text"
              placeholder="e.g. SN-TRN-92841"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Manufacturer / Brand
            </label>
            <input
              type="text"
              placeholder="e.g. Trane Technologies"
              value={formData.manufacturer || ''}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 5. Detail Drawer */}
      {selectedAsset && (
        <DetailDrawer
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          title={selectedAsset.assetName}
          subtitle={`Tag #${selectedAsset.assetCode} | Location: ${selectedAsset.location}`}
          status={selectedAsset.status}
          width="md"
          onEdit={() => {
            const asset = selectedAsset;
            setSelectedAsset(null);
            handleOpenEdit(asset);
          }}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Capital Value</span>
                <span className="font-mono font-bold text-base text-brand-text">
                  ${selectedAsset.purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Commissioned</span>
                <span className="font-mono text-brand-text">{selectedAsset.purchaseDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Category</span>
                <span className="font-semibold text-brand-text">{selectedAsset.category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Status</span>
                <StatusBadge status={selectedAsset.status === 'OPERATIONAL' ? 'ACTIVE' : 'WARNING'} label={selectedAsset.status} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Serial Number</span>
                <span className="font-mono text-brand-text">{selectedAsset.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Manufacturer</span>
                <span className="text-brand-text">{selectedAsset.manufacturer || 'N/A'}</span>
              </div>
            </div>

            {selectedAsset.location && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Physical Plant Location</span>
                <p className="text-brand-text">{selectedAsset.location}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};

export default AssetRegisterScreen;
