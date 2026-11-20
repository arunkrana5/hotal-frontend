import React from 'react';
import { cn } from '@/utils/cn';
import { StatusBadge } from './StatusBadge';
import { FileText, ArrowRight, ExternalLink } from 'lucide-react';

export interface LedgerTransaction {
  id: string | number;
  date: string;
  voucherNo: string;
  particulars: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  status?: string;
}

export interface TransactionTableProps {
  transactions: LedgerTransaction[];
  onVoucherClick?: (voucherNo: string, transaction: LedgerTransaction) => void;
  currencySymbol?: string;
  className?: string;
  isLoading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onVoucherClick,
  currencySymbol = '$',
  className,
  isLoading = false,
}) => {
  const formatAmount = (amt: number) => {
    if (amt === 0) return '-';
    return `${currencySymbol} ${amt.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

  return (
    <div
      className={cn(
        'rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="border-b border-brand-border dark:border-brand-darkBorder bg-slate-50/75 dark:bg-brand-darkCard/80 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              <th className="px-3.5 py-2.5 whitespace-nowrap">Date</th>
              <th className="px-3.5 py-2.5 whitespace-nowrap">Voucher No.</th>
              <th className="px-3.5 py-2.5">Particulars / Account</th>
              <th className="px-3.5 py-2.5 whitespace-nowrap">Reference</th>
              <th className="px-3.5 py-2.5 text-right whitespace-nowrap">Debit (Dr)</th>
              <th className="px-3.5 py-2.5 text-right whitespace-nowrap">Credit (Cr)</th>
              <th className="px-3.5 py-2.5 text-right whitespace-nowrap">Running Balance</th>
              <th className="px-3.5 py-2.5 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder text-brand-text">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="px-3.5 py-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-brand-muted">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-1" />
                    <p className="font-medium text-xs">No ledger transactions found in this period.</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-brand-darkCard/60 transition-colors group"
                >
                  <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-[11px] text-brand-muted">
                    {tx.date}
                  </td>

                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    {onVoucherClick ? (
                      <button
                        type="button"
                        onClick={() => onVoucherClick(tx.voucherNo, tx)}
                        className="font-mono text-brand-primary dark:text-[#8495FF] font-semibold hover:underline inline-flex items-center space-x-1"
                      >
                        <span>{tx.voucherNo}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="font-mono font-semibold">{tx.voucherNo}</span>
                    )}
                  </td>

                  <td className="px-3.5 py-2.5 font-medium max-w-xs truncate">
                    {tx.particulars}
                  </td>

                  <td className="px-3.5 py-2.5 whitespace-nowrap text-brand-muted text-[11px] font-mono">
                    {tx.reference || '-'}
                  </td>

                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-semibold text-[#16845B] dark:text-[#45C79A]">
                    {tx.debit > 0 ? formatAmount(tx.debit) : '-'}
                  </td>

                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-semibold text-[#C78B24] dark:text-[#E7B65A]">
                    {tx.credit > 0 ? formatAmount(tx.credit) : '-'}
                  </td>

                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-bold text-brand-text">
                    {formatAmount(Math.abs(tx.balance))}{' '}
                    <span className="text-[10px] text-brand-muted font-normal">
                      {tx.balance >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </td>

                  <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                    {tx.status && <StatusBadge status={tx.status} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Double-Entry Footer Summary */}
          {transactions.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-brand-border dark:border-brand-darkBorder bg-slate-50/80 dark:bg-brand-darkCard font-bold">
                <td colSpan={4} className="px-3.5 py-2.5 uppercase tracking-wider text-right text-[11px] text-brand-muted">
                  Period Totals:
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-sm text-[#16845B] dark:text-[#45C79A]">
                  {formatAmount(totalDebit)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-sm text-[#C78B24] dark:text-[#E7B65A]">
                  {formatAmount(totalCredit)}
                </td>
                <td colSpan={2} className="px-3.5 py-2.5 text-right font-mono text-xs text-brand-muted">
                  Diff: {formatAmount(Math.abs(totalDebit - totalCredit))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
