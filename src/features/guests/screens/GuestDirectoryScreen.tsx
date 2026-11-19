import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { GuestDto, CreateGuestRequest } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import {
  Users,
  UserPlus,
  Crown,
  X,
  Phone,
  Mail,
  ShieldCheck,
  Globe,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const GuestDirectoryScreen: React.FC = () => {
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New Guest Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (vipFilter.trim()) params.append('vipStatus', vipFilter.trim());

      const res = await api.request<PagedResult<GuestDto>>(`/pms/guests?${params.toString()}`);
      if (res.success && res.data) {
        setGuests(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search, vipFilter]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('First name, last name, email, and phone are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
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
        setIsModalOpen(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setIdDocNumber('');
        setNationality('');
        setCity('');
        setCountry('');
        setSpecialPreferences('');
        setSuccessMessage('Guest profile registered successfully in CRM.');
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchGuests();
      } else {
        setError(res.message || 'Failed to register guest profile.');
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
          <Badge variant="purple" size="sm" className="font-bold flex items-center gap-1">
            <Crown className="w-3 h-3 text-purple-400" />
            <span>{vip}</span>
          </Badge>
        );
      case 'Gold':
        return (
          <Badge variant="warning" size="sm" className="font-bold flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-500" />
            <span>Gold</span>
          </Badge>
        );
      case 'Silver':
        return (
          <Badge variant="brand" size="sm" className="font-bold">
            Silver
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">Standard</Badge>;
    }
  };

  const vipTotal = guests.filter(g => g.vipStatus && g.vipStatus !== 'Standard').length;

  const columns: ColumnDef<GuestDto>[] = [
    {
      accessorKey: 'fullName',
      header: 'Guest Name',
      cell: ({ row }) => (
        <div className="py-0.5">
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{row.original.fullName}</span>
            {getVipBadge(row.original.vipStatus)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
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
          <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{row.original.email}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{row.original.phone}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'nationality',
      header: 'Nationality / Origin',
      cell: ({ row }) => (
        <div className="text-xs flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
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
      header: 'Identity Document',
      cell: ({ row }) =>
        row.original.idDocumentNumber ? (
          <div className="text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block">
              {row.original.idDocumentType}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {row.original.idDocumentNumber}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Pending verification</span>
        ),
    },
    {
      accessorKey: 'totalStays',
      header: 'Lifetime Stays',
      cell: ({ row }) => (
        <Badge variant="neutral" size="sm" className="font-mono font-bold">
          {row.original.totalStays} Stays
        </Badge>
      ),
    },
    {
      accessorKey: 'lifetimeSpend',
      header: 'Total Spent',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
          ${Number(row.original.lifetimeSpend || 0).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'specialPreferences',
      header: 'Guest Preferences',
      cell: ({ row }) =>
        row.original.specialPreferences ? (
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] block" title={row.original.specialPreferences}>
            {row.original.specialPreferences}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">&mdash;</span>
        ),
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Guests', href: '/guests' },
          { label: 'Guest Directory' },
        ]}
        title="Guest Directory &amp; CRM"
        subtitle="Guest profiles, loyalty tiers, identity documents, and lifetime spend history"
        icon={<Users className="w-4 h-4" />}
        badge={<Badge variant="info">CRM</Badge>}
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                setError(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add Guest Profile
            </Button>
          </PageActions>
        }
      />

      {successMessage && (
        <Alert
          type="success"
          title="Guest Registered"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Guest Profiles
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              VIP Tier Patrons
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {vipTotal}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Identity Verification
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              KYC &amp; Passport Encrypted
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concierge CRM
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
              Cross-Property History
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={vipFilter}
            onChange={(e) => {
              setVipFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Loyalty &amp; VIP Tiers</option>
            <option value="Standard">Standard Tier</option>
            <option value="Silver">Silver Tier</option>
            <option value="Gold">Gold Tier</option>
            <option value="Platinum">Platinum Tier</option>
            <option value="VIP">VIP Executive</option>
          </Select>
        </div>
      </div>

      {/* Guest DataTable */}
      <DataTable<GuestDto>
        title="Guest Profiles Directory"
        subtitle="Comprehensive guest master records synced across PMS booking engine and billing"
        data={guests}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSearchChange={(t) => {
          setSearch(t);
          setPageIndex(0);
        }}
        onRefresh={fetchGuests}
        searchPlaceholder="Search guest by name, email, or phone..."
        exportFileName="guest_crm_directory.csv"
      />

      {/* New Guest Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Guest Profile"
        subtitle="Add guest details, contact numbers, nationality, and VIP classification"
        icon={<UserPlus className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateGuest}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Guest Profile
            </Button>
          </>
        }
      >
        {error && (
          <Alert type="error" message={error} />
        )}

        <FormGrid cols={2}>
          <Input
            label="First Name *"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Eleanor"
          />
          <Input
            label="Last Name *"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Vance"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Email Address *"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="eleanor.vance@luxury.com"
          />
          <Input
            label="Phone / Mobile *"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 901-2345"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Loyalty / VIP Tier
            </label>
            <Select
              value={vipStatus}
              onChange={(e) => setVipStatus(e.target.value)}
            >
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="VIP">VIP Executive</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ID Document Type
            </label>
            <Select
              value={idDocType}
              onChange={(e) => setIdDocType(e.target.value)}
            >
              <option value="Passport">Passport</option>
              <option value="NationalID">National ID / Aadhaar</option>
              <option value="DriversLicense">Driver's License</option>
            </Select>
          </div>

          <Input
            label="ID Document #"
            value={idDocNumber}
            onChange={(e) => setIdDocNumber(e.target.value)}
            placeholder="e.g. A9283741"
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="e.g. Canada"
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Vancouver"
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Canada"
          />
        </FormGrid>

        <div>
          <Textarea
            label="Special Preferences / Dietary / Room Habits"
            rows={2}
            value={specialPreferences}
            onChange={(e) => setSpecialPreferences(e.target.value)}
            placeholder="e.g. Feather pillow allergy, prefers sparkling water, high floor..."
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
