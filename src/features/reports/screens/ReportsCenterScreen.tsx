import React, { useState, useEffect, useCallback } from 'react';
import { reportingService } from '@/services/reportingService';
import {
  NightAuditReport,
  RevenueTrialBalanceReport,
  OccupancyForecastReport,
  DepartmentProcurementReport,
  StaffPayrollSummaryReport,
} from '@/types/reporting';
import { Card, Badge } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  BarChart3,
  Moon,
  Scale,
  CalendarDays,
  ShoppingBag,
  Users,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const ReportsCenterScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NIGHT_AUDIT' | 'TRIAL_BALANCE' | 'FORECAST' | 'PROCUREMENT' | 'PAYROLL'>('NIGHT_AUDIT');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Data states
  const [nightAudit, setNightAudit] = useState<NightAuditReport | null>(null);
  const [trialBalance, setTrialBalance] = useState<RevenueTrialBalanceReport | null>(null);
  const [forecast, setForecast] = useState<OccupancyForecastReport | null>(null);
  const [procurement, setProcurement] = useState<DepartmentProcurementReport | null>(null);
  const [payroll, setPayroll] = useState<StaffPayrollSummaryReport | null>(null);

  const [auditDate, setAuditDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const loadCurrentTab = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'NIGHT_AUDIT') {
        const res = await reportingService.getNightAudit(1, auditDate);
        setNightAudit(res);
      } else if (activeTab === 'TRIAL_BALANCE') {
        const res = await reportingService.getRevenueTrialBalance(1);
        setTrialBalance(res);
      } else if (activeTab === 'FORECAST') {
        const res = await reportingService.getOccupancyForecast(1, 14);
        setForecast(res);
      } else if (activeTab === 'PROCUREMENT') {
        const res = await reportingService.getProcurementSpend(1);
        setProcurement(res);
      } else if (activeTab === 'PAYROLL') {
        const res = await reportingService.getPayrollSummary(1);
        setPayroll(res);
      }
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, auditDate]);

  useEffect(() => {
    loadCurrentTab();
  }, [loadCurrentTab]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const codeMap: Record<string, string> = {
        NIGHT_AUDIT: 'NIGHT_AUDIT',
        TRIAL_BALANCE: 'TRIAL_BALANCE',
        FORECAST: 'OCCUPANCY_FORECAST',
        PROCUREMENT: 'PROCUREMENT',
        PAYROLL: 'PAYROLL',
      };
      await reportingService.exportReportCsv(codeMap[activeTab] || 'NIGHT_AUDIT');
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Intelligence', href: '/reports' },
          { label: 'Reports Hub' },
        ]}
        title="Financial & Operations Intelligence Hub"
        subtitle="Executive reporting engine, daily night audit, USALI trial balance, yield forecasts & export"
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCurrentTab}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={handleExportCsv}
              disabled={exporting || loading}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              {exporting ? 'Generating...' : 'Export CSV'}
            </Button>
          </PageActions>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border dark:border-border">
        {[
          { id: 'NIGHT_AUDIT', label: 'Night Audit Ledger', icon: Moon },
          { id: 'TRIAL_BALANCE', label: 'General Ledger (Trial Balance)', icon: Scale },
          { id: 'FORECAST', label: '14-Day Yield Forecast', icon: CalendarDays },
          { id: 'PROCUREMENT', label: 'Department Procurement', icon: ShoppingBag },
          { id: 'PAYROLL', label: 'Staff Payroll Ledger', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-navy dark:bg-brand-indigo text-white shadow-soft-xs'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Night Audit Ledger */}
      {activeTab === 'NIGHT_AUDIT' && (
        <div className="space-y-6">
          {/* Controls */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Audited Business Date:</span>
              <div className="w-44">
                <Input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <Badge variant="success" dot size="md">
              EOD Run Completed &bull; Night Audit Closed
            </Badge>
          </Card>

          {loading ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span className="text-xs font-medium">Computing night audit balances from PMS folio database...</span>
            </Card>
          ) : nightAudit ? (
            <div className="space-y-6">
              {/* Top Operational Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Room Revenue Posted
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
                      ${nightAudit.roomTariffRevenue.toFixed(2)}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      F&amp;B / Outlet Revenue
                    </div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                      ${nightAudit.foodBeverageRevenue.toFixed(2)}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Audit Occupancy
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {nightAudit.occupancyPercent.toFixed(1)}%
                    </div>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Daily Gross
                    </div>
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400 tracking-tight font-mono">
                      ${nightAudit.totalRevenueGross.toFixed(2)}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Department Breakdown */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border dark:border-border">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Departmental Revenue Audit Manifest
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Itemized room charges, minibar, banquet billings, and applied occupancy tax
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Audit Component</th>
                        <th className="px-4 py-3 text-right">Audited Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Room Tariff Revenue</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${nightAudit.roomTariffRevenue.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Food &amp; Beverage Revenue</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${nightAudit.foodBeverageRevenue.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Banquet &amp; Events Revenue</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${nightAudit.banquetRevenue.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Tax Revenue Collected</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${nightAudit.taxRevenue.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Outstanding City Ledger Balance</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">${nightAudit.outstandingCityLedgerBalance.toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-navy-800 font-bold border-t border-border dark:border-navy-700">
                        <td className="px-4 py-3 text-slate-900 dark:text-white">Total Audited Gross</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">${nightAudit.totalRevenueGross.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Trial Balance */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="space-y-6">
          {loading ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span className="text-xs font-medium">Reconciling general ledger balances...</span>
            </Card>
          ) : trialBalance ? (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border dark:border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      USALI Chart of Accounts Trial Balance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Double-entry verification across all hotel revenue, expense, and liability accounts
                    </p>
                  </div>
                  <Badge variant={trialBalance.isBalanced ? 'success' : 'danger'} dot size="md">
                    {trialBalance.isBalanced ? 'Trial Balance Reconciled (OK)' : 'Imbalance Detected'}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Account Code</th>
                        <th className="px-4 py-3">Account Title</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Debit Balance ($)</th>
                        <th className="px-4 py-3 text-right">Credit Balance ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                      {trialBalance.accounts.map((acc) => (
                        <tr key={acc.accountCode} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {acc.accountCode}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {acc.accountName}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral" size="sm" className="font-mono">{acc.accountType}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                            ${acc.totalDebit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                            ${acc.totalCredit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-navy-800 font-bold border-t border-border dark:border-navy-700">
                        <td colSpan={3} className="px-4 py-3 text-slate-900 dark:text-white">
                          Total Balancing Sum
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          ${trialBalance.totalDebits.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          ${trialBalance.totalCredits.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 3: Occupancy Forecast */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-6">
          {loading ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span className="text-xs font-medium">Computing 14-day forward occupancy curves...</span>
            </Card>
          ) : forecast ? (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border dark:border-border">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    14-Day Forward Occupancy &amp; Yield Curve
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Forward booking velocity across property room inventory
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Target Date</th>
                        <th className="px-4 py-3 text-right">Committed Rooms</th>
                        <th className="px-4 py-3 text-right">Available</th>
                        <th className="px-4 py-3 text-right">Occupancy %</th>
                        <th className="px-4 py-3 text-right">Projected Revenue ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                      {forecast.forecastDays.map((df) => (
                        <tr key={df.date} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                            {new Date(df.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {df.roomsBooked}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            {df.roomsAvailable}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {df.projectedOccupancyPercent.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${df.projectedRevenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 4: Procurement Spend */}
      {activeTab === 'PROCUREMENT' && (
        <div className="space-y-6">
          {loading ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span className="text-xs font-medium">Aggregating departmental purchase orders...</span>
            </Card>
          ) : procurement ? (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border dark:border-border">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Department Procurement Spend Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Committed spend across Food &amp; Beverage, Housekeeping, Engineering, and Front Desk
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3 text-right">PO Count</th>
                        <th className="px-4 py-3 text-right">Total Committed ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                      {procurement.departmentSpends.map((dept) => (
                        <tr key={dept.department} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {dept.department}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {dept.poCount}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${dept.totalSpend.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-navy-800 font-bold border-t border-border dark:border-navy-700">
                        <td className="px-4 py-3 text-slate-900 dark:text-white">Total Enterprise Spend</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          {procurement.departmentSpends.reduce((acc, d) => acc + d.poCount, 0)} Orders
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          ${procurement.totalSpend.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 5: Payroll Summary */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-6">
          {loading ? (
            <Card className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
              <span className="text-xs font-medium">Aggregating department payroll and allowances...</span>
            </Card>
          ) : payroll ? (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border dark:border-border">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Departmental Staff Payroll &amp; Compensation Ledger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Monthly base compensation, headcount, and average compensation per employee
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border bg-slate-50/80 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3 text-right">Headcount</th>
                        <th className="px-4 py-3 text-right">Base Salary ($)</th>
                        <th className="px-4 py-3 text-right">Net Disbursement ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-navy-800">
                      {payroll.departments.map((ds) => (
                        <tr key={ds.department} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {ds.department}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {ds.employeeCount}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${ds.totalBaseSalary.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ${ds.netDisbursement.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-navy-800 font-bold border-t border-border dark:border-navy-700">
                        <td className="px-4 py-3 text-slate-900 dark:text-white">Total Hotel Payroll</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          {payroll.totalEmployees}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          ${payroll.totalPayroll.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                          ${payroll.totalEmployees > 0 ? (payroll.totalPayroll / payroll.totalEmployees).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </PageContainer>
  );
};
