import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  WorkOrderDto,
  CreateWorkOrderRequest,
  AssetDto,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const WorkOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrderDto[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderDto | null>(null);
  const [showResolveDrawer, setShowResolveDrawer] = useState<boolean>(false);
  const { documentNumber: woNumber, isLoading: isWoLoading, refetch: refetchWo } = useDocumentNumber('WORK_ORDER');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Form State
  const [newOrder, setNewOrder] = useState<CreateWorkOrderRequest>({
    assetId: undefined,
    roomId: undefined,
    departmentCode: 'ENG',
    issueDescription: '',
    priority: 'MEDIUM',
  });

  // Resolve Form State
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [additionalCost, setAdditionalCost] = useState<number>(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab !== 'ALL') query.append('status', activeTab);
    if (priorityFilter !== 'ALL') query.append('priority', priorityFilter);

    const res = await api.get<PagedResult<WorkOrderDto>>(`/maintenance/work-orders?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab, priorityFilter]);

  const fetchAssets = async () => {
    const res = await api.get<PagedResult<AssetDto>>('/maintenance/assets?pageSize=50');
    if (res.success && res.data) {
      setAssets(res.data.items);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAssets();
  }, [fetchOrders]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.issueDescription.trim()) {
      setErrorMsg('Issue description is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const res = await api.post<WorkOrderDto>('/maintenance/work-orders', newOrder);
    if (res.success) {
      setShowCreateDrawer(false);
      refetchWo();
      setNewOrder({
        assetId: undefined,
        roomId: undefined,
        departmentCode: 'ENG',
        issueDescription: '',
        priority: 'MEDIUM',
      });
      fetchOrders();
    } else {
      setErrorMsg(res.message || 'Failed to raise work order.');
    }
    setSubmitting(false);
  };

  const handleResolveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    setErrorMsg(null);
    const res = await api.put(`/maintenance/work-orders/${selectedOrder.id}/status`, {
      status: 'COMPLETED',
      resolutionNotes,
      actualCost: Number(additionalCost),
    });

    if (res.success) {
      setShowResolveDrawer(false);
      setSelectedOrder(null);
      fetchOrders();
    } else {
      setErrorMsg(res.message || 'Failed to update work order.');
    }
    setSubmitting(false);
  };

  const columns: ColumnDef<WorkOrderDto>[] = useMemo(
    () => [
      {
        accessorKey: 'workOrderNumber',
        header: 'WO #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'assetName',
        header: 'Asset / Equipment',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string || 'General Facility'}
            </div>
            {info.row.original.roomNumber && (
              <div className="text-[11px] font-mono text-brand-muted">
                Room #{info.row.original.roomNumber}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'issueDescription',
        header: 'Reported Issue',
        cell: (info) => (
          <p className="text-xs text-brand-text truncate max-w-sm">
            {info.getValue() as string}
          </p>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = (info.getValue() as string) || '';
          const variant = p === 'URGENT' || p === 'HIGH' ? 'danger' : p === 'MEDIUM' ? 'warning' : 'neutral';
          return <StatusBadge status={p} variant={variant} />;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            {row.original.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSelectedOrder(row.original);
                  setShowResolveDrawer(true);
                }}
                className="text-[11px] h-7 text-[#16845B]"
                leftIcon={<CheckCircle2 className="w-3 h-3" />}
              >
                Resolve
              </Button>
            )}

            <RowActions onView={() => setSelectedOrder(row.original)} />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Engineering Work Orders"
        badge={<StatusBadge status="ACTIVE" label="Facility Maintenance" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Raise Work Order
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Work Orders', count: totalCount },
          { id: 'OPEN', label: 'Open / Dispatched' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'COMPLETED', label: 'Completed' },
        ]}
      />

      {/* 3. Data Table with Integrated Toolbar & Filters */}
      <DataTable
        data={orders}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search WO #, asset name, issue description..."
        filters={[
          {
            id: 'priority',
            label: 'Priority',
            value: priorityFilter,
            options: [
              { label: 'All Priorities', value: 'ALL' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ],
            onChange: setPriorityFilter,
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setPriorityFilter('ALL');
        }}
        isFiltered={search !== '' || priorityFilter !== 'ALL'}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="work_orders.csv"
      />

      {/* 5. Create Work Order Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateOrder}
        title="Raise Engineering Work Order"
        subtitle="Log equipment fault or preventive maintenance request"
        submitText={submitting ? 'Raising...' : 'Issue Work Order'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Equipment & Priority" description="Select affected asset and urgency">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              WO Number (Read-Only)
            </label>
            <input
              type="text"
              readOnly
              value={woNumber || 'Generating...'}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-primary dark:text-[#8495FF]"
            />
          </div>

          <div>
            <UniversalSelect
              label="Priority Level"
              required
              size="sm"
              value={newOrder.priority}
              onChange={(val) => setNewOrder({ ...newOrder, priority: val || 'MEDIUM' })}
              masterType="TASK_PRIORITY"
              options={[
                { value: 'URGENT', label: 'Urgent (Guest Impact / Safety)', badge: 'URG' },
                { value: 'HIGH', label: 'High Priority', badge: 'HI' },
                { value: 'MEDIUM', label: 'Medium (Routine)', badge: 'MED' },
                { value: 'LOW', label: 'Low', badge: 'LOW' },
              ]}
              clearable={false}
            />
          </div>

          <div className="sm:col-span-2">
            <UniversalSelect
              label="Asset / Machinery Register"
              size="sm"
              value={newOrder.assetId || ''}
              onChange={(val) => setNewOrder({ ...newOrder, assetId: val ? Number(val) : undefined })}
              options={[
                { value: '', label: 'General Facility / Non-Asset Issue' },
                ...assets.map((a) => ({
                  value: a.id,
                  label: `${a.assetName} (${a.assetCode}) - ${a.location}`,
                  badge: a.assetCode,
                })),
              ]}
              placeholder="Select asset or general facility..."
              clearable={true}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Issue Description &amp; Symptoms *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. HVAC chiller compressor tripping, water pressure low on 4th floor"
              value={newOrder.issueDescription}
              onChange={(e) => setNewOrder({ ...newOrder, issueDescription: e.target.value })}
              className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Resolve Work Order Drawer */}
      {selectedOrder && showResolveDrawer && (
        <FormDrawer
          isOpen={showResolveDrawer}
          onClose={() => setShowResolveDrawer(false)}
          onSubmit={handleResolveOrder}
          title={`Resolve WO #${selectedOrder.workOrderNumber}`}
          subtitle={`Asset: ${selectedOrder.assetName || 'General Facility'}`}
          submitText={submitting ? 'Resolving...' : 'Sign Off & Complete'}
          isLoading={submitting}
          width="md"
        >
          <FormSection title="Resolution Details" description="Log maintenance work performed">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Technician Resolution Notes *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Replaced capacitor, pressure tested, system operational"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Parts &amp; Labor Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={additionalCost}
                onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          </FormSection>
        </FormDrawer>
      )}

      {/* 7. Detail Drawer */}
      {selectedOrder && !showResolveDrawer && (
        <DetailDrawer
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Work Order #${selectedOrder.workOrderNumber}`}
          subtitle={`Equipment: ${selectedOrder.assetName || 'General Facility'}`}
          status={selectedOrder.status}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Priority</span>
                <StatusBadge status={selectedOrder.priority} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Reported Issue</span>
              <p className="text-brand-text leading-relaxed">{selectedOrder.issueDescription}</p>
            </div>
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
