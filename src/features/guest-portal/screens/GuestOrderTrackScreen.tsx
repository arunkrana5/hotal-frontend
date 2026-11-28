import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { guestOrderApi, GuestOrderSummaryDto } from '@/services/guestOrderApi';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  Sparkles,
  Phone,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  BedDouble,
  ShieldCheck,
} from 'lucide-react';

export const GuestOrderTrackScreen: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<GuestOrderSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return;
    const res = await guestOrderApi.getOrderDetails(orderNumber);
    if (res.success && res.data) {
      setOrder(res.data);
      setErrorMsg(null);
    } else {
      setErrorMsg(res.message || 'Order not found.');
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll status every 10s
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Stepper milestones
  const steps = [
    { key: 'PLACED', title: 'Order Placed', desc: 'Received by kitchen pass' },
    { key: 'ACCEPTED', title: 'Accepted', desc: 'Order confirmed by culinary team' },
    { key: 'COOKING', title: 'Preparing', desc: 'Chef is cooking your meal' },
    { key: 'OUT_FOR_DELIVERY', title: 'On the Way', desc: 'Runner en route to your room' },
    { key: 'DELIVERED', title: 'Delivered', desc: 'Delivered to your room' },
  ];

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const s = order.status;
    if (s === 'PLACED') return 0;
    if (s === 'ACCEPTED') return 1;
    if (s === 'COOKING') return 2;
    if (s === 'READY' || s === 'OUT_FOR_DELIVERY') return 3;
    if (s === 'DELIVERED' || s === 'SERVED') return 4;
    return 0;
  }, [order]);

  // Calculate estimated remaining minutes
  const remainingMins = useMemo(() => {
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return 0;
    }
    const placedTime = new Date(order.placedAt).getTime();
    const totalEst = (order.estimatedDeliveryMinutes || 30) * 60 * 1000;
    const elapsed = Date.now() - placedTime;
    const remaining = Math.max(0, Math.ceil((totalEst - elapsed) / (1000 * 60)));
    return remaining;
  }, [order]);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 border-3 border-primary-500 border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-xs text-slate-500">Retrieving order status...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Order Not Found
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white p-4 pb-12">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 font-mono">
              #{order.orderNumber}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-primary-600 text-white font-extrabold text-xs">
            ROOM {order.roomNumber}
          </span>
        </div>

        {/* Hero ETA Card */}
        <div className="p-6 text-center bg-gradient-to-b from-primary-50/50 to-white dark:from-primary-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          {order.status === 'DELIVERED' ? (
            <div className="space-y-1">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Order Delivered!
              </h2>
              <p className="text-xs text-slate-500">
                Delivered to Room {order.roomNumber}. Bon appétit!
              </p>
            </div>
          ) : order.status === 'CANCELLED' ? (
            <div className="space-y-1">
              <div className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Order Cancelled
              </h2>
              <p className="text-xs text-slate-500">
                This order was cancelled. Please call front desk for assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span>Live Kitchen Tracker</span>
              </div>

              <div className="text-3xl font-black text-slate-900 dark:text-white">
                ~{remainingMins} mins
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Estimated arrival to Room {order.roomNumber}
              </p>

              {order.deliveryStaffName && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 inline-block">
                  Assigned Runner: <span className="font-bold">{order.deliveryStaffName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Milestone Stepper */}
        {order.status !== 'CANCELLED' && (
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Preparation Progress
            </h3>

            <div className="space-y-4">
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;

                return (
                  <div key={step.key} className="flex items-start space-x-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-6 my-0.5 ${
                            idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-0.5">
                      <div
                        className={`font-bold ${
                          isCurrent
                            ? 'text-primary-600 dark:text-primary-400'
                            : isPassed
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Recap */}
        <div className="p-6 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Ordered Items
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="h-5 w-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px]">
                    {item.quantity}x
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.itemName}
                    </span>
                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic">"{item.notes}"</p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ${item.totalPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${order.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>F&B VAT / Tax:</span>
              <span>${order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Total:</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="pt-1 text-[11px] text-slate-400 flex justify-between">
              <span>Payment:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {order.paymentMethod === 'CHARGE_TO_ROOM'
                  ? 'Charged to Room Folio'
                  : 'Pay on Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Assistance CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 mb-2">
            Questions about your order? Dial <span className="font-bold font-mono">204</span> from your room phone.
          </p>
          <button
            onClick={fetchOrder}
            className="inline-flex items-center text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh Order Status
          </button>
        </div>
      </div>
    </div>
  );
};
