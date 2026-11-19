import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  DiningTableDto,
  MenuItemDto,
  RestaurantOrderDto,
} from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input } from '@/components/common/Input';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  Building,
  Plus,
  Minus,
  CheckCircle2,
  RefreshCw,
  Send,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItemDto;
  quantity: number;
  notes?: string;
}

export const LivePosTerminalScreen: React.FC = () => {
  const { documentNumber: kotNumber, isLoading: isKotLoading, refetch: refetchKot } = useDocumentNumber('RESTAURANT_ORDER');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'ROOM_SERVICE' | 'TAKEAWAY'>('DINE_IN');
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Active Orders Sidebar
  const [activeOrders, setActiveOrders] = useState<RestaurantOrderDto[]>([]);
  const [settleModalOrder, setSettleModalOrder] = useState<RestaurantOrderDto | null>(null);
  const [settleSubmitting, setSettleSubmitting] = useState<boolean>(false);
  const [settleMethod, setSettleMethod] = useState<'CARD' | 'CASH' | 'ROOM_CHARGE'>('CARD');

  const fetchTables = async () => {
    const res = await api.get<DiningTableDto[]>('/restaurant/tables');
    if (res.success && res.data) setTables(res.data);
  };

  const fetchRooms = async () => {
    const res = await api.get<any>('/pms/rooms?status=OCC&pageSize=50');
    if (res.success && res.data) setRooms(res.data.items);
  };

  const fetchMenu = async () => {
    setLoadingMenu(true);
    const res = await api.get<MenuItemDto[]>('/restaurant/menu?isAvailableOnly=true');
    if (res.success && res.data) setMenuItems(res.data);
    setLoadingMenu(false);
  };

  const fetchActiveOrders = async () => {
    const res = await api.get<any>('/restaurant/orders?status=PLACED&pageSize=20');
    if (res.success && res.data) {
      setActiveOrders(res.data.items);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRooms();
    fetchMenu();
    fetchActiveOrders();
  }, []);

  const addToCart = (item: MenuItemDto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItem.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const subTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxAmount = Math.round(subTotal * 0.05 * 100) / 100;
  const totalAmount = subTotal + taxAmount;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DINE_IN' && !selectedTableId) {
      alert('Please select a dining table for Dine-In order.');
      return;
    }
    if (orderType === 'ROOM_SERVICE' && !selectedRoomId) {
      alert('Please select an occupied room for Room Service order.');
      return;
    }

    setOrderSubmitting(true);
    const res = await api.post('/restaurant/orders', {
      orderType,
      tableId: orderType === 'DINE_IN' ? selectedTableId : null,
      roomId: orderType === 'ROOM_SERVICE' ? selectedRoomId : null,
      specialInstructions,
      items: cart.map((i) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        notes: i.notes,
      })),
    });
    setOrderSubmitting(false);

    if (res.success) {
      setOrderSuccessMsg('Order dispatched to Kitchen Display System (KDS)!');
      setTimeout(() => setOrderSuccessMsg(null), 5000);
      setCart([]);
      setSpecialInstructions('');
      setSelectedTableId(null);
      setSelectedRoomId(null);
      await fetchTables();
      await fetchActiveOrders();
    }
  };

  const handleSettleOrder = async () => {
    if (!settleModalOrder) return;
    setSettleSubmitting(true);

    const isRoomCharge = settleMethod === 'ROOM_CHARGE';
    const res = await api.post(`/restaurant/orders/${settleModalOrder.id}/settle`, {
      paymentStatus: isRoomCharge ? 'CHARGED_TO_ROOM' : 'PAID',
      paymentMethod: settleMethod,
    });
    setSettleSubmitting(false);

    if (res.success) {
      setSettleModalOrder(null);
      await fetchTables();
      await fetchActiveOrders();
    }
  };

  const categories = ['ALL', 'APPETIZERS', 'MAINS', 'BREADS', 'DESSERTS', 'COCKTAILS'];

  const filteredMenu = menuItems.filter((i) =>
    selectedCategory === 'ALL' ? true : i.category === selectedCategory
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'F&B', href: '/restaurant/pos' },
          { label: 'POS Terminal' },
        ]}
        title="Live POS &amp; In-Room Dining Terminal"
        subtitle="Table orders, in-room service dispatch, KDS kitchen tickets, and instant folio charge"
        icon={<UtensilsCrossed className="w-4 h-4" />}
        badge={<Badge variant="purple">Point of Sale</Badge>}
        actions={
          <PageActions>
            <div className="flex p-0.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  orderType === 'DINE_IN'
                    ? 'bg-surface dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Restaurant
              </button>
              <button
                onClick={() => setOrderType('ROOM_SERVICE')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  orderType === 'ROOM_SERVICE'
                    ? 'bg-surface dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                In-Room Dining
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-surface dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Takeaway
              </button>
            </div>
          </PageActions>
        }
      />

      {orderSuccessMsg && (
        <Alert
          type="success"
          title="Order Placed"
          message={orderSuccessMsg}
          onClose={() => setOrderSuccessMsg(null)}
        />
      )}

      {/* Target Selector Bar */}
      <Card className="p-4">
        {orderType === 'DINE_IN' && (
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>Select Active Dining Table</span>
              <span className="text-[11px] font-normal text-slate-400">
                {tables.filter(t => t.status === 'AVAILABLE').length} Tables Available
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => {
                const isSelected = selectedTableId === t.id;
                const isOccupied = t.status === 'OCCUPIED';
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTableId(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                      isSelected
                        ? 'bg-brand-indigo text-white border-brand-indigo shadow-md shadow-brand-indigo/20'
                        : isOccupied
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-50 dark:bg-navy-800/60 text-slate-700 dark:text-slate-300 border-border dark:border-navy-700 hover:border-brand-indigo/50'
                    }`}
                  >
                    <span>Table {t.tableNumber}</span>
                    <span className="text-[10px] opacity-75 font-normal">({t.capacity}p)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {orderType === 'ROOM_SERVICE' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Occupied Guest Room for Folio Dispatch
            </label>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => {
                const isSelected = selectedRoomId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                      isSelected
                        ? 'bg-brand-indigo text-white border-brand-indigo shadow-md shadow-brand-indigo/20'
                        : 'bg-slate-50 dark:bg-navy-800/60 text-slate-700 dark:text-slate-300 border-border dark:border-navy-700 hover:border-brand-indigo/50'
                    }`}
                  >
                    <span>Room {r.roomNumber}</span>
                    <span className="text-[10px] opacity-75">({r.roomTypeCode})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {orderType === 'TAKEAWAY' && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Counter pickup &bull; Order will be processed directly at main lounge cashier
          </div>
        )}
      </Card>

      {/* Main POS Interface: Menu (Left) + Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Grid (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-brand-navy dark:bg-brand-indigo text-white shadow-soft-xs'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          {loadingMenu ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span>Loading gourmet kitchen menu...</span>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-surface dark:bg-navy-800/60 border border-border dark:border-navy-700/80 rounded-2xl p-4 cursor-pointer hover:border-brand-indigo hover:shadow-card-hover transition flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-brand-indigo dark:group-hover:text-brand-blue transition">
                        {item.itemName}
                      </h4>
                      {(item.dietaryType === 'VEG' || item.dietaryType === 'VEGAN') && (
                        <span className="w-3 h-3 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-navy-700">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 group-hover:bg-brand-indigo group-hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart & Billing (1 Col) */}
        <div className="space-y-6">
          <Card className="p-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-indigo" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Order Ticket</h3>
              </div>
              <Badge variant="brand" size="sm">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </Badge>
            </div>

            {/* Universal First Field: KOT Document Number */}
            <DocumentNumberField
              value={kotNumber}
              label="Kitchen Order Ticket (KOT)"
              isLoading={isKotLoading}
              onRefresh={refetchKot}
              helperText="Auto-assigned sequentially by Restaurant POS Engine"
            />

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Select dishes from the menu to build order ticket</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-border dark:border-navy-700/80"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                        {item.menuItem.itemName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ${item.menuItem.price.toFixed(2)} &times; {item.quantity} = ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Chef Instructions */}
            {cart.length > 0 && (
              <div>
                <Input
                  label="Kitchen Directives / Allergies"
                  placeholder="e.g. Dressing on side, no nuts..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Financial Summary */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-border dark:border-border space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">${subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>F&amp;B VAT / Tax (5%):</span>
                  <span className="font-mono font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border dark:border-border text-slate-900 dark:text-white">
                  <span>Total Order Due:</span>
                  <span className="text-brand-indigo dark:text-brand-blue font-mono text-base">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={orderSubmitting}
                    className="w-full font-semibold flex items-center justify-center gap-2 py-2.5 shadow-md shadow-brand-indigo/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>{orderSubmitting ? 'Sending to Kitchen...' : 'Fire Order to KDS'}</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Active Orders Queue for Settlement */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-border">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Open Checks ({activeOrders.length})</span>
              </h4>
              <button onClick={fetchActiveOrders} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-border dark:border-navy-700 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      #{ord.orderNumber} &bull; {ord.tableNumber ? `Table ${ord.tableNumber}` : `Room ${ord.roomNumber || '-'}`}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ${ord.totalAmount.toFixed(2)}
                    </div>
                  </div>

                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setSettleModalOrder(ord);
                      setSettleMethod(ord.roomId ? 'ROOM_CHARGE' : 'CARD');
                    }}
                    className="text-[11px] font-semibold"
                  >
                    Settle Check
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Settle Order Modal */}
      {settleModalOrder && (
        <Modal
          isOpen={!!settleModalOrder}
          onClose={() => setSettleModalOrder(null)}
          title="Settle Restaurant Check"
          subtitle={`Order #${settleModalOrder.orderNumber} • Total: $${settleModalOrder.totalAmount.toFixed(2)}`}
          icon={<CreditCard className="w-4 h-4" />}
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettleModalOrder(null)}
                disabled={settleSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSettleOrder}
                disabled={settleSubmitting}
                isLoading={settleSubmitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Confirm Settlement
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettleMethod('CARD')}
                className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                  settleMethod === 'CARD'
                    ? 'bg-brand-indigo text-white border-brand-indigo shadow-sm'
                    : 'border-border dark:border-navy-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setSettleMethod('CASH')}
                className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                  settleMethod === 'CASH'
                    ? 'bg-brand-indigo text-white border-brand-indigo shadow-sm'
                    : 'border-border dark:border-navy-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setSettleMethod('ROOM_CHARGE')}
                className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                  settleMethod === 'ROOM_CHARGE'
                    ? 'bg-brand-indigo text-white border-brand-indigo shadow-sm'
                    : 'border-border dark:border-navy-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Room Folio
              </button>
            </div>

            {settleMethod === 'ROOM_CHARGE' && (
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-navy-800/60 border border-blue-100 dark:border-navy-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Charge will post immediately to the guest room folio under department code FB.</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
