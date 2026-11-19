import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  InventoryItemDto,
  CreateInventoryItemRequest,
  RecordStockTransactionRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowDownUp,
  MapPin,
  X,
  CheckCircle2,
  DollarSign,
  PackageCheck,
} from 'lucide-react';

export const InventoryItemsScreen: React.FC = () => {
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Item Form
  const [newItem, setNewItem] = useState<CreateInventoryItemRequest>({
    itemCode: '',
    itemName: '',
    category: 'LINEN',
    unitOfMeasure: 'PCS',
    unitCost: 10,
    currentStock: 50,
    reorderLevel: 20,
    minimumStock: 10,
    maximumStock: 200,
    locationBin: 'BIN-01',
  });

  // Adjust Form
  const [adjustData, setAdjustData] = useState<{
    type: string;
    qty: number;
    department: string;
    notes: string;
  }>({
    type: 'RECEIPT',
    qty: 10,
    department: 'HK',
    notes: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search) query.append('search', search);
    if (categoryFilter) query.append('category', categoryFilter);
    if (lowStockOnly) query.append('lowStockOnly', 'true');

    const res = await api.get<PagedResult<InventoryItemDto>>(`/inventory/items?${query.toString()}`);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [pageIndex, pageSize, search, categoryFilter, lowStockOnly]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<InventoryItemDto>('/inventory/items', newItem);
    if (res.success) {
      setShowCreateModal(false);
      setNewItem({
        itemCode: '',
        itemName: '',
        category: 'LINEN',
        unitOfMeasure: 'PCS',
        unitCost: 10,
        currentStock: 50,
        reorderLevel: 20,
        minimumStock: 10,
        maximumStock: 200,
        locationBin: 'BIN-01',
      });
      fetchItems();
    }
    setSubmitting(false);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);

    const req: RecordStockTransactionRequest = {
      inventoryItemId: selectedItem.id,
      transactionType: adjustData.type,
      quantity: adjustData.qty,
      unitCost: selectedItem.unitCost,
      departmentCode: adjustData.department,
      notes: adjustData.notes,
    };

    const res = await api.post('/inventory/transactions', req);
    if (res.success) {
      setShowAdjustModal(false);
      setSelectedItem(null);
      fetchItems();
    }
    setSubmitting(false);
  };

  const openAdjust = (item: InventoryItemDto) => {
    setSelectedItem(item);
    setAdjustData({
      type: 'RECEIPT',
      qty: 10,
      department: 'HK',
      notes: 'Standard stock adjustment',
    });
    setShowAdjustModal(true);
  };

  const totalValuation = items.reduce((sum, i) => sum + (i.currentStock * i.unitCost || 0), 0);
  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;

  const columns = useMemo<ColumnDef<InventoryItemDto>[]>(
    () => [
      {
        accessorKey: 'itemCode',
        header: 'SKU / Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'itemName',
        header: 'Item Description',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Bin: {info.row.original.locationBin || 'Central Stores'}</span>
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
        accessorKey: 'currentStock',
        header: 'Stock On-Hand',
        cell: (info) => {
          const item = info.row.original;
          const isLow = item.currentStock <= item.reorderLevel;
          return (
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold text-xs ${isLow ? 'text-danger' : 'text-slate-900 dark:text-white'}`}>
                  {item.currentStock} {item.unitOfMeasure}
                </span>
                {isLow && (
                  <Badge variant="danger" size="sm" dot>Low Stock</Badge>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Reorder @ {item.reorderLevel}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'unitCost',
        header: 'Unit Cost',
        cell: (info) => (
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'totalValue',
        header: 'Inventory Value',
        cell: (info) => {
          const item = info.row.original;
          const val = item.currentStock * item.unitCost;
          return (
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              ${val.toFixed(2)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Stock Action',
        cell: (info) => (
          <Button
            size="xs"
            variant="outline"
            onClick={() => openAdjust(info.row.original)}
            className="font-semibold text-xs flex items-center gap-1"
          >
            <ArrowDownUp className="w-3 h-3" />
            <span>Adjust / Issue</span>
          </Button>
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
          { label: 'Inventory', href: '/inventory/items' },
          { label: 'Stock Items' },
        ]}
        title="Stores & Inventory Management"
        subtitle="Central stores stock balance, bin location tracking, par replenishment & valuation ledgers"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Inventory Item
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total SKUs Tracked
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} SKUs
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Low Stock Warnings
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {lowStockCount} Items
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stores Valuation
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalValuation.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stores Reorder Engine
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              Automated Indent Gen
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Item Categories</option>
            <option value="LINEN">Linen &amp; Towels</option>
            <option value="FB">Food &amp; Beverage</option>
            <option value="CLEANING">Cleaning &amp; Chemicals</option>
            <option value="AMENITIES">Room Amenities</option>
            <option value="MAINTENANCE">Engineering Parts</option>
          </Select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPageIndex(0);
            }}
            className="rounded border-slate-300 text-brand-indigo focus:ring-brand-indigo"
          />
          <span>Show Below Reorder Level Only</span>
        </label>
      </div>

      {/* Inventory DataTable */}
      <DataTable<InventoryItemDto>
        title="Central Stores Stock Manifest"
        subtitle="Physical perpetual inventory with minimum par levels and bin coordinates"
        data={items}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSearchChange={(s) => {
          setSearch(s);
          setPageIndex(0);
        }}
        onRefresh={fetchItems}
        searchPlaceholder="Filter items by SKU, name, or bin..."
        exportFileName="inventory_stock.csv"
      />

      {/* Add Item Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Stores Inventory SKU"
        subtitle="Define item specifications, reorder triggers, and stores bin location"
        icon={<Boxes className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateItem}
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
              disabled={submitting || !newItem.itemCode || !newItem.itemName}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Inventory SKU
            </Button>
          </>
        }
      >
        <FormGrid cols={2}>
          <Input
            label="SKU / Item Code *"
            required
            value={newItem.itemCode}
            onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
            placeholder="e.g. AMN-SHMP-50ML"
            className="font-mono uppercase"
          />
          <Input
            label="Item Name *"
            required
            value={newItem.itemName}
            onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
            placeholder="e.g. Organic Bergamot Shampoo 50ml"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <Select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              <option value="LINEN">Linen &amp; Towels</option>
              <option value="FB">Food &amp; Beverage</option>
              <option value="CLEANING">Cleaning &amp; Housekeeping</option>
              <option value="AMENITIES">Guest Room Amenities</option>
              <option value="MAINTENANCE">Engineering Maintenance</option>
            </Select>
          </div>

          <Input
            label="Unit of Measure"
            value={newItem.unitOfMeasure}
            onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
            placeholder="PCS / BTL / KG"
            className="font-mono"
          />

          <Input
            label="Unit Cost ($) *"
            type="number"
            step="0.01"
            required
            value={newItem.unitCost}
            onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Current Opening Stock"
            type="number"
            value={newItem.currentStock}
            onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
            className="font-mono"
          />
          <Input
            label="Reorder Trigger Level *"
            type="number"
            required
            value={newItem.reorderLevel}
            onChange={(e) => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })}
            className="font-mono"
          />
          <Input
            label="Location Bin / Shelf"
            value={newItem.locationBin}
            onChange={(e) => setNewItem({ ...newItem, locationBin: e.target.value })}
            placeholder="e.g. AISLE-2-BIN-04"
          />
        </FormGrid>
      </Modal>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title="Adjust Stock / Issue To Department"
          subtitle={`${selectedItem.itemName} (${selectedItem.itemCode})`}
          icon={<ArrowDownUp className="w-4 h-4" />}
          size="md"
          onSubmit={handleAdjustStock}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || adjustData.qty <= 0}
                isLoading={submitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Record Transaction
              </Button>
            </>
          }
        >
          <FormGrid cols={2}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transaction Type
              </label>
              <Select
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              >
                <option value="ISSUE">Issue to Department (-)</option>
                <option value="RECEIPT">Stock Receipt / GRN (+)</option>
                <option value="AUDIT_ADJUST">Physical Audit Correction</option>
                <option value="DAMAGE">Damaged / Expired Write-Off</option>
              </Select>
            </div>

            <Input
              label={`Quantity (${selectedItem.unitOfMeasure}) *`}
              type="number"
              min="1"
              required
              value={adjustData.qty}
              onChange={(e) => setAdjustData({ ...adjustData, qty: Number(e.target.value) })}
              className="font-mono"
            />
          </FormGrid>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Receiving / Charging Department
            </label>
            <Select
              value={adjustData.department}
              onChange={(e) => setAdjustData({ ...adjustData, department: e.target.value })}
            >
              <option value="HK">Housekeeping &amp; Laundry</option>
              <option value="FB">Food &amp; Beverage</option>
              <option value="FO">Front Office</option>
              <option value="MAINT">Maintenance &amp; Engineering</option>
              <option value="SPA">Spa &amp; Wellness</option>
            </Select>
          </div>

          <div>
            <Textarea
              label="Transaction Remarks / Storekeeper Voucher #"
              rows={2}
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              placeholder="e.g. Issued for floor 2 linen replenishment..."
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
