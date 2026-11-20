import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { GuestDto, CreateGuestRequest } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
} from '@/components/enterprise';
import {
  Users,
  UserPlus,
  Crown,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Download,
  AlertCircle,
  FileText,
  CalendarCheck,
} from 'lucide-react';

export const GuestDirectoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [vipTab, setVipTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Guest Form State
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
  const [specialPreferences, setSpecialPreferences] = useState('');

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (vipTab !== 'ALL') params.append('vipStatus', vipTab);

      const res = await api.request<PagedResult<GuestDto>>(`/pms/guests?${params.toString()}`);
      if (res.success && res.data) {
        setGuests(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search, vipTab]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('First name, last name, email, and phone number are mandatory.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
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
        specialPreferences: specialPreferences.trim() || undefined,
      };

      const res = await api.request<GuestDto>('/pms/guests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setShowCreateDrawer(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setIdDocNumber('');
        setNationality('');
        setCity('');
        setCountry('');
        setSpecialPreferences('');
        fetchGuests();
      } else {
        setErrorMsg(res.message || 'Failed to register guest profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getVipBadge = (vip?: string) => {
    switch (vip) {
      case 'Platinum':
      case 'VIP':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5 text-purple-400" />
            <span>{vip}</span>
          </span>
        );
      case 'Gold':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5 text-amber-500" />
            <span>Gold</span>
          </span>
        );
      case 'Silver':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            Silver
          </span>
        );
      default:
        return <StatusBadge status="STANDARD" label="Standard" />;
    }
  };

  const columns: ColumnDef<GuestDto>[] = useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Guest Profile',
        cell: ({ row }) => (
          <div className="py-0.5">
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
              <span>{row.original.fullName}</span>
              {getVipBadge(row.original.vipStatus)}
            </div>
            <div className="text-[11px] text-brand-muted font-mono mt-0.5">
              Guest ID #{row.original.id}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Contact Details',
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-brand-text flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.original.email}</span>
            </div>
            <div className="text-brand-muted font-mono flex items-center gap-1.5 text-[11px]">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.original.phone}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'nationality',
        header: 'Nationality & Origin',
        cell: ({ row }) => (
          <div className="text-xs flex items-center gap-1.5 text-brand-text">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {row.original.nationality || 'Unspecified'}
              {row.original.city && `, ${row.original.city}`}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'idDocumentNumber',
        header: 'Identification',
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            {row.original.idDocumentNumber ? (
              <span className="text-brand-text">
                {row.original.idDocumentType}: {row.original.idDocumentNumber}
              </span>
            ) : (
              <span className="text-brand-muted italic">Not recorded</span>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedGuest(row.original)}
            customActions={[
              {
                label: 'Create Booking',
                icon: <CalendarCheck className="w-3.5 h-3.5 text-brand-primary" />,
                onClick: () => navigate('/reservations/new'),
              },
            ]}
          />
        ),
      },
    ],
    [navigate]
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Guest Profiles & CRM"
        badge={<StatusBadge status="ACTIVE" label="Guest Directory" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Register Guest
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={vipTab}
        onChange={setVipTab}
        tabs={[
          { id: 'ALL', label: 'All Guest Profiles', count: totalCount },
          { id: 'VIP', label: 'VIP & Loyalty' },
          { id: 'Standard', label: 'Standard Guests' },
        ]}
      />

      {/* 3. Data Table with Unified Top Toolbar */}
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
        searchPlaceholder="Search guest by name, email, phone, passport..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="guest_directory.csv"
      />

      {/* 5. Register Guest Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateGuest}
        title="Register New Guest Profile"
        subtitle="Create authoritative CRM profile for future stays and preferences"
        submitText={isSaving ? 'Registering...' : 'Save Profile'}
        isLoading={isSaving}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Personal Information" description="Legal name and VIP classification">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="VIP Tier Status"
              size="sm"
              value={vipStatus}
              onChange={(val) => setVipStatus(val || 'Standard')}
              options={[
                { value: 'Standard', label: 'Standard Guest', badge: 'STD' },
                { value: 'Silver', label: 'Silver Tier', badge: 'SLV' },
                { value: 'Gold', label: 'Gold Tier VIP', badge: 'GLD' },
                { value: 'Platinum', label: 'Platinum / Diamond VIP', badge: 'PLT' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Nationality
            </label>
            <input
              type="text"
              placeholder="e.g. United States"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Contact & Identification" description="Email, phone, and government document">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="ID Document Type"
              size="sm"
              value={idDocType}
              onChange={(val) => setIdDocType(val || 'Passport')}
              options={[
                { value: 'Passport', label: 'Passport', badge: 'PPT' },
                { value: 'NationalID', label: 'National ID / Aadhaar', badge: 'NID' },
                { value: 'DrivingLicense', label: 'Driving License', badge: 'DL' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Document Number
            </label>
            <input
              type="text"
              placeholder="e.g. A12345678"
              value={idDocNumber}
              onChange={(e) => setIdDocNumber(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Special Preferences &amp; Dietary Requirements
            </label>
            <input
              type="text"
              placeholder="e.g. High floor, feather-free pillows, allergic to peanuts"
              value={specialPreferences}
              onChange={(e) => setSpecialPreferences(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Guest Detail Drawer */}
      {selectedGuest && (
        <DetailDrawer
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          title={selectedGuest.fullName}
          subtitle={`CRM Profile #${selectedGuest.id}`}
          status={selectedGuest.vipStatus || 'Standard'}
          width="lg"
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/reservations/new')}
              leftIcon={<CalendarCheck className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Create Booking for Guest
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Contact details */}
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Email</span>
                <span className="font-semibold text-brand-text">{selectedGuest.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Phone</span>
                <span className="font-mono font-semibold text-brand-text">{selectedGuest.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Nationality</span>
                <span className="text-brand-text">{selectedGuest.nationality || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">ID Document</span>
                <span className="font-mono text-brand-text">
                  {selectedGuest.idDocumentType}: {selectedGuest.idDocumentNumber || 'N/A'}
                </span>
              </div>
            </div>

            {/* Special preferences */}
            {selectedGuest.specialPreferences && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">
                  Guest Preferences &amp; Notes
                </span>
                <p className="text-xs text-brand-text leading-relaxed">{selectedGuest.specialPreferences}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
