import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DiningTableDto } from '@/types/operations';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  UtensilsCrossed,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Layers,
  Receipt,
} from 'lucide-react';

export const TableManagementScreen: React.FC = () => {
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Status Change Modal
  const [activeTable, setActiveTable] = useState<DiningTableDto | null>(null);
  const [newStatus, setNewStatus] = useState<string>('AVAILABLE');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchTables = async () => {
    setLoading(true);
    const res = await api.get<DiningTableDto[]>('/restaurant/tables');
    if (res.success && res.data) {
      setTables(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable) return;

    setUpdating(true);
    const res = await api.put(`/restaurant/tables/${activeTable.id}/status`, {
      status: newStatus,
    });
    setUpdating(false);

    if (res.success) {
      setActiveTable(null);
      await fetchTables();
    }
  };

  const sections = ['ALL', 'MAIN_DINING', 'TERRACE', 'ROOFTOP', 'BAR', 'PRIVATE_DINING'];

  const filteredTables = tables.filter((t) =>
    selectedSection === 'ALL' ? true : t.section === selectedSection
  );

  const getTableStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', variant: 'success' as const, icon: CheckCircle2 };
      case 'OCCUPIED':
        return { label: 'Occupied', variant: 'danger' as const, icon: Users };
      case 'RESERVED':
        return { label: 'Reserved', variant: 'warning' as const, icon: Clock };
      case 'BILLED':
        return { label: 'Check Printed', variant: 'brand' as const, icon: Receipt };
      default:
        return { label: status, variant: 'neutral' as const, icon: Sparkles };
    }
  };

  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter(t => t.status === 'RESERVED').length;

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'F&B', href: '/restaurant/pos' },
          { label: 'Floor Plan' },
        ]}
        title="Restaurant Floor Plan & Tables"
        subtitle="Live seating capacity, occupancy turnover, and reservation holds"
        actions={
          <PageActions>
            <Button
              onClick={fetchTables}
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tables
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {tables.length}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {availableCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Occupied
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {occupiedCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Reserved
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {reservedCount}
            </div>
          </div>
        </Card>
      </div>

      {/* Sections Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedSection === sec
                ? 'bg-brand-navy dark:bg-brand-indigo text-white shadow-soft-xs'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            {sec.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <Card className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-indigo mb-2" />
          <span className="text-xs font-medium">Loading restaurant floor plan...</span>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTables.map((table) => {
            const badge = getTableStatusBadge(table.status);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={table.id}
                onClick={() => {
                  setActiveTable(table);
                  setNewStatus(table.status);
                }}
                className="bg-surface dark:bg-navy-800/60 border border-border dark:border-navy-700/80 rounded-xl p-3 cursor-pointer hover:border-brand-indigo hover:shadow-card-hover transition flex flex-col justify-between active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      T-{table.tableNumber}
                    </span>
                    <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                      {table.capacity} Seats
                    </Badge>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {table.section.replace('_', ' ')}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 dark:border-navy-700">
                  <Badge variant={badge.variant} dot size="sm" className="w-full justify-center">
                    <BadgeIcon className="w-3 h-3 mr-1" />
                    <span>{badge.label}</span>
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Change Status Modal */}
      {activeTable && (
        <Modal
          isOpen={!!activeTable}
          onClose={() => setActiveTable(null)}
          title={`Table ${activeTable.tableNumber} Status`}
          subtitle={`Capacity: ${activeTable.capacity} Pax • Section: ${activeTable.section}`}
          icon={<UtensilsCrossed className="w-4 h-4" />}
          size="sm"
          onSubmit={handleUpdateStatus}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTable(null)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updating}
                isLoading={updating}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Save Status
              </Button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Update Dining Status
            </label>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="AVAILABLE">Available &amp; Clean</option>
              <option value="OCCUPIED">Occupied (Seated)</option>
              <option value="RESERVED">Reserved</option>
              <option value="BILLED">Check Printed / Settling</option>
            </Select>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
