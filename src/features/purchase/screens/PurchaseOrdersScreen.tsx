import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  PurchaseOrderDto,
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderItemRequest,
  VendorDto,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Truck,
  Trash2,
  X,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';

export const PurchaseOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const { documentNumber: poNumber, isLoading: isPoLoading, refetch: refetchPo } = useDocumentNumber('PURCHASE_ORDER');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<CreatePurchaseOrderItemRequest[]>([
    { itemName: '', quantityOrdered: 10, unit: 'PCS', unitPrice: 20 },
  ]);

  const fetchOrders = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<PurchaseOrderDto>>(`/purchase/orders?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  const fetchVendors = async () => {
    const res = await api.get<PagedResult<VendorDto>>('/purchase/vendors?pageSize=50');
    if (res.success && res.data) {
      setVendors(res.data.items);
      if (res.data.items.length > 0 && vendorId === '') {
        setVendorId(res.data.items[0].id);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, [pageIndex, pageSize, statusFilter]);

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantityOrdered: 5, unit: 'PCS', unitPrice: 15 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreatePurchaseOrderItemRequest,
    val: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const calculatedSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantityOrdered) || 0) * (Number(item.unitPrice) || 0),
      0
    );
  }, [items]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;

    setSubmitting(true);
    const req: CreatePurchaseOrderRequest = {
      vendorId: Number(vendorId),
      orderDate,
      expectedDeliveryDate,
      paymentTerms,
      notes,
      items,
    };
    const res = await api.post<PurchaseOrderDto>('/purchase/orders', req);
    if (res.success) {
      setShowModal(false);
      setNotes('');
      setItems([{ itemName: '', quantityOrdered: 10, unit: 'PCS', unitPrice: 20 }]);
      fetchOrders();
    }
    setSubmitting(false);
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    await api.put(`/purchase/orders/${id}/status`, { status });
    fetchOrders();
  };

  const totalPoValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const columns = useMemo<ColumnDef<PurchaseOrderDto>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'PO Number',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'vendorName',
        header: 'Vendor / Supplier',
        cell: (info) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items Detail',
        cell: (info) => {
          const list = (info.getValue() as any[]) || [];
          return (
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{list.length} Item(s)</span>
              {list[0] && (
                <span className="text-slate-500 dark:text-slate-400 block truncate max-w-xs text-[11px]">
                  {list[0].itemName} ({list[0].quantityOrdered} {list[0].unit})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total Order Value',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'ISSUED') return <Badge variant="brand" dot>Issued to Supplier</Badge>;
          if (s === 'RECEIVED' || s === 'COMPLETED') return <Badge variant="success">Goods Received</Badge>;
          if (s === 'CANCELLED') return <Badge variant="danger">Cancelled</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const po = info.row.original;
          if (po.status === 'ISSUED' || po.status === 'DRAFT') {
            return (
              <Button
                size="xs"
                variant="success"
                onClick={() => handleStatusUpdate(po.id, 'RECEIVED')}
                className="font-semibold text-xs flex items-center gap-1"
              >
                <Truck className="w-3 h-3" />
                <span>Receive GRN</span>
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
          { label: 'Procurement', href: '/purchase/requisitions' },
          { label: 'Purchase Orders' },
        ]}
        title="Purchase Orders & Goods Receipts"
        subtitle="Vendor PO generation, payment terms, Goods Receipt Notes (GRN) & three-way match"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Generate Purchase Order
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Purchase Orders
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Orders
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Committed Spend
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalPoValue.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Suppliers
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {vendors.length} Vendors
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Deliveries
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {orders.filter((o) => o.status === 'ISSUED').length} In Transit
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
            <option value="">All PO Statuses</option>
            <option value="ISSUED">Issued to Supplier</option>
            <option value="RECEIVED">Goods Received</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Orders DataTable */}
      <DataTable<PurchaseOrderDto>
        title="Purchase Orders Registry"
        subtitle="Approved supplier contracts awaiting logistics receipt and stores induction"
        data={orders}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchOrders}
        exportFileName="purchase_orders.csv"
      />

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Generate Supplier Purchase Order"
        subtitle="Direct contract binding hotel procurement with approved external vendor"
        icon={<ShoppingBag className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateOrder}
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
              disabled={submitting || !vendorId}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Issue Purchase Order
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={poNumber}
          label="Purchase Order Number"
          isLoading={isPoLoading}
          onRefresh={refetchPo}
          helperText="Auto-assigned sequentially by Purchase Engine"
        />

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Vendor *
            </label>
            <Select
              value={vendorId}
              onChange={(e) => setVendorId(Number(e.target.value))}
              required
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendorName} ({v.vendorCode} &bull; Net {v.paymentTermsDays}d)
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Expected Delivery Date *"
            type="date"
            required
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="e.g. Net 30 Days"
          />
          <Input
            label="Order Notes / Delivery Dock Instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Deliver to Service Bay #2 before 10 AM"
          />
        </FormGrid>

        {/* Items Section */}
        <div className="space-y-3 pt-2 border-t border-border dark:border-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">PO Item Specifications</span>
            <Button type="button" size="xs" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3 h-3" />}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800/60 p-2.5 rounded-xl border border-border dark:border-navy-700">
                <div className="flex-1">
                  <Input
                    placeholder="Item name / SKU..."
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
                    value={it.quantityOrdered}
                    onChange={(e) => handleItemChange(idx, 'quantityOrdered', Number(e.target.value))}
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
                    placeholder="Unit Price"
                    value={it.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
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
            <span>Subtotal:</span>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              ${calculatedSubtotal.toFixed(2)}
            </span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
