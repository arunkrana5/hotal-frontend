import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { FolioDto, PostChargeRequest, PostPaymentRequest } from '@/types/pms';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input } from '@/components/common/Input';
import {
  FileText,
  Plus,
  CreditCard,
  Printer,
  X,
  Receipt,
  Search,
  CheckCircle2,
  User,
  ShieldCheck,
} from 'lucide-react';

export const FolioManagementScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reservationIdParam = searchParams.get('reservationId');

  const [folio, setFolio] = useState<FolioDto | null>(null);
  const [reservationIdInput, setReservationIdInput] = useState<string>(reservationIdParam || '2');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Add Charge Modal
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeDept, setChargeDept] = useState<string>('FB');
  const [chargeDesc, setChargeDesc] = useState<string>('');
  const [chargePrice, setChargePrice] = useState<number>(0);
  const [chargeQty, setChargeQty] = useState<number>(1);
  const [isSubmittingCharge, setIsSubmittingCharge] = useState(false);

  // Post Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CC');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchFolio = useCallback(async (resId: string) => {
    if (!resId.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.request<FolioDto>(`/pms/folios/by-reservation/${resId}`);
      if (res.success && res.data) {
        setFolio(res.data);
      } else {
        setError(res.message || 'Folio not found for this reservation.');
        setFolio(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reservationIdParam) {
      fetchFolio(reservationIdParam);
    } else {
      fetchFolio(reservationIdInput);
    }
  }, [reservationIdParam, fetchFolio]);

  const handleSearchFolio = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFolio(reservationIdInput);
  };

  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio) return;

    setIsSubmittingCharge(true);
    try {
      const payload: PostChargeRequest = {
        folioId: folio.id,
        departmentCode: chargeDept,
        description: chargeDesc.trim(),
        unitPrice: chargePrice,
        quantity: chargeQty,
      };

      const res = await api.request<FolioDto>('/pms/folios/charges', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setFolio(res.data);
        setIsChargeModalOpen(false);
        setChargeDesc('');
        setChargePrice(0);
        setChargeQty(1);
        setActionSuccess('Charge successfully posted to guest ledger.');
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setError(res.message || 'Failed to post charge.');
      }
    } finally {
      setIsSubmittingCharge(false);
    }
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const payload: PostPaymentRequest = {
        folioId: folio.id,
        paymentModeCode: paymentMode,
        amount: paymentAmount,
        transactionReference: paymentRef.trim() || undefined,
      };

      const res = await api.request<FolioDto>('/pms/folios/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setFolio(res.data);
        setIsPaymentModalOpen(false);
        setPaymentRef('');
        setActionSuccess('Payment successfully recorded and receipt logged.');
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setError(res.message || 'Failed to post payment.');
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Front Office', href: '/front-office/room-grid' },
          { label: 'Guest Folio Ledger' },
        ]}
        title={folio ? `Folio: ${folio.folioNumber}` : 'Guest Folio & Financial Ledger'}
        subtitle={
          folio
            ? `Guest: ${folio.guestName} • Res #${folio.confirmationNumber} • Status: ${folio.status}`
            : 'Itemized postings, guest ledger charges, payment receipts, and folio settlement'
        }
        icon={<Receipt className="w-4 h-4" />}
        badge={
          folio ? (
            <Badge variant={folio.status === 'Settled' ? 'success' : 'brand'} size="sm">
              {folio.status}
            </Badge>
          ) : undefined
        }
        actions={
          <PageActions>
            {folio && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsChargeModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Post Charge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPaymentAmount(folio.balanceAmount > 0 ? folio.balanceAmount : 0);
                    setIsPaymentModalOpen(true);
                  }}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                >
                  Record Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print
                </Button>
              </>
            )}
          </PageActions>
        }
      />

      {/* Lookup Toolbar (Separated from Header) */}
      <div className="flex items-center justify-between gap-3 bg-surface dark:bg-navy-900 p-2.5 sm:p-3 rounded-xl border border-border dark:border-navy-700 shadow-soft-xs">
        <form onSubmit={handleSearchFolio} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              placeholder="Search by Reservation ID #..."
              value={reservationIdInput}
              onChange={(e) => setReservationIdInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={isLoading} className="text-xs h-8">
            Lookup Folio
          </Button>
        </form>
        {folio && (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <span className="font-semibold text-slate-900 dark:text-white">Folio #{folio.folioNumber}</span>
            <span>&bull;</span>
            <span>Guest: {folio.guestName}</span>
          </div>
        )}
      </div>

      {actionSuccess && (
        <Alert
          type="success"
          title="Transaction Verified"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Folio Exception"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {folio ? (
        <div className="space-y-4">
          {/* Financial Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-border dark:border-navy-700/80">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Folio Charges
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  ${folio.totalCharges.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Total Payments Settled
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ${folio.totalPayments.toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-border dark:border-navy-700/80">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Outstanding Balance
                </div>
                <div
                  className={`text-2xl font-bold mt-1 font-mono ${
                    folio.balanceAmount > 0 ? 'text-danger' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  ${folio.balanceAmount.toFixed(2)}
                </div>
              </div>
            </div>

          {/* Itemized Folio Transactions Table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border dark:border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  <span>Itemized Ledger Postings ({folio.items.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed timeline of room charges, restaurant checks, taxes, and applied payments
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Real-Time PMS Feed
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3">Payment / Ref</th>
                    <th className="px-4 py-3">Audited By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                  {folio.items.length > 0 ? (
                    folio.items.map((item) => {
                      const isPayment = item.itemType === 'PAYMENT';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition">
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(item.postedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral" size="sm" className="font-mono font-bold">
                              {item.departmentCode}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={isPayment ? 'success' : 'brand'} size="sm">
                              {item.itemType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold ${
                              isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isPayment ? `-$${item.amount.toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.paymentModeCode ? (
                              <span className="font-mono">
                                {item.paymentModeCode} {item.transactionReference && `(${item.transactionReference})`}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">&mdash;</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                            {item.postedBy}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        No transactions recorded on this folio yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 mx-auto flex items-center justify-center text-slate-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Folio Loaded</div>
            <p className="text-xs text-slate-400 mt-1">Please enter a valid Reservation ID above to load its active folio.</p>
          </div>
        </Card>
      )}

      {/* Post Extra Charge Modal */}
      {folio && (
        <Modal
          isOpen={isChargeModalOpen}
          onClose={() => setIsChargeModalOpen(false)}
          title="Post Charge to Guest Folio"
          subtitle={`Folio #${folio.folioNumber} • ${folio.guestName}`}
          icon={<Plus className="w-4 h-4" />}
          size="md"
          onSubmit={handlePostCharge}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChargeModalOpen(false)}
                disabled={isSubmittingCharge}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCharge || !chargeDesc.trim() || chargePrice <= 0}
                isLoading={isSubmittingCharge}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Post Charge
              </Button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Posting Department
            </label>
            <DynamicDropdown
              masterCode="DEPARTMENT"
              value={chargeDept}
              onChange={(val) => setChargeDept(val)}
              placeholder="Select posting department..."
            />
          </div>

          <div>
            <Input
              label="Charge Description *"
              type="text"
              required
              value={chargeDesc}
              onChange={(e) => setChargeDesc(e.target.value)}
              placeholder="e.g. In-Room Dining / Laundry Service / Spa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Unit Price ($) *"
                type="number"
                step="0.01"
                min="0"
                required
                value={chargePrice}
                onChange={(e) => setChargePrice(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div>
              <Input
                label="Quantity *"
                type="number"
                min="1"
                required
                value={chargeQty}
                onChange={(e) => setChargeQty(Number(e.target.value))}
                className="font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-xl border border-border dark:border-navy-700 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Computed Charge Total:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              ${(chargePrice * chargeQty).toFixed(2)}
            </span>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {folio && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Folio Payment"
          subtitle={`Folio #${folio.folioNumber} • ${folio.guestName}`}
          icon={<CreditCard className="w-4 h-4" />}
          size="md"
          onSubmit={handlePostPayment}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmittingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                disabled={isSubmittingPayment || paymentAmount <= 0}
                isLoading={isSubmittingPayment}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Record Payment
              </Button>
            </>
          }
        >
          <div>
            <Input
              label="Payment Amount ($) *"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Mode
            </label>
            <DynamicDropdown
              masterCode="PAYMENT_MODE"
              value={paymentMode}
              onChange={(val) => setPaymentMode(val)}
              placeholder="Select payment method..."
            />
          </div>

          <div>
            <Input
              label="Transaction / Authorization Reference"
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. AUTH-98214 / TRX-CC-5829"
              className="font-mono"
            />
          </div>

          <div className="bg-slate-50 dark:bg-navy-800/60 p-3.5 rounded-xl border border-border dark:border-navy-700 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Current Outstanding Balance:</span>
              <span className="font-bold font-mono text-danger">${folio.balanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1.5 border-t border-slate-200 dark:border-navy-700">
              <span>Balance After Payment:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                ${Math.max(0, folio.balanceAmount - paymentAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
