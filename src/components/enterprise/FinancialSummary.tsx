import React from 'react';
import { cn } from '@/utils/cn';

export interface TaxLine {
  label: string;
  rate: number;
  amount: number;
}

export interface FinancialSummaryProps {
  subtotal: number;
  discount?: number;
  taxLines?: TaxLine[];
  taxesTotal?: number;
  grandTotal: number;
  amountPaid?: number;
  balanceDue?: number;
  currencySymbol?: string;
  className?: string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  subtotal,
  discount = 0,
  taxLines = [],
  taxesTotal = 0,
  grandTotal,
  amountPaid = 0,
  balanceDue,
  currencySymbol = '$',
  className,
}) => {
  const calculatedBalanceDue = balanceDue !== undefined ? balanceDue : grandTotal - amountPaid;

  const fmt = (amt: number) => {
    return `${currencySymbol} ${amt.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface p-4 space-y-2 text-xs select-none shadow-soft-xs',
        className
      )}
    >
      <div className="font-bold uppercase tracking-wider text-[10px] text-brand-muted pb-1 border-b border-brand-border dark:border-brand-darkBorder">
        Financial Breakdown
      </div>

      <div className="flex justify-between text-brand-muted">
        <span>Subtotal</span>
        <span className="font-mono font-medium text-brand-text">{fmt(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-[#16845B] dark:text-[#45C79A]">
          <span>Discount Applied</span>
          <span className="font-mono font-medium">-{fmt(discount)}</span>
        </div>
      )}

      {taxLines.length > 0 ? (
        taxLines.map((tax, idx) => (
          <div key={idx} className="flex justify-between text-brand-muted text-[11px]">
            <span>
              {tax.label} ({tax.rate}%)
            </span>
            <span className="font-mono text-brand-text">{fmt(tax.amount)}</span>
          </div>
        ))
      ) : taxesTotal > 0 ? (
        <div className="flex justify-between text-brand-muted">
          <span>Taxes &amp; Surcharges</span>
          <span className="font-mono text-brand-text">{fmt(taxesTotal)}</span>
        </div>
      ) : null}

      <div className="pt-2 border-t border-brand-border dark:border-brand-darkBorder flex justify-between font-bold text-sm text-brand-text">
        <span>Total Amount</span>
        <span className="font-mono text-brand-primary dark:text-[#8495FF]">{fmt(grandTotal)}</span>
      </div>

      {amountPaid > 0 && (
        <div className="flex justify-between text-brand-muted text-[11px] pt-1">
          <span>Total Payments / Deposits</span>
          <span className="font-mono text-[#16845B] dark:text-[#45C79A]">-{fmt(amountPaid)}</span>
        </div>
      )}

      <div className="pt-1.5 border-t border-dashed border-brand-border dark:border-brand-darkBorder flex justify-between font-bold text-xs">
        <span className={calculatedBalanceDue > 0 ? 'text-[#D44848] dark:text-[#F07878]' : 'text-[#16845B] dark:text-[#45C79A]'}>
          {calculatedBalanceDue > 0 ? 'Balance Due' : 'Fully Settled'}
        </span>
        <span className={cn('font-mono', calculatedBalanceDue > 0 ? 'text-[#D44848] dark:text-[#F07878]' : 'text-[#16845B] dark:text-[#45C79A]')}>
          {fmt(Math.max(0, calculatedBalanceDue))}
        </span>
      </div>
    </div>
  );
};
