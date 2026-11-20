import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  LinenItemDto,
  LaundryOrderDto,
  CreateLaundryOrderItemRequest,
} from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
  FinancialSummary,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import {
  Shirt,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Truck,
  Download,
  AlertCircle,
  DoorOpen,
} from 'lucide-react';

export const LinenLaundryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LINEN' | 'LAUNDRY'>('LINEN');

  // Linen State
  const [linenItems, setLinenItems] = useState<LinenItemDto[]>([]);
  const [linenLoading, setLinenLoading] = useState<boolean>(true);

  // Laundry Orders State
  const [orders, setOrders] = useState<LaundryOrderDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [laundryLoading, setLaundryLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modals & Drawers
  const [showOrderDrawer, setShowOrderDrawer] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrderDto | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [isExpress, setIsExpress] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [orderItems, setOrderItems] = useState<CreateLaundryOrderItemRequest[]>([
    { serviceType: 'WASH_AND_FOLD', garmentName: 'Cotton Dress Shirt', quantity: 2, unitPrice: 8.0, remarks: '' },
  ]);

  const fetchLinen = useCallback(async () => {
    setLinenLoading(true);
    const res = await api.get<LinenItemDto[]>('/housekeeping/linen');
    if (res.success && res.data) {
      setLinenItems(res.data);
    }
    setLinenLoading(false);
  }, []);

  const fetchLaundryOrders = useCallback(async () => {
    setLaundryLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());

    const res = await api.get<PagedResult<LaundryOrderDto>>(`/housekeeping/laundry?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLaundryLoading(false);
  }, [pageIndex, pageSize, search]);

  useEffect(() => {
    if (activeTab === 'LINEN') fetchLinen();
    else fetchLaundryOrders();
  }, [activeTab, fetchLinen, fetchLaundryOrders]);

  const loadRooms = async () => {
    const res = await api.get<PagedResult<RoomDto>>('/pms/rooms?status=OCC&pageSize=50');
    if (res.success && res.data) {
      setRooms(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedRoomId(res.data.items[0].id);
      }
    }
  };

  const handleOpenOrderDrawer = () => {
    loadRooms();
    setShowOrderDrawer(true);
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { serviceType: 'DRY_CLEAN', garmentName: 'Wool Trousers', quantity: 1, unitPrice: 12.0, remarks: '' },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof CreateLaundryOrderItemRequest, val: any) => {
    const updated = [...orderItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setOrderItems(updated);
  };

  const totalOrderAmount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [orderItems]
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    setOrderSubmitting(true);
    const payload = {
      roomId: Number(selectedRoomId),
      isExpress,
      specialInstructions,
      items: orderItems,
    };

    const res = await api.post('/housekeeping/laundry', payload);
    if (res.success) {
      setShowOrderDrawer(false);
      fetchLaundryOrders();
    }
    setOrderSubmitting(false);
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    const res = await api.put(`/housekeeping/laundry/${orderId}/status`, { status });
    if (res.success) {
      fetchLaundryOrders();
    }
  };

  // Linen Columns
  const linenColumns: ColumnDef<LinenItemDto>[] = useMemo(
    () => [
      {
        accessorKey: 'itemName',
        header: 'Linen Item',
        cell: (info) => (
          <div className="font-semibold text-slate-900 dark:text-white text-xs">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Classification',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'totalStock',
        header: 'Total Par',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'cleanStock',
        header: 'Available Clean',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-[#16845B] dark:text-[#45C79A]">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'soiledStock',
        header: 'Soiled / Wash',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-[#C78B24] dark:text-[#E7B65A]">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'inLaundryStock',
        header: 'At Commercial Laundry',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        id: 'parAlert',
        header: 'Par Status',
        cell: ({ row }) => {
          const isLow = row.original.cleanStock < row.original.parLevel;
          return isLow ? (
            <StatusBadge status="WARNING" label="Low Par Alert" />
          ) : (
            <StatusBadge status="CLEAN" label="Nominal" />
          );
        },
      },
    ],
    []
  );

  // Laundry Orders Columns
  const laundryColumns: ColumnDef<LaundryOrderDto>[] = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: (info) => (
          <div className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'roomNumber',
        header: 'Guest Room',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-brand-text">#{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'guestName',
        header: 'Guest Name',
        cell: (info) => (
          <div className="font-semibold text-slate-900 dark:text-white text-xs">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Charge ($)',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'isExpress',
        header: 'Service Speed',
        cell: (info) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${info.getValue() ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            {info.getValue() ? 'Express 4-Hr' : 'Standard 24-Hr'}
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
          <div className="flex items-center space-x-2">
            {row.original.status === 'RECEIVED' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateOrderStatus(row.original.id, 'WASHING')}
                className="text-[11px] h-7"
              >
                Start Wash
              </Button>
            )}

            {row.original.status === 'WASHING' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateOrderStatus(row.original.id, 'READY')}
                className="text-[11px] h-7 text-[#16845B]"
              >
                Ready
              </Button>
            )}

            {row.original.status === 'READY' && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleUpdateOrderStatus(row.original.id, 'DELIVERED')}
                className="text-[11px] h-7"
              >
                Deliver
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
        title="Linen & Laundry Operations"
        badge={<StatusBadge status="ACTIVE" label="Housekeeping Facilities" />}
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
              onClick={handleOpenOrderDrawer}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Guest Laundry Ticket
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'LINEN', label: 'Hotel Linen Inventory', count: linenItems.length, icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'LAUNDRY', label: 'Guest Laundry Orders', count: totalCount, icon: <Shirt className="w-3.5 h-3.5" /> },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder={activeTab === 'LINEN' ? 'Filter linen items...' : 'Search laundry order #, room #...'}
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
      />

      {/* 4. Main Table */}
      {activeTab === 'LINEN' ? (
        <DataTable
          data={linenItems}
          columns={linenColumns}
          totalCount={linenItems.length}
          pageIndex={0}
          pageSize={50}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          isLoading={linenLoading}
          enableSearch={false}
          enableExport={true}
        />
      ) : (
        <DataTable
          data={orders}
          columns={laundryColumns}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          isLoading={laundryLoading}
          enableSearch={false}
          enableExport={true}
        />
      )}

      {/* 5. Create Guest Laundry Order Drawer */}
      <FormDrawer
        isOpen={showOrderDrawer}
        onClose={() => setShowOrderDrawer(false)}
        onSubmit={handleCreateOrder}
        title="New Guest Laundry Order"
        subtitle="Collect and register guest garment laundering ticket"
        submitText={orderSubmitting ? 'Creating...' : 'Register Ticket'}
        isLoading={orderSubmitting}
        width="lg"
      >
        <FormSection title="Room Assignment" description="Occupied room and priority">
          <div>
            <UniversalSelect
              label="Guest Room"
              required
              size="sm"
              value={selectedRoomId}
              onChange={(val) => setSelectedRoomId(Number(val))}
              options={rooms.map((r) => ({
                value: r.id,
                label: `Room #${r.roomNumber} - ${r.roomTypeCode} (Occupied)`,
                badge: r.roomTypeCode,
              }))}
              placeholder="Select guest room..."
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Express Delivery (+50% fee)
            </label>
            <div className="flex items-center space-x-2 h-8">
              <input
                type="checkbox"
                checked={isExpress}
                onChange={(e) => setIsExpress(e.target.checked)}
                className="rounded border-slate-300 text-brand-primary h-4 w-4"
              />
              <span className="text-xs text-brand-text font-medium">Rush 4-Hour Service</span>
            </div>
          </div>
        </FormSection>

        {/* Garment Items Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Garments &amp; Services
            </h4>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddItem}
              className="text-[11px]"
              leftIcon={<Plus className="w-3 h-3" />}
            >
              Add Garment
            </Button>
          </div>

          <div className="space-y-2">
            {orderItems.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface grid grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="Garment Name (e.g. Silk Shirt)"
                    value={item.garmentName}
                    onChange={(e) => handleItemChange(idx, 'garmentName', e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <UniversalSelect
                    size="sm"
                    value={item.serviceType}
                    onChange={(val) => handleItemChange(idx, 'serviceType', val || 'WASH_AND_FOLD')}
                    options={[
                      { value: 'WASH_AND_FOLD', label: 'Wash & Fold' },
                      { value: 'DRY_CLEAN', label: 'Dry Clean' },
                      { value: 'PRESS_ONLY', label: 'Press Only' },
                    ]}
                    clearable={false}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full h-7 px-1.5 text-xs text-center font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-brand-text focus:outline-none"
                  />
                </div>

                <div className="col-span-2 text-right flex items-center justify-end space-x-1">
                  <span className="font-mono font-bold text-xs">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  {orderItems.length > 1 && (
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
          subtotal={totalOrderAmount}
          grandTotal={totalOrderAmount * (isExpress ? 1.5 : 1)}
          balanceDue={totalOrderAmount * (isExpress ? 1.5 : 1)}
        />
      </FormDrawer>

      {/* 6. Order Detail Drawer */}
      {selectedOrder && (
        <DetailDrawer
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Laundry Ticket #${selectedOrder.orderNumber}`}
          subtitle={`Room #${selectedOrder.roomNumber} &bull; Guest: ${selectedOrder.guestName}`}
          status={selectedOrder.status}
          width="md"
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
