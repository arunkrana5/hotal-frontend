import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LedgerSummaryProps {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  currencySymbol?: string;
  className?: string;
}

export const LedgerSummary: React.FC<LedgerSummaryProps> = ({
  openingBalance,
  totalDebit,
  totalCredit,
  closingBalance,
  currencySymbol = '$',
  className,
}) => {
  const netMovement = totalDebit - totalCredit;

  const formatCurrency = (amt: number) => {
    return `${currencySymbol} ${Math.abs(amt).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 select-none', className)}>
      {/* 1. Opening Balance */}
      <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
        <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase tracking-wider">
          <span>Opening Balance</span>
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-base font-bold text-brand-text mt-1 font-mono">
          {formatCurrency(openingBalance)}
          <span className="text-[10px] text-brand-muted font-sans font-normal ml-1">
            {openingBalance >= 0 ? 'Dr' : 'Cr'}
          </span>
        </div>
        <div className="text-[10px] text-brand-muted mt-0.5">As of period start</div>
      </div>

      {/* 2. Total Period Debits */}
      <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
        <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase tracking-wider">
          <span>Total Debits</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#16845B] dark:text-[#45C79A]" />
        </div>
        <div className="text-base font-bold text-[#16845B] dark:text-[#45C79A] mt-1 font-mono">
          {formatCurrency(totalDebit)}
        </div>
        <div className="text-[10px] text-brand-muted mt-0.5">Inflow / Asset debits</div>
      </div>

      {/* 3. Total Period Credits */}
      <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
        <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase tracking-wider">
          <span>Total Credits</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-[#C78B24] dark:text-[#E7B65A]" />
        </div>
        <div className="text-base font-bold text-[#C78B24] dark:text-[#E7B65A] mt-1 font-mono">
          {formatCurrency(totalCredit)}
        </div>
        <div className="text-[10px] text-brand-muted mt-0.5">Outflow / Revenue credits</div>
      </div>

      {/* 4. Closing Balance */}
      <div className="p-3 rounded-xl border border-brand-primary/30 dark:border-brand-primary/40 bg-indigo-50/40 dark:bg-brand-darkCard shadow-soft-xs">
        <div className="flex items-center justify-between text-brand-primary dark:text-[#8495FF] text-[11px] font-bold uppercase tracking-wider">
          <span>Closing Balance</span>
          <DollarSign className="w-3.5 h-3.5 text-brand-primary dark:text-[#8495FF]" />
        </div>
        <div className="text-base font-bold text-brand-primary dark:text-[#8495FF] mt-1 font-mono">
          {formatCurrency(closingBalance)}
          <span className="text-[10px] font-sans font-normal ml-1">
            {closingBalance >= 0 ? 'Dr' : 'Cr'}
          </span>
        </div>
        <div className="text-[10px] text-brand-muted mt-0.5">
          Net movement: {netMovement >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netMovement))}
        </div>
      </div>
    </div>
  );
};
