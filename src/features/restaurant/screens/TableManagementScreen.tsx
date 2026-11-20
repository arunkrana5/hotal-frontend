import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { DiningTableDto } from '@/types/operations';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  StatusBadge,
  FormDrawer,
  FormSection,
} from '@/components/enterprise';
import {
  UtensilsCrossed,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Receipt,
  Layers,
  ArrowRight,
  Download,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const TableManagementScreen: React.FC = () => {
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  // Status Change Drawer
  const [activeTable, setActiveTable] = useState<DiningTableDto | null>(null);
  const [newStatus, setNewStatus] = useState<string>('AVAILABLE');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    const res = await api.get<DiningTableDto[]>('/restaurant/tables');
    if (res.success && res.data) {
      setTables(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

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

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchSection = sectionFilter === 'ALL' || t.section === sectionFilter;
      const matchStatus = statusTab === 'ALL' || t.status === statusTab;
      return matchSection && matchStatus;
    });
  }, [tables, sectionFilter, statusTab]);

  const countAvailable = useMemo(() => tables.filter((t) => t.status === 'AVAILABLE').length, [tables]);
  const countOccupied = useMemo(() => tables.filter((t) => t.status === 'OCCUPIED').length, [tables]);
  const countReserved = useMemo(() => tables.filter((t) => t.status === 'RESERVED').length, [tables]);

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Restaurant Table Management"
        badge={<StatusBadge status="ACTIVE" label="Live Dining Floor" />}
        actions={
          <PageActions>
            <Link to="/restaurant/pos">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open POS Terminal
              </Button>
            </Link>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={statusTab}
        onChange={setStatusTab}
        tabs={[
          { id: 'ALL', label: 'All Tables', count: tables.length },
          { id: 'AVAILABLE', label: 'Available Ready', count: countAvailable },
          { id: 'OCCUPIED', label: 'Dining (Occupied)', count: countOccupied },
          { id: 'RESERVED', label: 'Reserved', count: countReserved },
          { id: 'BILLED', label: 'Check Printed' },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        filters={[
          {
            id: 'section',
            label: 'Dining Section',
            value: sectionFilter,
            options: [
              { label: 'All Dining Zones', value: 'ALL' },
              { label: 'Main Dining Room', value: 'MAIN_DINING' },
              { label: 'Outdoor Terrace', value: 'TERRACE' },
              { label: 'Rooftop Lounge', value: 'ROOFTOP' },
              { label: 'Cocktail Bar', value: 'BAR' },
              { label: 'Private Dining Suites', value: 'PRIVATE_DINING' },
            ],
            onChange: setSectionFilter,
            width: 'w-48',
          },
        ]}
        onResetFilters={() => setSectionFilter('ALL')}
        isFiltered={sectionFilter !== 'ALL'}
      />

      {/* 4. Interactive Table Floor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
        {filteredTables.map((table) => {
          return (
            <div
              key={table.id}
              onClick={() => {
                setActiveTable(table);
                setNewStatus(table.status);
              }}
              className={cn(
                'p-3.5 rounded-xl border transition-all cursor-pointer select-none group flex flex-col justify-between h-32',
                table.status === 'AVAILABLE' &&
                  'bg-brand-surface dark:bg-brand-darkSurface border-[#16845B]/30 hover:border-[#16845B] hover:shadow-soft-md',
                table.status === 'OCCUPIED' &&
                  'bg-red-50/50 dark:bg-red-950/20 border-[#D44848]/30 hover:border-[#D44848] hover:shadow-soft-md',
                table.status === 'RESERVED' &&
                  'bg-amber-50/50 dark:bg-amber-950/20 border-[#C78B24]/30 hover:border-[#C78B24] hover:shadow-soft-md',
                table.status === 'BILLED' &&
                  'bg-blue-50/50 dark:bg-blue-950/20 border-[#2876C7]/30 hover:border-[#2876C7] hover:shadow-soft-md'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-brand-text">
                    Table #{table.tableNumber}
                  </span>
                  <div className="text-[10px] text-brand-muted uppercase font-mono mt-0.5">
                    {table.section.replace(/_/g, ' ')}
                  </div>
                </div>

                <StatusBadge status={table.status} dot={false} />
              </div>

              <div className="pt-2 border-t border-brand-border dark:border-brand-darkBorder flex items-center justify-between text-[11px] text-brand-muted">
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{table.capacity} Seats</span>
                </span>
                <span className="text-[10px] text-brand-primary dark:text-[#8495FF] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                  Change &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Update Status Drawer */}
      {activeTable && (
        <FormDrawer
          isOpen={!!activeTable}
          onClose={() => setActiveTable(null)}
          onSubmit={handleUpdateStatus}
          title={`Update Table #${activeTable.tableNumber}`}
          subtitle={`Floor: ${activeTable.section.replace(/_/g, ' ')} | Capacity: ${activeTable.capacity} Seats`}
          submitText={updating ? 'Updating...' : 'Save Table Status'}
          isLoading={updating}
          width="md"
        >
          <FormSection title="Dining Status" description="Select operational state for this table">
            <div className="sm:col-span-2 space-y-2">
              {[
                { value: 'AVAILABLE', label: 'Available (Clean & Ready for Seating)', desc: 'Table is empty and cleared for new guests' },
                { value: 'OCCUPIED', label: 'Occupied (Dining in Progress)', desc: 'Guests are seated, active order in service' },
                { value: 'RESERVED', label: 'Reserved (Booked for Event)', desc: 'Table blocked for scheduled reservation' },
                { value: 'BILLED', label: 'Check Printed (Awaiting Settlement)', desc: 'Bill has been presented to the guest' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all',
                    newStatus === opt.value
                      ? 'border-brand-primary bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-brand-primary'
                      : 'border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name="tableStatus"
                    value={opt.value}
                    checked={newStatus === opt.value}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                  />
                  <div>
                    <div className="font-bold text-xs text-brand-text">{opt.label}</div>
                    <div className="text-[11px] text-brand-muted mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormSection>
        </FormDrawer>
      )}
    </PageContainer>
  );
};
