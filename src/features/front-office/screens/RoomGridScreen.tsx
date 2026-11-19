import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { RoomDto, RoomGridSummaryDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Bed,
  CheckCircle2,
  Clock,
  Sparkles,
  Wrench,
  Ban,
  Layers,
  Key,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const RoomGridScreen: React.FC = () => {
  const [summary, setSummary] = useState<RoomGridSummaryDto | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<number | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Room modal
  const [selectedRoom, setSelectedRoom] = useState<RoomDto | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchGrid = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (floorFilter !== 'ALL') params.append('floor', floorFilter.toString());

      const res = await api.request<RoomGridSummaryDto>(`/pms/front-office/room-grid?${params.toString()}`);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, floorFilter]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const handleUpdateStatus = async (roomId: number, status: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const res = await api.request(`/pms/rooms/${roomId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusCode: status, notes: notes || '' }),
      });
      if (res.success) {
        setSelectedRoom(null);
        fetchGrid();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (code: string) => {
    switch (code) {
      case 'CLN':
        return {
          label: 'Clean & Ready',
          color: 'bg-[#159B72]/10 text-[#11835F] border-[#159B72]/20 dark:bg-[#159B72]/20 dark:text-[#2DD4BF]',
          icon: Sparkles,
          dot: 'bg-[#159B72]',
        };
      case 'DRT':
        return {
          label: 'Dirty / Vacant',
          color: 'bg-[#E5A13B]/10 text-[#B87A22] border-[#E5A13B]/20 dark:bg-[#E5A13B]/20 dark:text-[#FBBF24]',
          icon: Clock,
          dot: 'bg-[#E5A13B]',
        };
      case 'OCC':
        return {
          label: 'Occupied',
          color: 'bg-[#356AE6]/10 text-[#2552B8] border-[#356AE6]/20 dark:bg-[#356AE6]/20 dark:text-[#60A5FA]',
          icon: Bed,
          dot: 'bg-[#356AE6]',
        };
      case 'INS':
        return {
          label: 'Inspected',
          color: 'bg-[#159E9A]/10 text-[#117F7B] border-[#159E9A]/20 dark:bg-[#159E9A]/20 dark:text-[#2DD4BF]',
          icon: CheckCircle2,
          dot: 'bg-[#159E9A]',
        };
      case 'MNT':
        return {
          label: 'Maintenance',
          color: 'bg-[#8064D8]/10 text-[#674DBA] border-[#8064D8]/20 dark:bg-[#8064D8]/20 dark:text-[#A78BFA]',
          icon: Wrench,
          dot: 'bg-[#8064D8]',
        };
      case 'OOD':
        return {
          label: 'Out of Order',
          color: 'bg-[#DC5353]/10 text-[#B83E3E] border-[#DC5353]/20 dark:bg-[#DC5353]/20 dark:text-[#F87171]',
          icon: Ban,
          dot: 'bg-[#DC5353]',
        };
      default:
        return {
          label: code,
          color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
          icon: Bed,
          dot: 'bg-slate-400',
        };
    }
  };

  const occupancyRate = summary && summary.totalRooms > 0
    ? ((summary.occupiedCount / summary.totalRooms) * 100).toFixed(1)
    : '0.0';

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Front Office', href: '/front-office/room-grid' },
          { label: 'Room Availability Matrix' },
        ]}
        title="Room Availability Matrix"
        subtitle="Live inventory, room turnovers, key assignments, and floor status"
        icon={<Layers className="w-4 h-4" />}
        badge={<Badge variant="info">Floor Operations</Badge>}
        actions={
          <PageActions>
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface dark:bg-navy-900 text-xs">
              <span className="text-slate-500 font-medium">Occupancy:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{occupancyRate}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGrid}
              disabled={isLoading}
              icon={<RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-indigo-600')} />}
            >
              Refresh
            </Button>
          </PageActions>
        }
      />

      {/* KPI Status Filter Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'ALL'
                ? 'border-blue-brand ring-2 ring-blue-brand/20 bg-blue-50/60 dark:bg-blue-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total Rooms</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.totalRooms}</div>
          </button>

          <button
            onClick={() => setStatusFilter('OCC')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'OCC'
                ? 'border-blue-brand ring-2 ring-blue-brand/20 bg-blue-50/60 dark:bg-blue-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-brand">Occupied</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.occupiedCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('CLN')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'CLN'
                ? 'border-[#159B72] ring-2 ring-[#159B72]/20 bg-emerald-50/60 dark:bg-emerald-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#159B72]">Clean &amp; Ready</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.cleanCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('DRT')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'DRT'
                ? 'border-[#E5A13B] ring-2 ring-[#E5A13B]/20 bg-amber-50/60 dark:bg-amber-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#E5A13B]">Dirty / Vacant</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.dirtyCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('INS')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'INS'
                ? 'border-[#159E9A] ring-2 ring-[#159E9A]/20 bg-teal-50/60 dark:bg-teal-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#159E9A]">Inspected</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.inspectedCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('MNT')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'MNT'
                ? 'border-[#8064D8] ring-2 ring-[#8064D8]/20 bg-purple-50/60 dark:bg-purple-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8064D8]">Maintenance</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.maintenanceCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('OOD')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all shadow-soft-xs',
              statusFilter === 'OOD'
                ? 'border-[#DC5353] ring-2 ring-[#DC5353]/20 bg-red-50/60 dark:bg-red-950/40'
                : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSurface hover:border-slate-300'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#DC5353]">Out of Order</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.outOfOrderCount}</div>
          </button>
        </div>
      )}

      {/* Floor Filter Bar */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-brand-muted font-bold uppercase tracking-wider text-[10px]">Filter Floor:</span>
        <button
          onClick={() => setFloorFilter('ALL')}
          className={cn(
            'px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-soft-xs',
            floorFilter === 'ALL'
              ? 'bg-navy-900 text-white border-navy-900 dark:bg-blue-brand dark:border-blue-brand'
              : 'border-brand-border bg-white text-slate-600 hover:bg-slate-50 dark:border-brand-darkBorder dark:bg-brand-darkSurface dark:text-slate-300'
          )}
        >
          All Floors
        </button>
        {[1, 2, 3].map((fl) => (
          <button
            key={fl}
            onClick={() => setFloorFilter(fl)}
            className={cn(
              'px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-soft-xs',
              floorFilter === fl
                ? 'bg-navy-900 text-white border-navy-900 dark:bg-blue-brand dark:border-blue-brand'
                : 'border-brand-border bg-white text-slate-600 hover:bg-slate-50 dark:border-brand-darkBorder dark:bg-brand-darkSurface dark:text-slate-300'
            )}
          >
            Floor {fl}
          </button>
        ))}
      </div>

      {/* Floor-by-Floor Visual Room Matrix */}
      {summary && summary.floors.length > 0 ? (
        <div className="space-y-4">
          {summary.floors.map((fl) => (
            <div
              key={fl.floorNumber}
              className="bg-white dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl p-4 sm:p-5 shadow-soft-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-brand-border dark:border-brand-darkBorder pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-brand/10 text-blue-brand font-black text-xs flex items-center justify-center">
                    {fl.floorNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Floor {fl.floorNumber}
                  </h3>
                </div>
                <span className="text-xs text-brand-muted font-medium">
                  {fl.rooms.length} Rooms
                </span>
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {fl.rooms.map((room) => {
                  const statusInfo = getStatusBadge(room.roomStatusCode);
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room);
                        setNewStatus(room.roomStatusCode);
                        setStatusNotes(room.notes || '');
                      }}
                      className="group cursor-pointer p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/40 dark:bg-brand-darkCard hover:border-blue-brand hover:shadow-card-hover transition-all duration-150 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white group-hover:text-blue-brand">
                          {room.roomNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {room.roomTypeCode}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-brand-border dark:border-brand-darkBorder">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          ${room.baseRatePerNight}
                        </span>
                        {room.keyCardUid && (
                          <span title={`Key Card: ${room.keyCardUid}`}>
                            <Key className="w-3.5 h-3.5 text-blue-brand" />
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-medium border',
                          statusInfo.color
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusInfo.dot)} />
                        <span className="truncate">{statusInfo.label}</span>
                      </div>

                      {room.notes && (
                        <div className="text-[10px] text-brand-muted truncate italic">
                          "{room.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl p-12 text-center text-slate-400 text-xs shadow-soft-xs">
          No rooms found matching the selected filter criteria.
        </div>
      )}

      {/* Room Details & Status Transition Modal */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Room ${selectedRoom.roomNumber} — Operations`}
          subtitle={`Floor ${selectedRoom.floorNumber} • Type: ${selectedRoom.roomTypeCode} • Base Rate: $${selectedRoom.baseRatePerNight}/night`}
          icon={<Bed className="w-4 h-4" />}
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedRoom(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => handleUpdateStatus(selectedRoom.id, newStatus, statusNotes)}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Apply Status
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 mb-1.5">
                Update Operational Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'CLN', label: 'Clean & Ready' },
                  { code: 'INS', label: 'Inspected' },
                  { code: 'DRT', label: 'Dirty / Vacant' },
                  { code: 'OCC', label: 'Occupied' },
                  { code: 'MNT', label: 'Maintenance' },
                  { code: 'OOD', label: 'Out of Order' },
                ].map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setNewStatus(s.code)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all shadow-soft-xs',
                      newStatus === s.code
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-navy-800 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span>{s.label}</span>
                    {newStatus === s.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                Housekeeping / Engineering Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cleaned by Team A, Linens replaced..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
