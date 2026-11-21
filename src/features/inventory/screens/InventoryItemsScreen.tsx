import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  InventoryItemDto,
  CreateInventoryItemRequest,
  RecordStockTransactionRequest,
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
import {
  Boxes,
  Plus,
  ArrowDownUp,
  MapPin,
  Download,
  AlertCircle,
  Package,
} from 'lucide-react';

export const InventoryItemsScreen: React.FC = () => {
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [categoryTab, setCategoryTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDto | null>(null);
  const [showAdjustDrawer, setShowAdjustDrawer] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Form State
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

  // Adjust Form State
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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (categoryTab !== 'ALL' && categoryTab !== 'LOW_STOCK') query.append('category', categoryTab);

    const res = await api.get<PagedResult<InventoryItemDto>>(`/inventory/items?${query.toString()}`);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, categoryTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
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
    setErrorMsg(null);
    setShowCreateDrawer(true);
  };

  const handleOpenEdit = (item: InventoryItemDto) => {
    setEditingItem(item);
    setNewItem({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: item.unitCost,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      locationBin: item.locationBin || '',
    });
    setErrorMsg(null);
    setShowCreateDrawer(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemCode.trim() || !newItem.itemName.trim()) {
      setErrorMsg('Item code and item name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    if (editingItem) {
      const res = await api.put<InventoryItemDto>(`/inventory/items/${editingItem.id}`, {
        itemName: newItem.itemName.trim(),
        category: newItem.category.trim().toUpperCase(),
        unitOfMeasure: newItem.unitOfMeasure.trim().toUpperCase(),
        unitCost: Number(newItem.unitCost),
        reorderLevel: Number(newItem.reorderLevel),
        minimumStock: Number(newItem.minimumStock),
        maximumStock: Number(newItem.maximumStock),
        locationBin: newItem.locationBin?.trim() || null,
      });

      if (res.success) {
        setShowCreateDrawer(false);
        setEditingItem(null);
        fetchItems();
      } else {
        setErrorMsg(res.message || 'Failed to update inventory item.');
      }
    } else {
      const res = await api.post<InventoryItemDto>('/inventory/items', newItem);
      if (res.success) {
        setShowCreateDrawer(false);
        fetchItems();
      } else {
        setErrorMsg(res.message || 'Failed to create item.');
      }
    }
    setSubmitting(false);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || adjustData.qty <= 0) return;

    setSubmitting(true);
    setErrorMsg(null);
    const req: RecordStockTransactionRequest = {
      inventoryItemId: selectedItem.id,
      transactionType: adjustData.type,
      quantity: Number(adjustData.qty),
      unitCost: selectedItem.unitCost,
      departmentCode: adjustData.department,
      notes: adjustData.notes,
    };

    const res = await api.post('/inventory/transactions', req);
    if (res.success) {
      setShowAdjustDrawer(false);
      setSelectedItem(null);
      fetchItems();
    } else {
      setErrorMsg(res.message || 'Stock adjustment failed.');
    }
    setSubmitting(false);
  };

  const filteredItems = useMemo(() => {
    if (categoryTab === 'LOW_STOCK') {
      return items.filter((i) => i.currentStock <= i.reorderLevel);
    }
    return items;
  }, [items, categoryTab]);

  const columns: ColumnDef<InventoryItemDto>[] = useMemo(
    () => [
      {
        accessorKey: 'itemCode',
        header: 'SKU Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'itemName',
        header: 'Item Specification',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
              {info.getValue() as string}
            </span>
            <span className="text-[11px] text-brand-muted shrink-0">
              ({info.row.original.category} • {info.row.original.unitOfMeasure})
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'locationBin',
        header: 'Storage Bin',
        cell: (info) => (
          <div className="flex items-center space-x-1 text-xs font-mono text-brand-muted">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{info.getValue() as string || 'CENTRAL'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'currentStock',
        header: 'Stock / Reorder',
        cell: ({ row }) => {
          const current = row.original.currentStock;
          const reorder = row.original.reorderLevel;
          const isLow = current <= reorder;

          return (
            <div className="text-xs font-mono">
              <span className={`font-bold ${isLow ? 'text-[#D44848] dark:text-[#F07878]' : 'text-brand-text'}`}>
                {current}
              </span>
              <span className="text-brand-muted text-[11px]"> / Par {reorder}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'unitCost',
        header: 'Unit Cost',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-muted">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'totalValue',
        header: 'Total Value',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(row.original.currentStock * row.original.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Stock Health',
        cell: ({ row }) => {
          const isLow = row.original.currentStock <= row.original.reorderLevel;
          return isLow ? (
            <StatusBadge status="WARNING" label="Low Stock Alert" />
          ) : (
            <StatusBadge status="AVAILABLE" label="In Stock" />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedItem(row.original)}
            onEdit={() => handleOpenEdit(row.original)}
            customActions={[
              {
                label: 'Adjust Stock',
                icon: <ArrowDownUp className="w-3.5 h-3.5 text-brand-primary" />,
                onClick: () => {
                  setSelectedItem(row.original);
                  setShowAdjustDrawer(true);
                },
              },
            ]}
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
        title="Inventory & Stock Registry"
        badge={<StatusBadge status="ACTIVE" label="Central Stores" />}
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
              onClick={handleOpenCreate}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Stock SKU
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={categoryTab}
        onChange={setCategoryTab}
        tabs={[
          { id: 'ALL', label: 'All Items', count: totalCount },
          { id: 'LOW_STOCK', label: 'Low Stock Alerts' },
          { id: 'LINEN', label: 'Linen & Housekeeping' },
          { id: 'FB', label: 'F&B Raw Materials' },
          { id: 'MAINTENANCE', label: 'Engineering Spares' },
        ]}
      />

      {/* 3. Data Table with Unified Top Toolbar */}
      <DataTable
        data={filteredItems}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search SKU code, name, storage bin..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="inventory_items.csv"
      />

      {/* 5. Create / Edit SKU Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => {
          setShowCreateDrawer(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        title={editingItem ? `Edit SKU #${editingItem.itemCode}` : 'Register New Inventory Item'}
        submitText={submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="SKU Identification" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Item Code *
            </label>
            <input
              type="text"
              required
              disabled={!!editingItem}
              placeholder="e.g. LN-BATH-TOWEL-01"
              value={newItem.itemCode}
              onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value.toUpperCase() })}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Premium White Bath Towel"
              value={newItem.itemName}
              onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="Inventory Category"
              required
              size="sm"
              value={newItem.category}
              onChange={(val) => setNewItem({ ...newItem, category: val || 'LINEN' })}
              options={[
                { value: 'LINEN', label: 'Linen & Housekeeping', badge: 'LIN' },
                { value: 'FB', label: 'Food & Beverage', badge: 'FB' },
                { value: 'MAINTENANCE', label: 'Engineering Spares', badge: 'ENG' },
                { value: 'OFFICE', label: 'Office Stationery', badge: 'OFF' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Storage Bin Location
            </label>
            <input
              type="text"
              placeholder="e.g. RACK-B-04"
              value={newItem.locationBin || ''}
              onChange={(e) => setNewItem({ ...newItem, locationBin: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Stock & Valuation Parameters" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Unit Cost ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newItem.unitCost}
              onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Reorder Par Level *
            </label>
            <input
              type="number"
              min="1"
              required
              value={newItem.reorderLevel}
              onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value) || 10 })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Unit of Measure
            </label>
            <input
              type="text"
              placeholder="e.g. PCS, BOX, KG, LTR"
              value={newItem.unitOfMeasure}
              onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          {!editingItem && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Initial Stock Qty *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newItem.currentStock}
                onChange={(e) => setNewItem({ ...newItem, currentStock: parseInt(e.target.value) || 0 })}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          )}
        </FormSection>
      </FormDrawer>

      {/* 6. Adjust Stock Drawer */}
      {selectedItem && showAdjustDrawer && (
        <FormDrawer
          isOpen={showAdjustDrawer}
          onClose={() => setShowAdjustDrawer(false)}
          onSubmit={handleAdjustStock}
          title={`Adjust Stock: ${selectedItem.itemName}`}
          subtitle={`Current Stock: ${selectedItem.currentStock} ${selectedItem.unitOfMeasure} | Code: ${selectedItem.itemCode}`}
          submitText={submitting ? 'Recording...' : 'Post Adjustment'}
          isLoading={submitting}
          width="md"
        >
          <FormSection title="Movement Parameters" description="Receipt or issue transaction">
            <div>
              <UniversalSelect
                label="Transaction Type"
                required
                size="sm"
                value={adjustData.type}
                onChange={(val) => setAdjustData({ ...adjustData, type: val || 'RECEIPT' })}
                options={[
                  { value: 'RECEIPT', label: 'Goods Receipt (Stock In +)', badge: 'IN' },
                  { value: 'ISSUE', label: 'Department Issue (Stock Out -)', badge: 'OUT' },
                  { value: 'ADJUSTMENT', label: 'Audit Correction / Spoilage', badge: 'ADJ' },
                ]}
                clearable={false}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustData.qty}
                onChange={(e) => setAdjustData({ ...adjustData, qty: parseInt(e.target.value) || 1 })}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Department Code / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. HK-FLOOR-2 / Monthly Physical Count"
                value={adjustData.notes}
                onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          </FormSection>
        </FormDrawer>
      )}

      {/* 7. Detail Drawer */}
      {selectedItem && !showAdjustDrawer && (
        <DetailDrawer
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.itemName}
          subtitle={`SKU #${selectedItem.itemCode}`}
          status={selectedItem.currentStock <= selectedItem.reorderLevel ? 'WARNING' : 'AVAILABLE'}
          width="md"
          onEdit={() => {
            const item = selectedItem;
            setSelectedItem(null);
            handleOpenEdit(item);
          }}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Current Stock</span>
                <span className="font-mono font-bold text-base text-brand-text">
                  {selectedItem.currentStock} {selectedItem.unitOfMeasure}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Reorder Par Level</span>
                <span className="font-mono text-brand-text">{selectedItem.reorderLevel}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Unit Cost</span>
                <span className="font-mono text-brand-text">${selectedItem.unitCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Total Valuation</span>
                <span className="font-mono font-bold text-sm text-[#16845B] dark:text-[#45C79A]">
                  ${(selectedItem.currentStock * selectedItem.unitCost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
