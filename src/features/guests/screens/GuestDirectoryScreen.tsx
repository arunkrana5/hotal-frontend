import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  GuestDto,
  CreateGuestRequest,
  UpdateGuestRequest,
  GuestCrmStatsDto,
  DuplicateCheckResult,
} from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable, FilterConfig } from '@/components/data-table/DataTable';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  ConfirmDialog,
} from '@/components/enterprise';
import {
  UserPlus,
  Crown,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Download,
  AlertTriangle,
  CalendarCheck,
  Eye,
  Edit2,
  Trash2,
  Power,
  DollarSign,
  Bed,
} from 'lucide-react';

export const GuestDirectoryScreen: React.FC = () => {
  const navigate = useNavigate();

  // Directory Data States
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'VIP' | 'INACTIVE'>('ALL');
  const [vipFilter, setVipFilter] = useState<string>('');
  const [idDocFilter, setIdDocFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // CRM Tab Stats
  const [stats, setStats] = useState<GuestCrmStatsDto>({
    totalCount: 0,
    activeCount: 0,
    vipCount: 0,
    inactiveCount: 0,
    totalSpend: 0,
    averageSpend: 0,
  });

  // Drawer & Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Status Change & Delete Dialogs
  const [statusGuest, setStatusGuest] = useState<GuestDto | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<GuestDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vipStatus, setVipStatus] = useState('Standard');
  const [idDocType, setIdDocType] = useState('Passport');
  const [idDocNumber, setIdDocNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [specialPreferences, setSpecialPreferences] = useState('');

  // 1. Fetch CRM Tab Counts & Stats
  const fetchStats = useCallback(async () => {
    const res = await api.request<GuestCrmStatsDto>('/pms/guests/stats');
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, []);

  // 2. Fetch Guests Table
  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });

      if (search.trim()) params.append('search', search.trim());

      // Tab mapping
      if (activeTab === 'ACTIVE') params.append('isActive', 'true');
      if (activeTab === 'INACTIVE') params.append('isActive', 'false');
      if (activeTab === 'VIP') params.append('vipStatus', 'VIP');

      // Filters
      if (vipFilter && activeTab !== 'VIP') params.append('vipStatus', vipFilter);

      const res = await api.request<PagedResult<GuestDto>>(`/pms/guests?${params.toString()}`);
      if (res.success && res.data) {
        setGuests(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search, activeTab, vipFilter]);

  useEffect(() => {
    fetchGuests();
    fetchStats();
  }, [fetchGuests, fetchStats]);

  // Real-time Duplicate Detection Debounce
  useEffect(() => {
    if (!isFormOpen) {
      setDuplicateWarning(null);
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams();
        if (email.trim()) query.append('email', email.trim());
        if (phone.trim()) query.append('phone', phone.trim());
        if (editingGuest) query.append('excludeId', editingGuest.id.toString());

        const res = await api.request<DuplicateCheckResult>(`/pms/guests/check-duplicate?${query.toString()}`);
        if (res.success && res.data && res.data.isDuplicate && res.data.matchedGuest) {
          const match = res.data.matchedGuest;
          setDuplicateWarning(
            `Potential duplicate detected: ${match.fullName} (ID #${match.id}, ${match.email}). Please verify before proceeding.`
          );
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        setDuplicateWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email, phone, isFormOpen, editingGuest]);

  // Open Create Drawer
  const handleOpenCreate = () => {
    setEditingGuest(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setVipStatus('Standard');
    setIdDocType('Passport');
    setIdDocNumber('');
    setNationality('');
    setCity('');
    setCountry('');
    setAddress('');
    setSpecialPreferences('');
    setFormError(null);
    setDuplicateWarning(null);
    setIsFormOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (guest: GuestDto) => {
    setEditingGuest(guest);
    setFirstName(guest.firstName);
    setLastName(guest.lastName);
    setEmail(guest.email);
    setPhone(guest.phone);
    setVipStatus(guest.vipStatus || 'Standard');
    setIdDocType(guest.idDocumentType || 'Passport');
    setIdDocNumber(guest.idDocumentNumber || '');
    setNationality(guest.nationality || '');
    setCity(guest.city || '');
    setCountry(guest.country || '');
    setAddress(guest.address || '');
    setSpecialPreferences(guest.specialPreferences || '');
    setFormError(null);
    setDuplicateWarning(null);
    setIsFormOpen(true);
  };

  // Save (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setFormError('First Name, Last Name, Email, and Phone Number are mandatory.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingGuest) {
        const payload: UpdateGuestRequest = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          vipStatus,
          idDocumentType: idDocType,
          idDocumentNumber: idDocNumber.trim() || undefined,
          nationality: nationality.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          address: address.trim() || undefined,
          specialPreferences: specialPreferences.trim() || undefined,
          isActive: editingGuest.isActive ?? true,
        };

        const res = await api.request<GuestDto>(`/pms/guests/${editingGuest.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (res.success) {
          setIsFormOpen(false);
          fetchGuests();
          fetchStats();
        } else {
          setFormError(res.message || 'Failed to update guest profile.');
        }
      } else {
        const payload: CreateGuestRequest = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          vipStatus,
          idDocumentType: idDocType,
          idDocumentNumber: idDocNumber.trim() || undefined,
          nationality: nationality.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          address: address.trim() || undefined,
          specialPreferences: specialPreferences.trim() || undefined,
        };

        const res = await api.request<GuestDto>('/pms/guests', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.success) {
          setIsFormOpen(false);
          fetchGuests();
          fetchStats();
        } else {
          setFormError(res.message || 'Failed to register guest profile.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleConfirmToggleStatus = async () => {
    if (!statusGuest) return;
    setActionLoading(true);
    try {
      const nextActive = !statusGuest.isActive;
      const res = await api.request(`/pms/guests/${statusGuest.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (res.success) {
        setStatusGuest(null);
        fetchGuests();
        fetchStats();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteGuest) return;
    setActionLoading(true);
    try {
      const res = await api.request(`/pms/guests/${deleteGuest.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setDeleteGuest(null);
        fetchGuests();
        fetchStats();
      } else {
        alert(res.message || 'Cannot delete guest profile.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // VIP Badge Styling
  const renderVipBadge = (vip?: string) => {
    switch (vip) {
      case 'Platinum':
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <Crown className="w-2.5 h-2.5 text-purple-500" />
            <span>Platinum VIP</span>
          </span>
        );
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-2.5 h-2.5 text-amber-500" />
            <span>Gold VIP</span>
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            <span>Silver Tier</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Standard
          </span>
        );
    }
  };

  // Table Columns - Strict One Record, One Row Standard
  const columns: ColumnDef<GuestDto>[] = useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Guest',
        cell: ({ row }) => {
          const initials = `${row.original.firstName?.[0] || ''}${row.original.lastName?.[0] || ''}`.toUpperCase();
          return (
            <div
              className="flex items-center gap-2 py-0.5 cursor-pointer group whitespace-nowrap"
              onClick={() => navigate(`/guests/${row.original.id}`)}
              title="Click to view full CRM profile"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 via-slate-800 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-[11px] font-bold text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                {initials || 'G'}
              </div>
              <span className="font-semibold text-xs text-brand-text group-hover:text-amber-500 transition-colors truncate max-w-[160px]">
                {row.original.fullName}
              </span>
              {renderVipBadge(row.original.vipStatus)}
            </div>
          );
        },
      },
      {
        accessorKey: 'id',
        header: 'Guest ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-brand-muted whitespace-nowrap">
            GST-00{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-text whitespace-nowrap">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{row.original.phone || row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalStays',
        header: 'Visits',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 font-mono text-xs font-bold text-brand-text border border-brand-border dark:border-brand-darkBorder whitespace-nowrap">
            <Bed className="w-3 h-3 text-slate-400" />
            <span>{row.original.totalStays}</span>
          </span>
        ),
      },
      {
        accessorKey: 'lifetimeSpend',
        header: 'Lifetime Spend',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            ${Number(row.original.lifetimeSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isActive ?? true ? 'ACTIVE' : 'INACTIVE'}
            label={row.original.isActive ?? true ? 'Active' : 'Inactive'}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => navigate(`/guests/${row.original.id}`)}
            onEdit={() => handleOpenEdit(row.original)}
            customActions={[
              {
                label: 'Create Booking',
                icon: <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />,
                onClick: () => navigate(`/reservations/new?guestId=${row.original.id}`),
              },
              {
                label: row.original.isActive ?? true ? 'Deactivate Profile' : 'Activate Profile',
                icon: <Power className="w-3.5 h-3.5 text-slate-400" />,
                onClick: () => setStatusGuest(row.original),
              },
              {
                label: 'Archive Profile',
                icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
                onClick: () => setDeleteGuest(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [navigate]
  );

  // Filters config for one-row toolbar
  const tableFilters: FilterConfig[] = useMemo(
    () => [
      {
        id: 'vipFilter',
        value: vipFilter,
        onChange: setVipFilter,
        placeholder: 'VIP Tier...',
        width: 'w-36',
        options: [
          { value: '', label: 'All VIP Tiers' },
          { value: 'Standard', label: 'Standard Guest' },
          { value: 'Silver', label: 'Silver Tier' },
          { value: 'Gold', label: 'Gold VIP' },
          { value: 'Platinum', label: 'Platinum VIP' },
        ],
      },
    ],
    [vipFilter]
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Guest Profiles & CRM"
        badge={<StatusBadge status="ACTIVE" label="Authoritative CRM" />}
        actions={
          <PageActions>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs shadow-soft-xs"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add Guest
            </Button>
          </PageActions>
        }
      />

      {/* 2. Professional Status Tabs with Real Counts */}
      <PageTabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab as any);
          setPageIndex(0);
        }}
        tabs={[
          { id: 'ALL', label: 'All Guests', count: stats.totalCount },
          { id: 'ACTIVE', label: 'Active Profiles', count: stats.activeCount },
          { id: 'VIP', label: 'VIP & Loyalty', count: stats.vipCount },
          { id: 'INACTIVE', label: 'Inactive / Archived', count: stats.inactiveCount },
        ]}
      />

      {/* 3. High-Density Unified Data Table */}
      <DataTable
        data={guests}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guests by name, email, phone, passport..."
        filters={tableFilters}
        onResetFilters={() => {
          setSearch('');
          setVipFilter('');
          setActiveTab('ALL');
        }}
        isFiltered={search !== '' || vipFilter !== '' || activeTab !== 'ALL'}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="hotel_guest_directory.csv"
      />

      {/* 4. Add / Edit Guest Structured Drawer */}
      <FormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingGuest ? `Edit Guest Profile #${editingGuest.id}` : 'Register New Guest Profile'}
        subtitle={
          editingGuest
            ? 'Update authoritative contact details, KYC identifiers, and stay preferences'
            : 'Create comprehensive CRM guest profile with identity and preference tracking'
        }
        submitText={isSaving ? 'Saving Profile...' : editingGuest ? 'Update Guest' : 'Save & Register'}
        isLoading={isSaving}
        width="lg"
      >
        {/* Error Notification */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="font-medium">{duplicateWarning}</span>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <FormSection title="Basic Information" description="Legal name and VIP tier classification">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alexander"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wright"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <UniversalSelect
              label="VIP Classification"
              size="sm"
              value={vipStatus}
              onChange={(val) => setVipStatus(val || 'Standard')}
              options={[
                { value: 'Standard', label: 'Standard Guest', badge: 'STD' },
                { value: 'Silver', label: 'Silver Tier Member', badge: 'SLV' },
                { value: 'Gold', label: 'Gold VIP Member', badge: 'GLD' },
                { value: 'Platinum', label: 'Platinum / Diamond VIP', badge: 'PLT' },
              ]}
              clearable={false}
            />
          </div>
        </FormSection>

        {/* Section 2: Contact Information */}
        <FormSection title="Contact Information" description="Primary communication channels">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alexander.wright@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Mobile Phone *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +44-20-7946-0921"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </FormSection>

        {/* Section 3: Address & Origin */}
        <FormSection title="Address & Origin" description="Nationality and billing residence">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nationality
            </label>
            <input
              type="text"
              placeholder="e.g. United Kingdom"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Residential / Street Address
            </label>
            <input
              type="text"
              placeholder="e.g. 10 Downing Street, Westminster"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        {/* Section 4: Identity & KYC */}
        <FormSection title="Identity & KYC" description="Government identification document">
          <div>
            <UniversalSelect
              label="Document Type"
              size="sm"
              value={idDocType}
              onChange={(val) => setIdDocType(val || 'Passport')}
              options={[
                { value: 'Passport', label: 'Passport', badge: 'PPT' },
                { value: 'NationalID', label: 'National ID Card', badge: 'NID' },
                { value: 'DrivingLicense', label: 'Driving License', badge: 'DL' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Document Number
            </label>
            <input
              type="text"
              placeholder="e.g. UK-98234710"
              value={idDocNumber}
              onChange={(e) => setIdDocNumber(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        {/* Section 5: Guest Preferences & Stay Requirements */}
        <FormSection title="Guest Preferences & Notes" description="Room, dietary, and personalized service notes">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Special Preferences &amp; Diet
            </label>
            <textarea
              rows={3}
              placeholder="e.g. High floor ocean view, non-feather pillows, early morning espresso, strictly non-smoking"
              value={specialPreferences}
              onChange={(e) => setSpecialPreferences(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 5. Activate / Deactivate Confirmation Dialog */}
      {statusGuest && (
        <ConfirmDialog
          isOpen={!!statusGuest}
          title={statusGuest.isActive ?? true ? 'Deactivate Guest Profile' : 'Activate Guest Profile'}
          description={`Are you sure you want to ${statusGuest.isActive ?? true ? 'deactivate' : 'activate'} the profile for ${statusGuest.fullName} (ID #${statusGuest.id})?`}
          confirmText={statusGuest.isActive ?? true ? 'Deactivate' : 'Activate'}
          variant={statusGuest.isActive ?? true ? 'warning' : 'primary'}
          onConfirm={handleConfirmToggleStatus}
          onClose={() => setStatusGuest(null)}
          isLoading={actionLoading}
        />
      )}

      {/* 6. Soft Delete / Archive Confirmation Dialog */}
      {deleteGuest && (
        <ConfirmDialog
          isOpen={!!deleteGuest}
          title="Archive Guest Profile"
          description={`Are you sure you want to archive ${deleteGuest.fullName}? Historical reservations and financial folios will be preserved in compliance with hospitality audit standards.`}
          confirmText="Archive Guest"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteGuest(null)}
          isLoading={actionLoading}
        />
      )}
    </PageContainer>
  );
};
