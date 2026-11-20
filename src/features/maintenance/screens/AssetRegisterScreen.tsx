import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { AssetDto, CreateAssetRequest } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
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

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newAsset, setNewAsset] = useState<CreateAssetRequest>({
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

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<AssetDto>('/maintenance/assets', newAsset);
    if (res.success) {
      setShowModal(false);
      setNewAsset({
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
      fetchAssets();
    }
    setSubmitting(false);
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const operationalCount = assets.filter(a => a.status === 'OPERATIONAL' || !a.status).length;

  const columns = useMemo<ColumnDef<AssetDto>[]>(
    () => [
      {
        accessorKey: 'assetCode',
        header: 'Asset Tag',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'assetName',
        header: 'Equipment Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {info.row.original.manufacturer && `${info.row.original.manufacturer} • `}SN: {info.row.original.serialNumber || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Plant Location',
        cell: (info) => (
          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{(info.getValue() as string) || 'Central Plant'}</span>
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
          if (s === 'OPERATIONAL') return <Badge variant="success" dot>Operational</Badge>;
          if (s === 'UNDER_MAINTENANCE') return <Badge variant="warning" dot>In Maintenance</Badge>;
          if (s === 'DECOMMISSIONED') return <Badge variant="danger">Decommissioned</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Maintenance', href: '/maintenance/work-orders' },
          { label: 'Fixed Assets' },
        ]}
        title="Fixed Asset Register & Plant Registry"
        subtitle="Chillers, elevators, generators, commercial kitchen ranges, warranty tracking & depreciation"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Capital Asset
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
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
              {operationalCount} Active
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Warranty Coverage
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Active OEM Contracts
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      {/* Assets DataTable with Integrated Filter & Toolbar */}
      <DataTable<AssetDto>
        title="Physical Asset Register"
        data={assets}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchAssets}
        exportFileName="asset_register.csv"
        filters={[
          {
            id: 'category',
            label: 'Asset Category',
            value: categoryFilter,
            options: [
              { label: 'All Asset Categories', value: '' },
              { label: 'HVAC & Chillers', value: 'HVAC' },
              { label: 'Generators & Transformers', value: 'ELECTRICAL' },
              { label: 'Boilers & Water Plants', value: 'PLUMBING' },
              { label: 'Commercial Kitchen Ranges', value: 'KITCHEN' },
              { label: 'Elevators & Escalators', value: 'ELEVATOR' },
            ],
            onChange: (val) => {
              setCategoryFilter(val);
              setPageIndex(0);
            },
            width: 'w-48',
          },
        ]}
        onSearchChange={(s) => {
          setSearch(s);
          setPageIndex(0);
        }}
        searchPlaceholder="Filter assets by tag, name, or serial..."
      />

      {/* Add Asset Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Capital Hotel Asset"
        subtitle="Add plant machinery, serial numbers, warranty terms, and location"
        icon={<Building className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateAsset}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !newAsset.assetCode || !newAsset.assetName}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Asset Record
            </Button>
          </>
        }
      >
        <FormGrid cols={2}>
          <Input
            label="Asset Code / Tag *"
            required
            value={newAsset.assetCode}
            onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
            placeholder="e.g. AST-CHLR-01"
            className="font-mono uppercase"
          />
          <Input
            label="Asset Name *"
            required
            value={newAsset.assetName}
            onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
            placeholder="e.g. Trane Centrifugal Chiller 500T"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Asset Category
            </label>
            <Select
              value={newAsset.category}
              onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
            >
              <option value="HVAC">HVAC &amp; Ventilation</option>
              <option value="ELECTRICAL">Electrical &amp; Backup</option>
              <option value="PLUMBING">Plumbing &amp; Water Heating</option>
              <option value="KITCHEN">Kitchen Commercial Range</option>
              <option value="ELEVATOR">Elevators &amp; Vertical Transport</option>
            </Select>
          </div>

          <Input
            label="Plant Location *"
            required
            value={newAsset.location}
            onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
            placeholder="e.g. Rooftop Mechanical Plant 4"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Purchase Cost ($) *"
            type="number"
            step="0.01"
            required
            value={newAsset.purchaseCost}
            onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: Number(e.target.value) })}
            className="font-mono"
          />
          <Input
            label="Commissioning Date *"
            type="date"
            required
            value={newAsset.purchaseDate}
            onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
          />
          <Input
            label="Warranty Expiry"
            type="date"
            value={newAsset.warrantyExpiryDate}
            onChange={(e) => setNewAsset({ ...newAsset, warrantyExpiryDate: e.target.value })}
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Manufacturer / Brand"
            value={newAsset.manufacturer}
            onChange={(e) => setNewAsset({ ...newAsset, manufacturer: e.target.value })}
            placeholder="e.g. Trane Technologies"
          />
          <Input
            label="OEM Serial Number"
            value={newAsset.serialNumber}
            onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
            placeholder="e.g. SN-TRN-92841"
            className="font-mono"
          />
        </FormGrid>
      </Modal>
    </PageContainer>
  );
};
