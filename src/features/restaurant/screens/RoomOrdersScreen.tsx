import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge, PageTabs, DetailDrawer } from '@/components/enterprise';
import {
  guestOrderApi,
  StaffRoomOrderDto,
  StaffUpdateRoomOrderStatusRequest,
} from '@/services/guestOrderApi';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChefHat,
  Receipt,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  Eye,
  XCircle,
  BedDouble,
  DollarSign,
} from 'lucide-react';

export const RoomOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<StaffRoomOrderDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<StaffRoomOrderDto | null>(null);
  const [deliveryStaff, setDeliveryStaff] = useState<string>('');
  const [estimatedMins, setEstimatedMins] = useState<number>(30);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await guestOrderApi.getRoomOrders(page, pageSize, activeTab);
    if (res.success && res.data) {
      setOrders(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    }
    setLoading(false);
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000); // 20s live auto-refresh
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Handle Order Status Change
  const handleUpdateStatus = async (orderId: number, status: string) => {
    setUpdating(true);
    const req: StaffUpdateRoomOrderStatusRequest = {
      status,
      estimatedDeliveryMinutes: estimatedMins,
      deliveryStaffName: deliveryStaff.trim() || undefined,
    };

    const res = await guestOrderApi.updateRoomOrderStatus(orderId, req);
    setUpdating(false);

    if (res.success && res.data) {
      toast.success(`Order #${res.data.orderNumber} updated to ${status}.`);
      setSelectedOrder(res.data);
      fetchOrders();
    } else {
      toast.error(res.message || 'Failed to update order status.');
    }
  };

  // Open drawer and sync state
  const handleOpenDrawer = (order: StaffRoomOrderDto) => {
    setSelectedOrder(order);
    setDeliveryStaff(order.deliveryStaffName || order.serverUserName || '');
    setEstimatedMins(order.estimatedDeliveryMinutes || 30);
  };

  // Helper: Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'warning';
      case 'ACCEPTED':
        return 'info';
      case 'COOKING':
        return 'primary';
      case 'READY':
        return 'success';
      case 'OUT_FOR_DELIVERY':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const newOrders = orders.filter((o) => o.status === 'PLACED').length;
    const cooking = orders.filter((o) => o.status === 'COOKING').length;
    const readyOrDelivery = orders.filter((o) => o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    return { newOrders, cooking, readyOrDelivery, delivered };
  }, [orders]);

  // Single-Line Columns Standard
  const columns = useMemo<ColumnDef<StaffRoomOrderDto>[]>(() => [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-surface-900 dark:text-white">
          {row.original.orderNumber}
        </span>
      ),
    },
    {
      accessorKey: 'roomNumber',
      header: 'Room',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold text-xs">
            {row.original.roomNumber ? `Room ${row.original.roomNumber}` : 'Room Service'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'guestDisplayName',
      header: 'Guest & Stay',
      cell: ({ row }) => {
        const o = row.original;
        const name = o.guestName || o.guestDisplayName || 'Guest';
        return (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">
              {name}
            </span>
            {o.isStayVerified ? (
              <span
                title="Active Hotel Stay Verified"
                className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="text-[10px] text-surface-400 px-1 py-0.2 rounded bg-surface-100 dark:bg-surface-800">
                Unverified
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items Summary',
      cell: ({ row }) => {
        const items = row.original.items || [];
        const count = items.reduce((acc, i) => acc + i.quantity, 0);
        const preview = items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ');
        return (
          <div className="text-xs truncate max-w-xs text-surface-600 dark:text-surface-400">
            <span className="font-medium text-surface-900 dark:text-surface-100 mr-1">
              ({count} items)
            </span>
            <span className="truncate">{preview}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-surface-900 dark:text-white">
          ${row.original.totalAmount.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
      cell: ({ row }) => {
        const isRoom = row.original.paymentMethod === 'CHARGE_TO_ROOM';
        return (
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              isRoom
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300'
            }`}
          >
            {isRoom ? 'Room Folio' : 'Pay on Delivery'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          variant={getStatusVariant(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'placedAt',
      header: 'Placed At',
      cell: ({ row }) => {
        const time = new Date(row.original.placedAt);
        const minsAgo = Math.floor((Date.now() - time.getTime()) / 60000);
        return (
          <div className="text-xs text-surface-500">
            <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="ml-1 text-[10px] text-surface-400">({minsAgo}m ago)</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDrawer(row.original)}
            className="h-7 px-2 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Manage
          </Button>
          {row.original.status === 'PLACED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'ACCEPTED')}
              className="h-7 px-2 text-xs"
            >
              Accept
            </Button>
          )}
          {row.original.status === 'READY' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'OUT_FOR_DELIVERY')}
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
            >
              <Truck className="h-3.5 w-3.5 mr-1" />
              Dispatch
            </Button>
          )}
          {row.original.status === 'OUT_FOR_DELIVERY' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, 'DELIVERED')}
              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Delivered
            </Button>
          )}
        </div>
      ),
    },
  ], [orders]);

  return (
    <PageContainer>
      <PageHeader
        title="In-Room Dining Orders"
        actions={
          <PageActions>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchOrders}
              className="h-8 w-8 p-0"
              title="Refresh Orders"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </PageActions>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              New Orders
            </div>
            <div className="text-xl font-bold text-surface-900 dark:text-white">
              {stats.newOrders}
            </div>
          </div>
          {stats.newOrders > 0 && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            In Kitchen (Cooking)
          </div>
          <div className="text-xl font-bold text-surface-900 dark:text-white">
            {stats.cooking}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Ready / On Delivery
          </div>
          <div className="text-xl font-bold text-surface-900 dark:text-white">
            {stats.readyOrDelivery}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Delivered Today
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.delivered}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <PageTabs
        tabs={[
          { id: 'ALL', label: 'All Orders' },
          { id: 'NEW', label: `New (${stats.newOrders})` },
          { id: 'ACCEPTED', label: 'Accepted' },
          { id: 'COOKING', label: `Cooking (${stats.cooking})` },
          { id: 'READY', label: 'Ready' },
          { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
          { id: 'DELIVERED', label: 'Delivered' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ]}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      />

      {/* Single-Line Data Table */}
      <div className="mt-4">
        <DataTable
          data={orders}
          columns={columns}
          totalCount={totalCount}
          pageIndex={page - 1}
          pageSize={pageSize}
          isLoading={loading}
          onPageChange={(p) => setPage(p + 1)}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ORDER DETAIL & ACTION DRAWER */}
      {selectedOrder && (
        <DetailDrawer
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          subtitle={`Room ${selectedOrder.roomNumber || 'N/A'} • ${selectedOrder.guestName || selectedOrder.guestDisplayName || 'Guest'}`}
        >
          <div className="space-y-6">
            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/60">
              <div>
                <div className="text-[11px] font-semibold uppercase text-surface-400">
                  Current Status
                </div>
                <div className="mt-0.5">
                  <StatusBadge
                    status={selectedOrder.status}
                    variant={getStatusVariant(selectedOrder.status)}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase text-surface-400">
                  Placed At
                </div>
                <div className="text-xs font-semibold text-surface-800 dark:text-surface-200">
                  {new Date(selectedOrder.placedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Guest & Room Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                Destination & Guest
              </h4>
              <div className="p-3 rounded-xl border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-surface-500 flex items-center">
                    <BedDouble className="h-3.5 w-3.5 mr-1 text-surface-400" /> Room:
                  </span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    Room {selectedOrder.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-surface-500 flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-surface-400" /> Guest:
                  </span>
                  <span className="font-semibold text-surface-800 dark:text-surface-200 flex items-center space-x-1">
                    <span>{selectedOrder.guestName || selectedOrder.guestDisplayName || 'Guest'}</span>
                    {selectedOrder.isStayVerified && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                        Stay Verified
                      </span>
                    )}
                  </span>
                </div>
                {selectedOrder.deliveryContactPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-surface-500 flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1 text-surface-400" /> Phone:
                    </span>
                    <a
                      href={`tel:${selectedOrder.deliveryContactPhone}`}
                      className="font-mono text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {selectedOrder.deliveryContactPhone}
                    </a>
                  </div>
                )}
                {selectedOrder.specialInstructions && (
                  <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
                    <span className="text-surface-400 block text-[11px] mb-0.5">
                      Guest Instructions:
                    </span>
                    <p className="text-surface-700 dark:text-surface-300 italic bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded border border-amber-200/50 dark:border-amber-900/30">
                      "{selectedOrder.specialInstructions}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Order Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                Order Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-start text-xs">
                    <div>
                      <div className="font-semibold text-surface-900 dark:text-white flex items-center space-x-1.5">
                        <span className="h-5 w-5 rounded bg-surface-100 dark:bg-surface-800 flex items-center justify-center font-bold text-[11px]">
                          {item.quantity}
                        </span>
                        <span>{item.itemName}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-surface-500 ml-6 italic mt-0.5">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-surface-800 dark:text-surface-200">
                        ${item.totalPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-surface-400">
                        ${item.unitPrice.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-xl border border-surface-200 dark:border-surface-800 text-xs space-y-1.5">
                <div className="flex justify-between text-surface-500">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span>F&B VAT / Tax (5%):</span>
                  <span>${selectedOrder.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-surface-900 dark:text-white pt-1 border-t border-surface-200 dark:border-surface-700">
                  <span>Total Due:</span>
                  <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div className="pt-1 text-[11px] flex justify-between items-center text-surface-500">
                  <span>Payment Settlement:</span>
                  <span className="font-semibold text-surface-800 dark:text-surface-200">
                    {selectedOrder.paymentMethod === 'CHARGE_TO_ROOM'
                      ? 'Charged to Room Folio'
                      : 'Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Management Controls */}
            <div className="space-y-3 pt-2 border-t border-surface-200 dark:border-surface-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                Staff & Dispatch Controls
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 mb-1">
                    Estimated Prep/Delivery (Mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={estimatedMins}
                    onChange={(e) => setEstimatedMins(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 mb-1">
                    Assigned Runner / Staff
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={deliveryStaff}
                    onChange={(e) => setDeliveryStaff(e.target.value)}
                    className="w-full text-xs rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Action Workflow Buttons */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold text-surface-500">
                  Advance Order State:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'PLACED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                      className="w-full text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Accept Order
                    </Button>
                  )}
                  {(selectedOrder.status === 'PLACED' || selectedOrder.status === 'ACCEPTED') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COOKING')}
                      className="w-full text-xs text-amber-600 hover:text-amber-700"
                    >
                      <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                      Send to Kitchen
                    </Button>
                  )}
                  {selectedOrder.status === 'COOKING' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                      className="w-full text-xs text-blue-600 hover:text-blue-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Mark Ready
                    </Button>
                  )}
                  {(selectedOrder.status === 'READY' || selectedOrder.status === 'COOKING') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'OUT_FOR_DELIVERY')}
                      className="w-full text-xs text-purple-600 hover:text-purple-700"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1.5" />
                      Dispatch for Delivery
                    </Button>
                  )}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Mark Delivered
                    </Button>
                  )}
                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      className="w-full text-xs text-rose-600 hover:text-rose-700"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
