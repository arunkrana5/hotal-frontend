import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { RoomGridSummaryDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Select } from '@/components/common/Input';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Wrench,
  Search,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const RoomStatusBoardScreen: React.FC = () => {
  const [summary, setSummary] = useState<RoomGridSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (selectedFloor !== null) queryParams.append('floor', selectedFloor.toString());
    if (statusFilter) queryParams.append('status', statusFilter);

    const res = await api.get<RoomGridSummaryDto>(`/pms/front-office/room-grid?${queryParams.toString()}`);
    if (res.success && res.data) {
      setSummary(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, statusFilter]);

  const handleUpdateStatus = async (roomId: number, newStatus: string) => {
    setActionLoading(roomId);
    const res = await api.put(`/pms/rooms/${roomId}/status`, {
      statusCode: newStatus,
      notes: `Housekeeping status board update: ${newStatus}`,
    });
    if (res.success) {
      await fetchRooms();
    }
    setActionLoading(null);
  };

  const getStatusBadge = (code: string) => {
    switch (code) {
      case 'CLN':
        return { label: 'Clean & Ready', variant: 'success' as const, icon: CheckCircle2 };
      case 'DRT':
        return { label: 'Dirty / Turnover', variant: 'danger' as const, icon: AlertTriangle };
      case 'INS':
        return { label: 'Inspected & Approved', variant: 'brand' as const, icon: ShieldCheck };
      case 'OCC':
        return { label: 'Occupied In-House', variant: 'warning' as const, icon: Clock };
      case 'MNT':
        return { label: 'Out of Order / Maint', variant: 'purple' as const, icon: Wrench };
      default:
        return { label: code, variant: 'neutral' as const, icon: Sparkles };
    }
  };

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Housekeeping', href: '/housekeeping/status' },
          { label: 'Room Status Board' },
        ]}
        title="Room Status Board"
        subtitle="Floor turnovers, inspection workflows, cleanliness matrix, and quick status dispatch"
        icon={<Sparkles className="w-4 h-4" />}
        badge={<Badge variant="teal">Housekeeping</Badge>}
        actions={
          <PageActions>
            <Button
              onClick={fetchRooms}
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </PageActions>
        }
      />

      {/* KPI Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Rooms
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {summary.totalRooms}
            </div>
          </Card>
          <Card className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Clean &amp; Ready
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.cleanCount}
            </div>
          </Card>
          <Card className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50">
            <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Dirty / Turnover
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {summary.dirtyCount}
            </div>
          </Card>
          <Card className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
            <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Inspected
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {summary.inspectedCount}
            </div>
          </Card>
          <Card className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50">
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Occupied
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {summary.occupiedCount}
            </div>
          </Card>
          <Card className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50">
            <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Maintenance
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {summary.maintenanceCount}
            </div>
          </Card>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            <Input
              type="text"
              placeholder="Search room #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="w-36">
            <Select
              value={selectedFloor ?? ''}
              onChange={(e) => setSelectedFloor(e.target.value ? parseInt(e.target.value) : null)}
              className="h-9 text-xs"
            >
              <option value="">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: '', label: 'All Rooms' },
            { id: 'DRT', label: 'Dirty' },
            { id: 'CLN', label: 'Clean' },
            { id: 'INS', label: 'Inspected' },
            { id: 'OCC', label: 'Occupied' },
            { id: 'MNT', label: 'Maintenance' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st.id
                  ? 'bg-brand-indigo text-white shadow-soft-xs'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Rooms Matrix */}
      {loading ? (
        <Card className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-indigo mb-2" />
          <span className="text-xs font-medium">Syncing housekeeping status matrix...</span>
        </Card>
      ) : summary?.floors.length === 0 ? (
        <Card className="py-16 text-center text-slate-400 text-xs">
          No rooms match the selected filter criteria.
        </Card>
      ) : (
        <div className="space-y-6">
          {summary?.floors.map((floor) => {
            const filteredRooms = floor.rooms.filter((r) =>
              searchQuery ? r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) : true
            );

            if (filteredRooms.length === 0) return null;

            return (
              <Card key={floor.floorNumber} className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-indigo/10 text-brand-indigo dark:text-brand-blue">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Floor {floor.floorNumber}
                    </h3>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {filteredRooms.length} Rooms Assigned
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredRooms.map((room) => {
                    const badge = getStatusBadge(room.roomStatusCode);
                    const BadgeIcon = badge.icon;
                    const isBusy = actionLoading === room.id;

                    return (
                      <div
                        key={room.id}
                        className="bg-slate-50/70 dark:bg-navy-800/50 border border-border dark:border-navy-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-brand-indigo/40 hover:shadow-card-hover transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                              Room {room.roomNumber}
                            </span>
                            <Badge variant="neutral" size="sm" className="font-mono">
                              {room.roomTypeCode}
                            </Badge>
                          </div>

                          <div className="mb-2">
                            <Badge variant={badge.variant} dot size="sm">
                              <BadgeIcon className="w-3 h-3 mr-1" />
                              {badge.label}
                            </Badge>
                          </div>

                          {room.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                              "{room.notes}"
                            </p>
                          )}
                        </div>

                        {/* Quick Housekeeping Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-border dark:border-navy-700 flex items-center gap-2">
                          {room.roomStatusCode === 'DRT' && (
                            <Button
                              disabled={isBusy}
                              size="xs"
                              variant="success"
                              onClick={() => handleUpdateStatus(room.id, 'CLN')}
                              className="w-full font-semibold flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Clean</span>
                            </Button>
                          )}

                          {room.roomStatusCode === 'CLN' && (
                            <Button
                              disabled={isBusy}
                              size="xs"
                              variant="secondary"
                              onClick={() => handleUpdateStatus(room.id, 'INS')}
                              className="w-full font-semibold flex items-center justify-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Inspect / Approve</span>
                            </Button>
                          )}

                          {room.roomStatusCode !== 'DRT' && room.roomStatusCode !== 'OCC' && (
                            <Button
                              disabled={isBusy}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(room.id, 'DRT')}
                              className="text-slate-400 hover:text-danger text-[11px]"
                              title="Reset to Dirty"
                            >
                              Mark Dirty
                            </Button>
                          )}

                          {room.roomStatusCode === 'OCC' && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold py-1">
                              Guest In Residence
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
