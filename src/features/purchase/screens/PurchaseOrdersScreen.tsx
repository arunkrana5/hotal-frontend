import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  PurchaseOrderDto,
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderItemRequest,
  VendorDto,
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
  FinancialSummary,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Printer,
  Truck,
  Download,
  AlertCircle,
  Building,
} from 'lucide-react';

export const PurchaseOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDto | null>(null);
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
    { itemName: 'Bedding Sets (300 Thread Count)', quantityOrdered: 20, unit: 'SET', unitPrice: 45 },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab !== 'ALL') query.append('status', activeTab);
    if (vendorFilter !== 'ALL') query.append('vendorId', vendorFilter);

    const res = await api.get<PagedResult<PurchaseOrderDto>>(`/purchase/orders?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab, vendorFilter]);

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
  }, [fetchOrders]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemName: '', quantityOrdered: 10, unit: 'PCS', unitPrice: 15 },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof CreatePurchaseOrderItemRequest, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const totalPoAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantityOrdered * item.unitPrice, 0),
    [items]
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;

    setSubmitting(true);
    setErrorMsg(null);
    const payload: CreatePurchaseOrderRequest = {
      vendorId: Number(vendorId),
      orderDate,
      expectedDeliveryDate,
      paymentTerms,
      notes,
      items,
    };

    const res = await api.post<PurchaseOrderDto>('/purchase/orders', payload);
    if (res.success) {
      setShowCreateDrawer(false);
      refetchPo();
      fetchOrders();
    } else {
      setErrorMsg(res.message || 'Failed to create purchase order.');
    }
    setSubmitting(false);
  };

  const columns: ColumnDef<PurchaseOrderDto>[] = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'PO #',
        cell: (info) => (
          <div className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'vendorName',
        header: 'Supplier / Vendor',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
              {info.getValue() as string}
            </span>
            <span className="text-[11px] text-brand-muted font-mono shrink-0">
              ({info.row.original.paymentTerms || 'Net 30'})
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: 'Order Schedule',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-text truncate">
            {new Date(info.getValue() as string).toLocaleDateString()}
            {info.row.original.expectedDeliveryDate ? ` → Exp: ${new Date(info.row.original.expectedDeliveryDate).toLocaleDateString()}` : ''}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total Order Value',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
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
          <RowActions
            onView={() => setSelectedOrder(row.original)}
            onPrint={() => {}}
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
        title="Purchase Orders"
        badge={<StatusBadge status="ACTIVE" label="Procurement Hub" />}
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
              Issue Purchase Order
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Purchase Orders', count: totalCount },
          { id: 'ISSUED', label: 'Issued / Open' },
          { id: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
          { id: 'COMPLETED', label: 'Fulfilled' },
          { id: 'CANCELLED', label: 'Cancelled' },
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
        searchPlaceholder="Search PO #, supplier name..."
        filters={[
          {
            id: 'vendor',
            label: 'Vendor',
            value: vendorFilter,
            options: [
              { label: 'All Suppliers', value: 'ALL' },
              ...vendors.map((v) => ({ label: v.vendorName, value: v.id.toString() })),
            ],
            onChange: setVendorFilter,
            width: 'w-48',
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setVendorFilter('ALL');
        }}
        isFiltered={search !== '' || vendorFilter !== 'ALL'}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="purchase_orders.csv"
      />

      {/* 5. Create PO Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateOrder}
        title="Issue Purchase Order"
        subtitle="Generate binding vendor procurement order with itemized lines"
        submitText={submitting ? 'Generating...' : 'Issue Order'}
        isLoading={submitting}
        width="xl"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Supplier & Order Details" description="Select vendor and payment terms">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              PO Number (Read-Only)
            </label>
            <input
              type="text"
              readOnly
              value={poNumber || 'Generating...'}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-primary dark:text-[#8495FF]"
            />
          </div>

          <div>
            <UniversalSelect
              label="Approved Supplier"
              required
              size="sm"
              value={vendorId}
              onChange={(val) => setVendorId(Number(val))}
              masterType="VENDOR"
              options={vendors.map((v) => ({
                value: v.id,
                label: `${v.vendorName} (${v.vendorCode})`,
                badge: v.vendorCode,
              }))}
              placeholder="Search or select vendor..."
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Order Date
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Expected Delivery
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        {/* PO Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Procurement Items
            </h4>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddItem}
              className="text-[11px]"
              leftIcon={<Plus className="w-3 h-3" />}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface grid grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="Item / Specification"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantityOrdered}
                    onChange={(e) => handleItemChange(idx, 'quantityOrdered', parseInt(e.target.value) || 1)}
                    className="w-full h-7 px-1.5 text-xs text-center font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full h-7 px-1.5 text-xs text-center font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full h-7 px-1.5 text-xs text-right font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-1 text-right">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-slate-400 hover:text-[#D44848]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <FinancialSummary
          subtotal={totalPoAmount}
          grandTotal={totalPoAmount}
          balanceDue={totalPoAmount}
        />
      </FormDrawer>

      {/* 6. Order Detail Drawer */}
      {selectedOrder && (
        <DetailDrawer
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Purchase Order #${selectedOrder.orderNumber}`}
          subtitle={`Vendor: ${selectedOrder.vendorName}`}
          status={selectedOrder.status}
          width="lg"
        >
          <FinancialSummary
            subtotal={selectedOrder.totalAmount}
            grandTotal={selectedOrder.totalAmount}
            balanceDue={selectedOrder.totalAmount}
          />
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
