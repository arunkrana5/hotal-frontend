import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  LinenItemDto,
  LaundryOrderDto,
  CreateLaundryOrderItemRequest,
} from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import {
  Layers,
  Shirt,
  Plus,
  RefreshCw,
  Truck,
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const LinenLaundryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LINEN' | 'LAUNDRY'>('LINEN');

  // Linen
  const [linenItems, setLinenItems] = useState<LinenItemDto[]>([]);
  const [linenLoading, setLinenLoading] = useState<boolean>(true);

  // Laundry
  const [orders, setOrders] = useState<LaundryOrderDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [laundryLoading, setLaundryLoading] = useState<boolean>(true);

  // Laundry Order Modal
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [isExpress, setIsExpress] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [orderItems, setOrderItems] = useState<CreateLaundryOrderItemRequest[]>([
    { serviceType: 'WASH_AND_FOLD', garmentName: 'Cotton Dress Shirt', quantity: 2, unitPrice: 8.0, remarks: '' },
  ]);

  const fetchLinen = async () => {
    setLinenLoading(true);
    const res = await api.get<LinenItemDto[]>('/housekeeping/linen');
    if (res.success && res.data) {
      setLinenItems(res.data);
    }
    setLinenLoading(false);
  };

  const fetchLaundryOrders = async () => {
    setLaundryLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    const res = await api.get<PagedResult<LaundryOrderDto>>(`/housekeeping/laundry?${query.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLaundryLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'LINEN') fetchLinen();
    else fetchLaundryOrders();
  }, [activeTab, pageIndex, pageSize]);

  const loadOccupiedRooms = async () => {
    const res = await api.get<PagedResult<RoomDto>>('/pms/rooms?status=OCC&pageSize=50');
    if (res.success && res.data) {
      setRooms(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedRoomId(res.data.items[0].id);
      }
    }
  };

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { serviceType: 'WASH_AND_FOLD', garmentName: '', quantity: 1, unitPrice: 10.0, remarks: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateLaundryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSubmitting(true);

    const res = await api.post('/housekeeping/laundry', {
      roomId: selectedRoomId ? Number(selectedRoomId) : null,
      isExpress,
      specialInstructions,
      items: orderItems,
    });
    setOrderSubmitting(false);

    if (res.success) {
      setShowOrderModal(false);
      setSelectedRoomId('');
      setSpecialInstructions('');
      setOrderItems([{ serviceType: 'WASH_AND_FOLD', garmentName: 'Cotton Dress Shirt', quantity: 2, unitPrice: 8.0, remarks: '' }]);
      await fetchLaundryOrders();
    }
  };

  const handleUpdateLaundryStatus = async (orderId: number, status: string) => {
    const res = await api.put(`/housekeeping/laundry/${orderId}/status`, { status });
    if (res.success) {
      await fetchLaundryOrders();
    }
  };

  const laundryColumns = useMemo<ColumnDef<LaundryOrderDto>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'roomNumber',
        header: 'Room & Guest',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {row.roomNumber ? `Room ${row.roomNumber}` : 'Hotel Staff Linen'}
              </span>
              {row.guestName && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.guestName}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'isExpress',
        header: 'Service Speed',
        cell: (info) => {
          const express = info.getValue() as boolean;
          return express ? (
            <Badge variant="purple" size="sm" dot>Express (4h)</Badge>
          ) : (
            <Badge variant="neutral" size="sm">Standard (24h)</Badge>
          );
        },
      },
      {
        accessorKey: 'totalItemsCount',
        header: 'Total Garments',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as number} Pcs
          </Badge>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Folio Charge',
        cell: (info) => (
          <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Order Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'RECEIVED') return <Badge variant="warning" dot>Received</Badge>;
          if (s === 'PROCESSING' || s === 'IN_WASH') return <Badge variant="brand" dot>In Wash / Ironing</Badge>;
          if (s === 'READY_FOR_DELIVERY') return <Badge variant="purple" dot>Ready</Badge>;
          if (s === 'DELIVERED') return <Badge variant="success">Delivered</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Workflow',
        cell: (info) => {
          const ord = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              {ord.status === 'RECEIVED' && (
                <Button
                  size="xs"
                  onClick={() => handleUpdateLaundryStatus(ord.id, 'PROCESSING')}
                  className="font-semibold text-xs"
                >
                  Process
                </Button>
              )}
              {ord.status === 'PROCESSING' && (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => handleUpdateLaundryStatus(ord.id, 'READY_FOR_DELIVERY')}
                  className="font-semibold text-xs"
                >
                  Ready
                </Button>
              )}
              {ord.status === 'READY_FOR_DELIVERY' && (
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleUpdateLaundryStatus(ord.id, 'DELIVERED')}
                  className="font-semibold text-xs flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" />
                  <span>Deliver</span>
                </Button>
              )}
              {ord.status === 'DELIVERED' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Closed</span>
                </span>
              )}
            </div>
          );
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
          { label: 'Housekeeping', href: '/housekeeping/status' },
          { label: 'Linen & Valet Laundry' },
        ]}
        title="Linen Inventory &amp; Valet Laundry"
        subtitle="Par level stock, laundry circulation, valet pressing, and guest folio billing"
        icon={<Shirt className="w-4 h-4" />}
        badge={<Badge variant="teal">Housekeeping</Badge>}
        actions={
          <PageActions>
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('LINEN')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === 'LINEN'
                    ? 'bg-surface dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Linen Par Inventory
              </button>
              <button
                onClick={() => setActiveTab('LAUNDRY')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === 'LAUNDRY'
                    ? 'bg-surface dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Guest Valet Orders
              </button>
            </div>

            {activeTab === 'LAUNDRY' && (
              <Button
                size="sm"
                onClick={() => {
                  loadOccupiedRooms();
                  setShowOrderModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Valet Order
              </Button>
            )}
          </PageActions>
        }
      />

      {/* Linen Inventory View */}
      {activeTab === 'LINEN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Linen Items
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {linenItems.length} SKUs
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Clean &amp; Circulating
                </div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {linenItems.reduce((acc, i) => acc + (i.cleanStock || 0), 0)} Pcs
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  In Commercial Laundry
                </div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                  {linenItems.reduce((acc, i) => acc + (i.inLaundryStock || 0), 0)} Pcs
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Target Par Level
                </div>
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
                  3.5x Total Occupancy
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border dark:border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Linen Master &amp; Circulating Par Stock
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Par balance across linen chutes, guest rooms, and external commercial laundry
                </p>
              </div>
              <Button size="xs" variant="secondary" onClick={fetchLinen} className="font-semibold flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${linenLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3">Item Code</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Target Par</th>
                    <th className="px-4 py-3 text-right">Clean in Stores</th>
                    <th className="px-4 py-3 text-right">In Rooms</th>
                    <th className="px-4 py-3 text-right">Dirty / In Wash</th>
                    <th className="px-4 py-3 text-right">Total Inventory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                  {linenItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" size="sm">{item.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {item.parLevel}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.cleanStock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {item.inUseStock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                        {item.inLaundryStock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.cleanStock + item.inUseStock + item.inLaundryStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Guest Laundry Orders View */}
      {activeTab === 'LAUNDRY' && (
        <DataTable<LaundryOrderDto>
          title="Guest Valet Laundry &amp; Dry Cleaning Orders"
          subtitle="Real-time valet manifests linked with guest room folios"
          data={orders}
          columns={laundryColumns}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          isLoading={laundryLoading}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onRefresh={fetchLaundryOrders}
          exportFileName="valet_laundry_orders.csv"
        />
      )}

      {/* New Laundry Order Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Create Guest Valet Laundry Ticket"
        subtitle="Garment line items will be auto-posted to the guest's active PMS folio"
        icon={<Shirt className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateLaundryOrder}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOrderModal(false)}
              disabled={orderSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={orderSubmitting}
              isLoading={orderSubmitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Submit Laundry Order
            </Button>
          </>
        }
      >
        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Guest Room
            </label>
            <Select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            >
              <option value="">Hotel Internal Housekeeping</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} (Floor {r.floorNumber})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isExpress}
                onChange={(e) => setIsExpress(e.target.checked)}
                className="rounded border-slate-300 text-brand-indigo focus:ring-brand-indigo"
              />
              <span>Express 4-Hour Service (+50% Surcharge)</span>
            </label>
          </div>
        </FormGrid>

        {/* Garment Line Items */}
        <div className="space-y-3 pt-2 border-t border-border dark:border-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Garments &amp; Services</span>
            <Button type="button" size="xs" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3 h-3" />}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800/60 p-2.5 rounded-xl border border-border dark:border-navy-700">
                <div className="flex-1">
                  <Input
                    placeholder="Garment name..."
                    value={item.garmentName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOrderItems((prev) => prev.map((p, i) => (i === idx ? { ...p, garmentName: val } : p)));
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOrderItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: val } : p)));
                    }}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOrderItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: val } : p)));
                    }}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                {orderItems.length > 1 && (
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
        </div>

        <div>
          <Textarea
            label="Special Instructions"
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Heavy starch on shirt collars; delicate silk wash for blouse..."
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
