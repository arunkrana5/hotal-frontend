import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  WorkOrderDto,
  CreateWorkOrderRequest,
  AssetDto,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  Wrench,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Flame,
} from 'lucide-react';

export const WorkOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrderDto[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const { documentNumber: woNumber, isLoading: isWoLoading, refetch: refetchWo } = useDocumentNumber('WORK_ORDER');
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form
  const [newOrder, setNewOrder] = useState<CreateWorkOrderRequest>({
    assetId: undefined,
    roomId: undefined,
    departmentCode: 'ENG',
    issueDescription: '',
    priority: 'MEDIUM',
  });

  // Resolve Form
  const [resolveStatus, setResolveStatus] = useState<string>('COMPLETED');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [additionalCost, setAdditionalCost] = useState<number>(0);

  const fetchOrders = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);
    if (priorityFilter) query.append('priority', priorityFilter);

    const res = await api.get<PagedResult<WorkOrderDto>>(`/maintenance/work-orders?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  const fetchAssets = async () => {
    const res = await api.get<PagedResult<AssetDto>>('/maintenance/assets?pageSize=50');
    if (res.success && res.data) {
      setAssets(res.data.items);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAssets();
  }, [pageIndex, pageSize, statusFilter, priorityFilter]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<WorkOrderDto>('/maintenance/work-orders', newOrder);
    if (res.success) {
      setShowCreateModal(false);
      setNewOrder({
        assetId: undefined,
        roomId: undefined,
        departmentCode: 'ENG',
        issueDescription: '',
        priority: 'MEDIUM',
      });
      fetchOrders();
    }
    setSubmitting(false);
  };

  const handleResolveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    const res = await api.put(`/maintenance/work-orders/${selectedOrder.id}/status`, {
      status: resolveStatus,
      resolutionNotes,
      cost: additionalCost,
    });
    if (res.success) {
      setShowResolveModal(false);
      setSelectedOrder(null);
      fetchOrders();
    }
    setSubmitting(false);
  };

  const openResolve = (ord: WorkOrderDto) => {
    setSelectedOrder(ord);
    setResolveStatus('COMPLETED');
    setResolutionNotes('');
    setAdditionalCost(0);
    setShowResolveModal(true);
  };

  const openCount = orders.filter(o => o.status === 'OPEN' || o.status === 'ASSIGNED').length;
  const criticalCount = orders.filter(o => o.priority === 'CRITICAL' || o.priority === 'HIGH').length;

  const columns = useMemo<ColumnDef<WorkOrderDto>[]>(
    () => [
      {
        accessorKey: 'workOrderNumber',
        header: 'Order #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'assetName',
        header: 'Asset / Target',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-semibold text-slate-900 dark:text-white text-xs">
                {row.assetName || (row.roomNumber ? `Room ${row.roomNumber}` : 'Central Facility')}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Dept: {row.departmentCode}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'issueDescription',
        header: 'Issue Description',
        cell: (info) => (
          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
            {info.getValue() as string}
          </p>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = (info.getValue() as string) || '';
          if (p === 'CRITICAL' || p === 'HIGH') return <Badge variant="danger" size="sm" dot>{p}</Badge>;
          if (p === 'MEDIUM') return <Badge variant="warning" size="sm">{p}</Badge>;
          return <Badge variant="neutral" size="sm">{p}</Badge>;
        },
      },
      {
        accessorKey: 'assignedTechnicianName',
        header: 'Technician',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {(info.getValue() as string) || 'Unassigned'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'OPEN') return <Badge variant="warning" dot>Open</Badge>;
          if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return <Badge variant="brand" dot>In Progress</Badge>;
          if (s === 'COMPLETED') return <Badge variant="success">Completed</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const ord = info.row.original;
          if (ord.status !== 'COMPLETED') {
            return (
              <Button
                size="xs"
                variant="outline"
                onClick={() => openResolve(ord)}
                className="font-semibold text-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Resolve</span>
              </Button>
            );
          }
          return <span className="text-xs text-slate-400 font-mono">&mdash;</span>;
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
          { label: 'Work Orders' },
        ]}
        title="Engineering & Maintenance Work Orders"
        subtitle="Asset repair tickets, HVAC/chiller logs, plumbing incidents & preventive maintenance"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Dispatch Work Order
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Work Orders
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Tickets
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Open In Queue
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {openCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Critical Priority
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {criticalCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Engineering SLA
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Active Shift On-Site
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Work Order Statuses</option>
            <option value="OPEN">Open (Unassigned)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>
      </div>

      {/* Work Orders DataTable */}
      <DataTable<WorkOrderDto>
        title="Maintenance Work Orders Log"
        subtitle="Live repair manifests across HVAC plants, boilers, guest suites, and kitchen equipment"
        data={orders}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchOrders}
        exportFileName="work_orders.csv"
      />

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Dispatch Maintenance Work Order"
        subtitle="Route repair directive to facility engineering technicians"
        icon={<Wrench className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateOrder}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !newOrder.issueDescription.trim()}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Dispatch Ticket
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={woNumber}
          label="Work Order Number"
          isLoading={isWoLoading}
          onRefresh={refetchWo}
          helperText="Auto-assigned sequentially by Engineering & Maintenance Engine"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Link Physical Hotel Asset (Optional)
          </label>
          <Select
            value={newOrder.assetId || ''}
            onChange={(e) => setNewOrder({ ...newOrder, assetId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">No specific asset (Suite / General)</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assetCode} - {a.assetName} ({a.location})
              </option>
            ))}
          </Select>
        </div>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </label>
            <Select
              value={newOrder.priority}
              onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical (Immediate Response)</option>
            </Select>
          </div>

          <Input
            label="Guest Room # (If Room Related)"
            type="number"
            placeholder="e.g. 304"
            value={newOrder.roomId || ''}
            onChange={(e) => setNewOrder({ ...newOrder, roomId: e.target.value ? Number(e.target.value) : undefined })}
          />
        </FormGrid>

        <div>
          <Textarea
            label="Issue Description &amp; Technical Symptoms *"
            rows={3}
            required
            value={newOrder.issueDescription}
            onChange={(e) => setNewOrder({ ...newOrder, issueDescription: e.target.value })}
            placeholder="e.g. Master suite AC compressor making vibrating noise; cooling reduced."
          />
        </div>
      </Modal>

      {/* Resolve Modal */}
      {selectedOrder && (
        <Modal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          title={`Sign-Off Work Order #${selectedOrder.workOrderNumber}`}
          subtitle="Document technical repairs, replaced parts, and costs"
          icon={<Wrench className="w-4 h-4" />}
          size="md"
          onSubmit={handleResolveOrder}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResolveModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                disabled={submitting || !resolutionNotes.trim()}
                isLoading={submitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Close Work Order
              </Button>
            </>
          }
        >
          <div>
            <Textarea
              label="Technician Resolution Notes *"
              rows={3}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced AC thermostat capacitor and recharged refrigerant; tested OK."
            />
          </div>

          <Input
            label="Spare Parts / Repair Cost ($)"
            type="number"
            step="0.01"
            min="0"
            value={additionalCost}
            onChange={(e) => setAdditionalCost(Number(e.target.value))}
            className="font-mono"
          />
        </Modal>
      )}
    </PageContainer>
  );
};
