import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  PurchaseRequisitionDto,
  CreatePurchaseRequisitionRequest,
  CreateRequisitionItemRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Package,
} from 'lucide-react';

export const PurchaseRequisitionsScreen: React.FC = () => {
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const { documentNumber: prNumber, isLoading: isPrLoading, refetch: refetchPr } = useDocumentNumber('PURCHASE_REQUISITION');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [departmentCode, setDepartmentCode] = useState<string>('FB');
  const [requiredByDate, setRequiredByDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [justification, setJustification] = useState<string>('');
  const [items, setItems] = useState<CreateRequisitionItemRequest[]>([
    { itemName: '', description: '', quantity: 1, unit: 'PCS', estimatedUnitPrice: 10 },
  ]);

  const fetchRequisitions = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<PurchaseRequisitionDto>>(
      `/purchase/requisitions?${query.toString()}`
    );
    if (res.success && res.data) {
      setRequisitions(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequisitions();
  }, [pageIndex, pageSize, statusFilter]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemName: '', description: '', quantity: 1, unit: 'PCS', estimatedUnitPrice: 10 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateRequisitionItemRequest,
    val: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const calculatedTotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.estimatedUnitPrice) || 0),
      0
    );
  }, [items]);

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const req: CreatePurchaseRequisitionRequest = {
      departmentCode,
      requiredByDate,
      priority,
      justification,
      items,
    };
    const res = await api.post<PurchaseRequisitionDto>('/purchase/requisitions', req);
    if (res.success) {
      setShowModal(false);
      setJustification('');
      setItems([{ itemName: '', description: '', quantity: 1, unit: 'PCS', estimatedUnitPrice: 10 }]);
      fetchRequisitions();
    }
    setSubmitting(false);
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    await api.put(`/purchase/requisitions/${id}/status`, { status });
    fetchRequisitions();
  };

  const totalReqValue = requisitions.reduce((sum, r) => sum + (r.totalEstimatedAmount || 0), 0);
  const pendingCount = requisitions.filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING').length;

  const columns = useMemo<ColumnDef<PurchaseRequisitionDto>[]>(
    () => [
      {
        accessorKey: 'requisitionNumber',
        header: 'Requisition #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'departmentCode',
        header: 'Department',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono font-bold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = info.getValue() as string;
          if (p === 'URGENT' || p === 'HIGH') return <Badge variant="danger" size="sm" dot>{p}</Badge>;
          if (p === 'MEDIUM') return <Badge variant="warning" size="sm">{p}</Badge>;
          return <Badge variant="neutral" size="sm">{p}</Badge>;
        },
      },
      {
        accessorKey: 'items',
        header: 'Requested Items',
        cell: (info) => {
          const list = (info.getValue() as any[]) || [];
          return (
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">{list.length} Item(s)</span>
              {list[0] && (
                <span className="text-slate-500 dark:text-slate-400 block truncate max-w-xs text-[11px]">
                  {list[0].itemName} ({list[0].quantity} {list[0].unit})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'totalEstimatedAmount',
        header: 'Est. Total',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'requiredByDate',
        header: 'Required By',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Approval Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'APPROVED') return <Badge variant="success">Approved</Badge>;
          if (s === 'REJECTED') return <Badge variant="danger">Rejected</Badge>;
          if (s === 'CONVERTED_TO_PO') return <Badge variant="brand">PO Created</Badge>;
          return <Badge variant="warning" dot>{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const r = info.row.original;
          if (r.status === 'SUBMITTED' || r.status === 'PENDING') {
            return (
              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleStatusUpdate(r.id, 'APPROVED')}
                  className="font-semibold text-xs"
                >
                  Approve
                </Button>
                <Button
                  size="xs"
                  variant="danger"
                  onClick={() => handleStatusUpdate(r.id, 'REJECTED')}
                  className="font-semibold text-xs"
                >
                  Reject
                </Button>
              </div>
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
          { label: 'Procurement', href: '/purchase/requisitions' },
          { label: 'Requisitions' },
        ]}
        title="Purchase Requisitions & Indents"
        subtitle="Departmental procurement requests, budget threshold checks & GM approvals"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Purchase Requisition
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Requisitions
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Indents
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Approval
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Estimated Value
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalReqValue.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Approval Authority
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              GM / Financial Controller
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
            <option value="">All Requisition Statuses</option>
            <option value="SUBMITTED">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED_TO_PO">Converted to PO</option>
          </Select>
        </div>
      </div>

      {/* Requisitions DataTable */}
      <DataTable<PurchaseRequisitionDto>
        title="Purchase Requisition Manifest"
        subtitle="Departmental purchase orders undergoing workflow evaluation and vendor allocation"
        data={requisitions}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchRequisitions}
        exportFileName="purchase_requisitions.csv"
      />

      {/* New Requisition Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Draft Purchase Requisition (Indent)"
        subtitle="Specify line items, estimated pricing, and operational justification"
        icon={<Plus className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateRequisition}
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
              disabled={submitting || items.length === 0}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Submit Requisition
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={prNumber}
          label="Requisition Number"
          isLoading={isPrLoading}
          onRefresh={refetchPr}
          helperText="Auto-assigned sequentially by Purchase Engine"
        />

        <FormGrid cols={3}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Department
            </label>
            <DynamicDropdown
              masterCode="DEPARTMENT"
              value={departmentCode}
              onChange={(val) => setDepartmentCode(val)}
              placeholder="Select Department..."
            />
          </div>

          <Input
            label="Required By Date *"
            type="date"
            required
            value={requiredByDate}
            onChange={(e) => setRequiredByDate(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
        </FormGrid>

        <div>
          <Textarea
            label="Business Justification *"
            rows={2}
            required
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="e.g. Replenishing high-occupancy guest bathroom amenities and spa robes..."
          />
        </div>

        {/* Items Section */}
        <div className="space-y-3 pt-2 border-t border-border dark:border-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Requested Line Items</span>
            <Button type="button" size="xs" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3 h-3" />}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800/60 p-2.5 rounded-xl border border-border dark:border-navy-700">
                <div className="flex-1">
                  <Input
                    placeholder="Item name / spec..."
                    value={it.itemName}
                    required
                    onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="w-20">
                  <Input
                    placeholder="Unit"
                    value={it.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Est. Price"
                    value={it.estimatedUnitPrice}
                    onChange={(e) => handleItemChange(idx, 'estimatedUnitPrice', Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-danger rounded-lg transition shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-50 dark:bg-navy-800/40 p-3 rounded-xl border border-border dark:border-navy-700 text-xs font-semibold">
            <span>Computed Estimated Total:</span>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              ${calculatedTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
