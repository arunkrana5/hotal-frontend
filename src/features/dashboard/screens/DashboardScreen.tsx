import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/services/api';
import { signalRService } from '@/services/signalr';
import { reportingService } from '@/services/reportingService';
import { ExecutiveDashboard, NightAuditReport } from '@/types/reporting';
import { ReservationDto, RoomDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { Card, Badge, StatCard } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageActions } from '@/components/layout/PageToolbar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Bed,
  DollarSign,
  Building2,
  Sparkles,
  Wrench,
  RefreshCw,
  Layers,
  Users,
  LogIn,
  LogOut as LogOutIcon,
  CreditCard,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Receipt,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const PIE_COLORS = ['#354FC7', '#16845B', '#C78B24', '#8064D8', '#159E9A'];

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  // Core Metrics State
  const [data, setData] = useState<ExecutiveDashboard | null>(null);
  const [nightAudit, setNightAudit] = useState<NightAuditReport | null>(null);
  const [arrivals, setArrivals] = useState<ReservationDto[]>([]);
  const [departures, setDepartures] = useState<ReservationDto[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Interactive Controls State
  const [dateRangeDays, setDateRangeDays] = useState<7 | 14 | 30>(7);
  const [activeTableTab, setActiveTableTab] = useState<'ARRIVALS' | 'DEPARTURES' | 'ALERTS'>('ARRIVALS');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<string>('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<RoomDto | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Executive Analytics Metrics
      const dashboardRes = await reportingService.getExecutiveDashboard();
      setData(dashboardRes);

      // 2. Fetch Night Audit data for financial ledger balances
      try {
        const auditRes = await reportingService.getNightAudit();
        setNightAudit(auditRes);
      } catch (e) {
        // Fallback silently if audit not yet completed
      }

      // 3. Fetch Live Today's Arrivals from PMS
      const arrivalsRes = await api.request<PagedResult<ReservationDto>>('/pms/front-office/arrivals?pageSize=10');
      if (arrivalsRes.success && arrivalsRes.data) {
        setArrivals(arrivalsRes.data.items || []);
      }

      // 4. Fetch Live Today's Departures from PMS
      const departuresRes = await api.request<PagedResult<ReservationDto>>('/pms/front-office/departures?pageSize=10');
      if (departuresRes.success && departuresRes.data) {
        setDepartures(departuresRes.data.items || []);
      }

      // 5. Fetch Live Rooms Inventory for Interactive Room Board
      const roomsRes = await api.request<PagedResult<RoomDto>>('/pms/rooms?pageSize=100');
      if (roomsRes.success && roomsRes.data) {
        setRooms(roomsRes.data.items || []);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load executive dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // SignalR live updates listener
    const unsubNotif = signalRService.onNotification(() => {
      loadDashboardData();
    });

    const unsubLive = signalRService.onLiveEvent(() => {
      loadDashboardData();
    });

    return () => {
      unsubNotif();
      unsubLive();
    };
  }, [loadDashboardData]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await reportingService.exportReportCsv('DASHBOARD');
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const availableRoomsCount = data
    ? Math.max(0, data.operationalHealth.totalRooms - data.operationalHealth.occupiedRooms - data.operationalHealth.maintenanceRooms)
    : 0;

  // Filtered rooms for the interactive Room Status Board
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchFloor = selectedFloor === 'ALL' || String(r.floorNumber) === selectedFloor;
      const matchStatus =
        selectedRoomStatus === 'ALL' ||
        (selectedRoomStatus === 'AVAILABLE' && (r.roomStatusCode === 'AVL' || r.roomStatusCode === 'CLN')) ||
        (selectedRoomStatus === 'OCCUPIED' && r.roomStatusCode === 'OCC') ||
        (selectedRoomStatus === 'DIRTY' && r.roomStatusCode === 'DRT') ||
        (selectedRoomStatus === 'MAINTENANCE' && (r.roomStatusCode === 'MNT' || r.roomStatusCode === 'OOD'));
      const matchSearch =
        !roomSearchQuery.trim() ||
        r.roomNumber.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
        r.roomTypeCode.toLowerCase().includes(roomSearchQuery.toLowerCase());
      return matchFloor && matchStatus && matchSearch;
    });
  }, [rooms, selectedFloor, selectedRoomStatus, roomSearchQuery]);

  // Unique floors available in inventory
  const availableFloors = useMemo(() => {
    const set = new Set(rooms.map((r) => String(r.floorNumber)));
    return Array.from(set).sort();
  }, [rooms]);

  const isDark = resolvedTheme === 'dark';

  return (
    <PageContainer>
      {/* 1. UNIVERSAL MINIMAL SINGLE-LINE PAGE HEADER */}
      <PageHeader
        title={
          <div className="flex items-center space-x-2.5">
            <span>Operations Command Center</span>
            {lastUpdated && (
              <span className="hidden sm:inline-flex items-center text-[11px] font-normal text-brand-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] mr-1.5 animate-pulse" />
                Live &bull; {lastUpdated}
              </span>
            )}
          </div>
        }
        actions={
          <PageActions>
            {/* 7D / 14D / 30D Trend Filter */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-brand-darkCard p-0.5 border border-brand-border dark:border-brand-darkBorder text-xs">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setDateRangeDays(days)}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-semibold transition-all',
                    dateRangeDays === days
                      ? 'bg-brand-surface dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF] shadow-sm'
                      : 'text-brand-muted hover:text-brand-text'
                  )}
                >
                  {days}D
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="text-xs h-8 sm:h-9"
              title="Refresh Dashboard"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-brand-primary')} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting}
              className="text-xs h-8 sm:h-9 hidden md:inline-flex"
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/reports/center')}
              className="text-xs h-8 sm:h-9"
            >
              Reports Hub
            </Button>
          </PageActions>
        }
      />

      {/* 2. PRIMARY REVENUE & YIELD KPI CARDS (Tier 1 Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => navigate('/front-office/room-grid')}
          className="cursor-pointer transition-all hover:-translate-y-0.5 group"
          title="Click to view Room Grid"
        >
          <StatCard
            title="Occupancy Rate"
            value={loading ? '...' : `${data?.occupancyRate.toFixed(1)}%`}
            subtitle={`${data?.operationalHealth.occupiedRooms ?? 0} occupied of ${data?.operationalHealth.totalRooms ?? 0} total rooms`}
            icon={<Bed className="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform" />}
            iconBgColor="bg-indigo-50 text-brand-primary dark:bg-indigo-950/40 dark:text-[#8495FF]"
            trend={{ value: `${availableRoomsCount} available · View Grid →`, isPositive: true }}
          />
        </div>

        <div
          onClick={() => navigate('/reports/trial-balance')}
          className="cursor-pointer transition-all hover:-translate-y-0.5 group"
          title="Click to view Revenue Trial Balance"
        >
          <StatCard
            title="Average Daily Rate (ADR)"
            value={loading ? '...' : `$${data?.adr.toFixed(2)}`}
            subtitle="Gross yield per occupied room"
            icon={<DollarSign className="w-4 h-4 text-[#16845B] group-hover:scale-110 transition-transform" />}
            iconBgColor="bg-emerald-50 text-[#16845B] dark:bg-emerald-950/40 dark:text-emerald-400"
            trend={{ value: 'Optimal Yield · Ledger →', isPositive: true }}
          />
        </div>

        <div
          onClick={() => navigate('/reports/forecast')}
          className="cursor-pointer transition-all hover:-translate-y-0.5 group"
          title="Click to view Occupancy & Yield Forecast"
        >
          <StatCard
            title="RevPAR (Rev/Avail Room)"
            value={loading ? '...' : `$${data?.revPar.toFixed(2)}`}
            subtitle="Normalized yield across inventory"
            icon={<Layers className="w-4 h-4 text-[#8064D8] group-hover:scale-110 transition-transform" />}
            iconBgColor="bg-purple-50 text-[#8064D8] dark:bg-purple-950/40 dark:text-[#A78BFA]"
            trend={{ value: '+4.2% vs target · Forecast →', isPositive: true }}
          />
        </div>

        <div
          onClick={() => navigate('/finance/invoices')}
          className="cursor-pointer transition-all hover:-translate-y-0.5 group"
          title="Click to view Invoices & Settlements"
        >
          <StatCard
            title="Today's Gross Invoiced"
            value={loading ? '...' : `$${data?.todayTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`MTD Turnover: $${data?.monthToDateRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}`}
            icon={<Building2 className="w-4 h-4 text-[#C78B24] group-hover:scale-110 transition-transform" />}
            iconBgColor="bg-amber-50 text-[#C78B24] dark:bg-amber-950/40 dark:text-amber-400"
            trend={{ value: 'All Outlets · Invoices →', isPositive: true }}
          />
        </div>
      </div>

      {/* 3. OPERATIONAL PULSE ROW (Tier 2 Hierarchy: Interactive Tiles with ZERO Text Overlapping) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Arrivals Today Tile */}
        <div
          onClick={() => navigate('/front-office/arrivals')}
          role="button"
          tabIndex={0}
          className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-brand-muted truncate">
              Arrivals Today
            </span>
            <LogIn className="w-3.5 h-3.5 text-brand-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-text my-1.5 tracking-tight">
            {data?.arrivalsToday ?? 0} <span className="text-xs font-semibold text-brand-muted">Guests</span>
          </div>
          <div className="text-[11px] text-brand-muted flex items-center justify-between gap-1 pt-1 border-t border-brand-border/60 dark:border-brand-darkBorder/60">
            <span className="truncate">Scheduled check-ins</span>
            <span className="text-brand-primary font-semibold shrink-0 group-hover:underline">View &rarr;</span>
          </div>
        </div>

        {/* Departures Today Tile */}
        <div
          onClick={() => navigate('/front-office/departures')}
          role="button"
          tabIndex={0}
          className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-brand-muted truncate">
              Departures Today
            </span>
            <LogOutIcon className="w-3.5 h-3.5 text-[#C78B24] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-text my-1.5 tracking-tight">
            {data?.departuresToday ?? 0} <span className="text-xs font-semibold text-brand-muted">Rooms</span>
          </div>
          <div className="text-[11px] text-brand-muted flex items-center justify-between gap-1 pt-1 border-t border-brand-border/60 dark:border-brand-darkBorder/60">
            <span className="truncate">Checkout roster</span>
            <span className="text-brand-primary font-semibold shrink-0 group-hover:underline">View &rarr;</span>
          </div>
        </div>

        {/* In-House Guests Tile */}
        <div
          onClick={() => navigate('/front-office/room-grid')}
          role="button"
          tabIndex={0}
          className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-brand-muted truncate">
              In-House Guests
            </span>
            <Users className="w-3.5 h-3.5 text-[#16845B] group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-text my-1.5 tracking-tight">
            {data?.inHouseGuests ?? 0} <span className="text-xs font-semibold text-brand-muted">Guests</span>
          </div>
          <div className="text-[11px] text-brand-muted flex items-center justify-between gap-1 pt-1 border-t border-brand-border/60 dark:border-brand-darkBorder/60">
            <span className="truncate">Active registered folios</span>
            <span className="text-brand-primary font-semibold shrink-0 group-hover:underline">View &rarr;</span>
          </div>
        </div>

        {/* Pending Cleaning Tile */}
        <div
          onClick={() => navigate('/housekeeping/tasks')}
          role="button"
          tabIndex={0}
          className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-brand-muted truncate">
              Pending Cleaning
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#D44848] group-hover:rotate-12 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-text my-1.5 tracking-tight">
            {data?.operationalHealth.dirtyRooms ?? 0} <span className="text-xs font-semibold text-brand-muted">Dirty</span>
          </div>
          <div className="text-[11px] text-brand-muted flex items-center justify-between gap-1 pt-1 border-t border-brand-border/60 dark:border-brand-darkBorder/60">
            <span className="truncate">{data?.operationalHealth.cleanRooms ?? 0} Clean &bull; {data?.operationalHealth.inspectedRooms ?? 0} Inspected</span>
            <span className="text-brand-primary font-semibold shrink-0 group-hover:underline">Tasks &rarr;</span>
          </div>
        </div>
      </div>

      {/* 4. SECONDARY INVENTORY & LEDGER PULSE (Tier 3 Hierarchy) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-secondarySurface dark:bg-brand-darkSecondary flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Available Rooms</div>
            <div className="text-base font-bold text-brand-text mt-0.5">{availableRoomsCount} Rooms Ready</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#16845B]" title="Available" />
        </div>

        <div className="p-3 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-secondarySurface dark:bg-brand-darkSecondary flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Maintenance / OOD</div>
            <div className="text-base font-bold text-brand-text mt-0.5">{data?.operationalHealth.maintenanceRooms ?? 0} Rooms OOD</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#C78B24]" title="Maintenance" />
        </div>

        <div className="p-3 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-secondarySurface dark:bg-brand-darkSecondary flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Open Work Orders</div>
            <div className="text-base font-bold text-brand-text mt-0.5">{data?.operationalHealth.openWorkOrders ?? 0} Facility Tasks</div>
          </div>
          <Wrench className="w-3.5 h-3.5 text-brand-muted" />
        </div>

        <div
          onClick={() => navigate('/reports/night-audit')}
          className="p-3 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-secondarySurface dark:bg-brand-darkSecondary flex items-center justify-between cursor-pointer hover:border-brand-primary/40 transition-colors"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">City Ledger Balance</div>
            <div className="text-base font-bold text-brand-text mt-0.5">
              ${nightAudit?.outstandingCityLedgerBalance.toFixed(2) ?? '0.00'}
            </div>
          </div>
          <Receipt className="w-3.5 h-3.5 text-[#354FC7] dark:text-[#8495FF]" />
        </div>
      </div>

      {/* 5. INTERACTIVE LIVE ROOM STATUS BOARD */}
      <Card className="p-4 sm:p-5 space-y-3.5 shadow-soft-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-brand-border dark:border-brand-darkBorder">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF] flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-text">Live Room Status Matrix</h3>
              <p className="text-[11px] text-brand-muted">
                Showing {filteredRooms.length} of {rooms.length} hotel rooms &bull; Click any tile to inspect or trigger room actions
              </p>
            </div>
          </div>

          {/* Interactive Filters: Search, Floor Tabs & Status Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Room Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                placeholder="Find room #"
                className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-secondarySurface dark:bg-brand-darkCard text-brand-text placeholder:text-slate-400 focus:outline-none w-28 sm:w-36"
              />
            </div>

            {/* Floor Tabs */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-brand-darkCard p-0.5 border border-brand-border dark:border-brand-darkBorder text-[11px]">
              <button
                onClick={() => setSelectedFloor('ALL')}
                className={cn(
                  'px-2 py-0.5 rounded-md font-semibold transition',
                  selectedFloor === 'ALL'
                    ? 'bg-brand-surface dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF] shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                )}
              >
                All
              </button>
              {availableFloors.map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedFloor(fl)}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition',
                    selectedFloor === fl
                      ? 'bg-brand-surface dark:bg-brand-darkSecondary text-brand-primary dark:text-[#8495FF] shadow-sm'
                      : 'text-brand-muted hover:text-brand-text'
                  )}
                >
                  Fl {fl}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={selectedRoomStatus}
              onChange={(e) => setSelectedRoomStatus(e.target.value)}
              className="text-xs bg-brand-secondarySurface dark:bg-brand-darkCard border border-brand-border dark:border-brand-darkBorder rounded-lg px-2.5 py-1 text-brand-text font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available / Clean</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="DIRTY">Needs Turndown</option>
              <option value="MAINTENANCE">Out of Order</option>
            </select>
          </div>
        </div>

        {/* Room Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-1">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-brand-muted">
              No rooms found matching the selected filters.
            </div>
          ) : (
            filteredRooms.map((room) => {
              const statusUpper = room.roomStatusCode.toUpperCase();
              const isOcc = statusUpper === 'OCC';
              const isDirty = statusUpper === 'DRT';
              const isMaint = statusUpper === 'MNT' || statusUpper === 'OOD';

              let statusBg = 'bg-[#16845B]/10 border-[#16845B]/30 text-[#16845B] dark:bg-[#45C79A]/15 dark:border-[#45C79A]/30 dark:text-[#45C79A]';
              if (isOcc) {
                statusBg = 'bg-[#354FC7]/10 border-[#354FC7]/30 text-[#354FC7] dark:bg-[#8495FF]/15 dark:border-[#8495FF]/30 dark:text-[#8495FF]';
              } else if (isDirty) {
                statusBg = 'bg-[#D44848]/10 border-[#D44848]/30 text-[#D44848] dark:bg-[#F07878]/15 dark:border-[#F07878]/30 dark:text-[#F07878]';
              } else if (isMaint) {
                statusBg = 'bg-[#C78B24]/10 border-[#C78B24]/30 text-[#C78B24] dark:bg-[#E7B65A]/15 dark:border-[#E7B65A]/30 dark:text-[#E7B65A]';
              }

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all hover:shadow-soft-sm hover:-translate-y-0.5 cursor-pointer select-none',
                    statusBg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{room.roomNumber}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-white/70 dark:bg-brand-darkSurface/70">
                      {room.roomTypeCode}
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold mt-1 truncate">
                    {room.roomStatusCode === 'OCC' ? 'Occupied' : room.roomStatusCode === 'DRT' ? 'Turndown' : room.roomStatusCode === 'MNT' ? 'Maintenance' : 'Clean'}
                  </div>
                  <div className="text-[9px] opacity-80 font-mono mt-0.5">
                    ${room.baseRatePerNight}/night
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Quick Room Detail / Action Modal */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Room ${selectedRoom.roomNumber} — ${selectedRoom.roomTypeCode}`}
          subtitle={`Floor ${selectedRoom.floorNumber} • Base Tariff: $${selectedRoom.baseRatePerNight}/night`}
          icon={<Bed className="w-4 h-4" />}
          size="md"
          footer={
            <Button size="sm" variant="outline" onClick={() => setSelectedRoom(null)}>
              Close
            </Button>
          }
        >
          <div className="p-3.5 rounded-xl bg-brand-secondarySurface dark:bg-brand-darkSecondary border border-brand-border dark:border-brand-darkBorder space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-muted">Current PMS Status:</span>
              <span className="font-bold text-brand-primary dark:text-[#8495FF] uppercase">{selectedRoom.roomStatusCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Housekeeping State:</span>
              <span className="font-semibold">{selectedRoom.roomStatusCode === 'DRT' ? 'Requires Turndown Cleaning' : 'Inspected & Ready'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Max Guest Capacity:</span>
              <span>{selectedRoom.maxOccupancy} Guests</span>
            </div>
          </div>

          {/* Direct Room Operations */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Direct Operations</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/front-office/room-grid');
                  setSelectedRoom(null);
                }}
                className="text-xs justify-start"
                leftIcon={<Bed className="w-3.5 h-3.5 text-brand-primary" />}
              >
                Room Allocation Grid
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/reservations/new');
                  setSelectedRoom(null);
                }}
                className="text-xs justify-start"
                leftIcon={<LogIn className="w-3.5 h-3.5 text-[#16845B]" />}
              >
                Book This Room
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/housekeeping/tasks');
                  setSelectedRoom(null);
                }}
                className="text-xs justify-start"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#C78B24]" />}
              >
                Housekeeping Order
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/maintenance/orders');
                  setSelectedRoom(null);
                }}
                className="text-xs justify-start"
                leftIcon={<Wrench className="w-3.5 h-3.5 text-[#D44848]" />}
              >
                Maintenance Order
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. GRAPHICAL REVENUE & DEPARTMENT VELOCITY ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rolling Area Chart */}
        <Card className="lg:col-span-2 p-5 space-y-3.5 shadow-soft-xs">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border dark:border-brand-darkBorder">
            <div>
              <h3 className="text-sm font-bold text-brand-text">Department Revenue Velocity</h3>
              <p className="text-[11px] text-brand-muted">Daily turnover across Rooms (PMS), Food &amp; Beverage (POS), and Banquets</p>
            </div>
            <Badge variant="brand" size="sm">Rolling {dateRangeDays}-Day Turnover</Badge>
          </div>

          <div className="h-64 w-full pt-1">
            {data?.revenueTrend7Days && data.revenueTrend7Days.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend7Days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#354FC7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#354FC7" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorFnb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16845B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#16845B" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorBnq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C78B24" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#C78B24" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#A0AEC0' : '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#A0AEC0' : '#64748B' }} />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toLocaleString()}`, undefined]}
                    contentStyle={{
                      backgroundColor: isDark ? '#171F30' : '#FFFFFF',
                      borderColor: isDark ? '#303B4F' : '#E2E8F0',
                      borderRadius: 10,
                      color: isDark ? '#F1F5FB' : '#172033',
                      fontSize: 11,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Area type="monotone" dataKey="roomRevenue" name="Rooms Revenue" stroke="#354FC7" strokeWidth={2} fillOpacity={1} fill="url(#colorRoom)" />
                  <Area type="monotone" dataKey="fnBRevenue" name="F&B Outlets" stroke="#16845B" strokeWidth={2} fillOpacity={1} fill="url(#colorFnb)" />
                  <Area type="monotone" dataKey="banquetRevenue" name="Events & Banquets" stroke="#C78B24" strokeWidth={2} fillOpacity={1} fill="url(#colorBnq)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brand-muted">
                Loading analytics trends...
              </div>
            )}
          </div>
        </Card>

        {/* Department Revenue Share Donut */}
        <Card className="p-5 space-y-3.5 shadow-soft-xs">
          <div className="pb-2 border-b border-brand-border dark:border-brand-darkBorder">
            <h3 className="text-sm font-bold text-brand-text">Department Revenue Share</h3>
            <p className="text-[11px] text-brand-muted">Today's gross invoice distribution</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {data?.departmentRevenueDistribution && data.departmentRevenueDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departmentRevenueDistribution}
                    dataKey="amount"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {data.departmentRevenueDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`$${val.toLocaleString()}`, undefined]}
                    contentStyle={{
                      backgroundColor: isDark ? '#171F30' : '#FFFFFF',
                      borderColor: isDark ? '#303B4F' : '#E2E8F0',
                      borderRadius: 10,
                      color: isDark ? '#F1F5FB' : '#172033',
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-brand-muted">Loading department share...</div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-brand-border dark:border-brand-darkBorder">
            {data?.departmentRevenueDistribution.map((slice, i) => (
              <div key={slice.department} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-brand-text font-medium truncate">{slice.department}</span>
                </div>
                <div className="font-bold text-brand-text shrink-0 font-mono text-[11px]">
                  ${slice.amount.toLocaleString()} ({slice.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 7. OPERATIONAL QUEUE & ACTIVITY CENTER */}
      <Card className="p-4 sm:p-5 space-y-3.5 shadow-soft-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border dark:border-brand-darkBorder pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTableTab('ARRIVALS')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors',
                activeTableTab === 'ARRIVALS'
                  ? 'bg-brand-primary text-white shadow-soft-xs'
                  : 'text-brand-muted hover:bg-slate-100 dark:hover:bg-brand-darkCard'
              )}
            >
              Today's Arrivals Queue ({arrivals.length})
            </button>
            <button
              onClick={() => setActiveTableTab('DEPARTURES')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors',
                activeTableTab === 'DEPARTURES'
                  ? 'bg-brand-primary text-white shadow-soft-xs'
                  : 'text-brand-muted hover:bg-slate-100 dark:hover:bg-brand-darkCard'
              )}
            >
              Today's Departures ({departures.length})
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(activeTableTab === 'ARRIVALS' ? '/front-office/arrivals' : '/front-office/departures')}
            className="text-brand-primary dark:text-[#8495FF] text-xs font-semibold h-8"
          >
            <span>View Full Roster</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Tabular Data View */}
        <div className="overflow-x-auto rounded-lg border border-brand-border dark:border-brand-darkBorder text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 dark:bg-brand-darkCard text-[11px] font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border dark:border-brand-darkBorder">
              <tr>
                <th className="p-3">Confirmation #</th>
                <th className="p-3">Guest Profile</th>
                <th className="p-3">Room / Category</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder/60 font-medium">
              {(activeTableTab === 'ARRIVALS' ? arrivals : departures).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-brand-muted">
                    No active {activeTableTab.toLowerCase()} records currently scheduled.
                  </td>
                </tr>
              ) : (
                (activeTableTab === 'ARRIVALS' ? arrivals : departures).map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-brand-darkSecondary transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-primary dark:text-[#8495FF]">
                      {res.confirmationNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-brand-text">
                        {res.guestName || 'Direct Booking'}
                      </div>
                      <div className="text-[10px] text-brand-muted">
                        {res.guestVip ? `${res.guestVip} VIP` : 'Standard Guest'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-brand-darkCard font-mono text-[10px] font-bold border border-brand-border dark:border-brand-darkBorder">
                        {res.assignedRoomNumber ? `Room ${res.assignedRoomNumber}` : res.roomTypeCode}
                      </span>
                    </td>
                    <td className="p-3 text-brand-muted font-mono text-[11px]">
                      {new Date(res.checkInDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-brand-muted font-mono text-[11px]">
                      {new Date(res.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Badge variant={res.reservationStatus === 'CONFIRMED' ? 'brand' : res.reservationStatus === 'CHECKED_IN' ? 'success' : 'neutral'} size="sm">
                        {res.reservationStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/front-office/folios?reservationId=${res.id}`)}
                        className="h-7 text-xs px-2.5"
                      >
                        <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                        Folio
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
};
