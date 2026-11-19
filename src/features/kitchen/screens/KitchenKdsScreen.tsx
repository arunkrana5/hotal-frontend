import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { RestaurantOrderDto } from '@/types/operations';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Flame,
  Clock,
  CheckCircle2,
  RefreshCw,
  Utensils,
  Building,
  BellRing,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export const KitchenKdsScreen: React.FC = () => {
  const [tickets, setTickets] = useState<RestaurantOrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchKdsTickets = async () => {
    setLoading(true);
    const res = await api.get<RestaurantOrderDto[]>('/restaurant/kds');
    if (res.success && res.data) {
      setTickets(res.data);
    }
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchKdsTickets();
    const interval = setInterval(fetchKdsTickets, 15000); // 15s live polling
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    const res = await api.put(`/restaurant/orders/${orderId}/status`, { status });
    if (res.success) {
      await fetchKdsTickets();
    }
  };

  const handleUpdateItemStatus = async (itemId: number, status: string) => {
    const res = await api.put(`/restaurant/orders/items/${itemId}/status`, { status });
    if (res.success) {
      await fetchKdsTickets();
    }
  };

  const getElapsedTime = (placedAt: string) => {
    const now = new Date().getTime();
    const placed = new Date(placedAt).getTime();
    const minutes = Math.floor((now - placed) / (1000 * 60));
    return minutes;
  };

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Kitchen', href: '/kitchen/kds' },
          { label: 'KDS Pass' },
        ]}
        title="Kitchen Display System (KDS) & Pass"
        subtitle="Real-time kitchen order tickets (KOT), prep timer tracking & expediter staging"
        actions={
          <PageActions>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Synced: {lastRefreshed.toLocaleTimeString()}
            </span>
            <Button
              onClick={fetchKdsTickets}
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync Pass
            </Button>
          </PageActions>
        }
      />

      {/* Ticket Counter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Tickets in Queue
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {tickets.length}
          </div>
        </Card>
        <Card className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50">
          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Dining Room Tickets
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {tickets.filter((t) => t.orderType === 'DINE_IN').length}
          </div>
        </Card>
        <Card className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
          <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Room Service In-Flight
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {tickets.filter((t) => t.orderType === 'ROOM_SERVICE').length}
          </div>
        </Card>
      </div>

      {/* Active KDS Tickets Grid */}
      {loading && tickets.length === 0 ? (
        <Card className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
          <span className="text-xs font-medium">Syncing kitchen order tickets...</span>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="py-20 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">All Kitchen Tickets Cleared!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No active orders waiting in the cooking queue. The kitchen pass is fully caught up.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map((ticket) => {
            const elapsedMins = getElapsedTime(ticket.placedAt);
            const isDelayed = elapsedMins > 20;
            const isWarning = elapsedMins > 10 && elapsedMins <= 20;

            return (
              <Card
                key={ticket.id}
                className="overflow-hidden flex flex-col justify-between shadow-card-hover border-border dark:border-navy-700"
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-3.5 border-b ${
                    isDelayed
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                      : isWarning
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50'
                      : 'bg-slate-50/80 dark:bg-navy-800/60 border-border dark:border-navy-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{ticket.orderNumber}
                    </span>
                    <Badge
                      variant={isDelayed ? 'danger' : isWarning ? 'warning' : 'neutral'}
                      size="sm"
                      className="font-mono font-bold flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{elapsedMins}m</span>
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {ticket.orderType === 'DINE_IN' ? (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-amber-500" />
                          <span>Table {ticket.tableNumber}</span>
                        </>
                      ) : ticket.orderType === 'ROOM_SERVICE' ? (
                        <>
                          <Building className="w-3.5 h-3.5 text-blue-500" />
                          <span>Room {ticket.roomNumber}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                          <span>Takeaway / Bar</span>
                        </>
                      )}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">
                      {ticket.orderType.replace('_', ' ')}
                    </span>
                  </div>

                  {ticket.specialInstructions && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                      ⚠️ {ticket.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Items in Ticket */}
                <div className="p-3.5 space-y-2 flex-1">
                  {ticket.items.map((item) => {
                    const isReady = item.status === 'READY';
                    const isPrep = item.status === 'PREPARING';

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                          isReady
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 opacity-70'
                            : isPrep
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                            : 'bg-slate-50/60 dark:bg-navy-800/40 border-border dark:border-navy-700/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-200 dark:bg-navy-700">
                              {item.quantity}&times;
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                isReady
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.itemName}
                            </span>
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 italic ml-6 mt-0.5">
                              "{item.notes}"
                            </div>
                          )}
                        </div>

                        {/* Item State Toggle Button */}
                        <div>
                          {!isReady ? (
                            <Button
                              size="xs"
                              variant={isPrep ? 'success' : 'secondary'}
                              onClick={() =>
                                handleUpdateItemStatus(item.id, isPrep ? 'READY' : 'PREPARING')
                              }
                              className="text-[10px] font-bold py-0.5 px-2"
                            >
                              {isPrep ? 'Done' : 'Cook'}
                            </Button>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Bottom Actions */}
                <div className="p-3 bg-slate-50/80 dark:bg-navy-900/80 border-t border-border dark:border-navy-700 flex items-center gap-2">
                  {ticket.status === 'PLACED' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(ticket.id, 'COOKING')}
                      className="flex-1 font-bold text-xs"
                    >
                      Start Ticket
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleUpdateOrderStatus(ticket.id, 'READY')}
                    className="flex-1 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Pass Ready</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
