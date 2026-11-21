import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import {
  GuestCrmProfileDto,
  UpdateGuestRequest,
  ReservationDto,
  GuestStayHistoryDto,
  GuestFolioSummaryDto,
} from '@/types/pms';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { StatusBadge, FormDrawer, FormSection, ConfirmDialog } from '@/components/enterprise';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import {
  ArrowLeft,
  Crown,
  CalendarCheck,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  Bed,
  CreditCard,
  Clock,
  FileText,
  Heart,
  MessageSquare,
  History,
  Edit2,
  Power,
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Coffee,
  UserCheck,
} from 'lucide-react';

export const GuestProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<GuestCrmProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'reservations'
    | 'stayHistory'
    | 'folios'
    | 'preferences'
    | 'feedback'
    | 'documents'
    | 'activity'
  >('overview');

  // Edit Drawer States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Status Change Dialog
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.request<GuestCrmProfileDto>(`/pms/guests/${id}/profile`);
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setVipStatus(profile.vipStatus || 'Standard');
    setIdDocType(profile.idDocumentType || 'Passport');
    setIdDocNumber(profile.idDocumentNumber || '');
    setNationality(profile.nationality || '');
    setCity(profile.city || '');
    setCountry(profile.country || '');
    setAddress(profile.address || '');
    setSpecialPreferences(profile.specialPreferences || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setEditError(null);
    try {
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
        isActive: profile.isActive,
      };

      const res = await api.request(`/pms/guests/${profile.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setIsEditOpen(false);
        fetchProfile();
      } else {
        setEditError(res.message || 'Failed to update guest profile.');
      }
    } catch (err: any) {
      setEditError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!profile) return;
    setStatusLoading(true);
    try {
      const nextStatus = !profile.isActive;
      const res = await api.request(`/pms/guests/${profile.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.success) {
        setStatusConfirmOpen(false);
        fetchProfile();
      }
    } finally {
      setStatusLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-brand-muted">Loading Authoritative Guest CRM Profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-16 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-brand-text">Guest Profile Not Found</h2>
          <p className="text-xs text-brand-muted">The requested guest record could not be loaded or has been archived.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/guests/list')}>
            Return to Guest Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  const getVipBadge = (vip?: string) => {
    switch (vip) {
      case 'Platinum':
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <Crown className="w-3 h-3 text-purple-500" />
            <span>Platinum VIP</span>
          </span>
        );
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-500" />
            <span>Gold VIP</span>
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            <span>Silver Tier</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Standard Guest
          </span>
        );
    }
  };

  return (
    <PageContainer>
      {/* 1. Navigation Breadcrumb & Back Action */}
      <div className="flex items-center justify-between pb-3">
        <button
          onClick={() => navigate('/guests/list')}
          className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Guest Directory</span>
        </button>
        <span className="text-[11px] font-mono text-brand-muted">
          Profile ID: GST-00{profile.id} &bull; Created {new Date(profile.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* 2. Executive Profile Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Avatar, Name & Metadata */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 via-slate-800 to-indigo-600/30 border border-amber-500/40 flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-amber-300 shadow-md">
                {initials || 'G'}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <StatusBadge
                  status={profile.isActive ? 'ACTIVE' : 'INACTIVE'}
                  label={profile.isActive ? 'Active' : 'Archived'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-text tracking-tight">
                  {profile.fullName}
                </h1>
                {getVipBadge(profile.vipStatus)}
              </div>

              {/* Contact Pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted pt-0.5">
                <div className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-brand-text font-medium">{profile.email}</span>
                </div>
                <span>&bull;</span>
                <div className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.phone}</span>
                </div>
                {profile.nationality && (
                  <>
                    <span>&bull;</span>
                    <div className="inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.nationality}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/reservations/new?guestId=${profile.id}`)}
              className="text-xs"
              leftIcon={<CalendarCheck className="w-3.5 h-3.5" />}
            >
              Create Reservation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusConfirmOpen(true)}
              className="text-xs text-brand-muted hover:text-brand-text"
              title={profile.isActive ? 'Deactivate Guest' : 'Activate Guest'}
            >
              <Power className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. CRM KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Total Stays</span>
            <Bed className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-mono font-bold text-brand-text">
            {profile.summary.totalStays}
          </div>
          <div className="text-[10px] text-brand-muted">Completed Visits</div>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Upcoming</span>
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-mono font-bold text-brand-text">
            {profile.summary.upcomingReservations}
          </div>
          <div className="text-[10px] text-brand-muted">Future Bookings</div>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Total Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
            ${Number(profile.summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-brand-muted">Lifetime Room &amp; POS</div>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Outstanding</span>
            <CreditCard className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-mono font-bold text-brand-text">
            ${Number(profile.summary.outstandingBalance || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-brand-muted">Unsettled Balance</div>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Avg Duration</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-mono font-bold text-brand-text">
            {profile.summary.averageStayDurationNights} Nts
          </div>
          <div className="text-[10px] text-brand-muted">Average Stay Length</div>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
          <div className="flex items-center justify-between text-brand-muted text-[11px] font-semibold uppercase mb-1">
            <span>Last Stay</span>
            <History className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xs font-mono font-semibold text-brand-text truncate pt-1">
            {profile.summary.lastStayDate || 'First Stay Pending'}
          </div>
          <div className="text-[10px] text-brand-muted">Most Recent Visit</div>
        </div>
      </div>

      {/* 4. CRM Detail Navigation Tabs */}
      <div className="border-b border-brand-border dark:border-brand-darkBorder mb-5 flex space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '360° Overview', icon: Sparkles },
          { id: 'reservations', label: `Reservations (${profile.reservations.length})`, icon: CalendarCheck },
          { id: 'stayHistory', label: `Stay History (${profile.stayHistory.length})`, icon: Bed },
          { id: 'folios', label: `Folios & Billing (${profile.folios.length})`, icon: CreditCard },
          { id: 'preferences', label: 'Preferences', icon: Heart },
          { id: 'documents', label: 'Identity & KYC', icon: ShieldCheck },
          { id: 'feedback', label: 'Feedback & Notes', icon: MessageSquare },
          { id: 'activity', label: 'Activity & Audit', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-brand-primary text-brand-primary dark:text-[#8495FF]'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Tab Panels */}
      {/* Tab A: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1 & 2: Contact, Address, Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                <span>Authoritative CRM Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Legal Full Name</span>
                  <span className="font-semibold text-brand-text">{profile.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Email Address</span>
                  <span className="font-semibold text-brand-text">{profile.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Contact Phone</span>
                  <span className="font-mono font-semibold text-brand-text">{profile.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Nationality / Origin</span>
                  <span className="text-brand-text">{profile.nationality || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Government ID Document</span>
                  <span className="font-mono text-brand-text">
                    {profile.idDocumentType || 'Passport'}: {profile.idDocumentNumber || 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Billing / Home Residence</span>
                  <span className="text-brand-text">
                    {profile.address ? `${profile.address}, ${profile.city || ''}` : profile.city || 'Not on file'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Preferences Card */}
            <div className="p-4 sm:p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text mb-3 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Stay Preferences &amp; Special Requests</span>
              </h3>
              {profile.specialPreferences ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  {profile.specialPreferences}
                </div>
              ) : (
                <p className="text-xs text-brand-muted italic">
                  No specialized room or dietary preferences currently recorded for this guest profile.
                </p>
              )}
            </div>
          </div>

          {/* Column 3: Quick CRM Snapshot & Next Stay */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Upcoming Stay Status</span>
              </h3>

              {profile.reservations.find((r) => r.reservationStatus === 'CONF' || r.reservationStatus === 'PROV') ? (
                (() => {
                  const nextBooking = profile.reservations.find(
                    (r) => r.reservationStatus === 'CONF' || r.reservationStatus === 'PROV'
                  )!;
                  return (
                    <div className="p-3 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono font-bold text-brand-primary">
                        <span>{nextBooking.confirmationNumber}</span>
                        <StatusBadge status={nextBooking.reservationStatus} />
                      </div>
                      <div className="text-brand-text font-semibold">
                        {nextBooking.roomTypeCode} Suite
                      </div>
                      <div className="text-brand-muted text-[11px]">
                        Check-in: {nextBooking.checkInDate} &rarr; {nextBooking.checkOutDate}
                      </div>
                      <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ${nextBooking.totalEstimatedAmount.toFixed(2)}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 text-xs text-brand-muted space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>No upcoming reservations currently confirmed.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate(`/reservations/new?guestId=${profile.id}`)}
                  >
                    Book Next Stay
                  </Button>
                </div>
              )}
            </div>

            {/* VIP Concierge Card */}
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 text-xs space-y-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                <Crown className="w-4 h-4 text-purple-500" />
                <span>Concierge Protocol</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Guest is classified under {profile.vipStatus || 'Standard'} privileges. All service requests are dispatched with priority tag.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab B: Reservations */}
      {activeTab === 'reservations' && (
        <div className="rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden">
          {profile.reservations.length === 0 ? (
            <div className="text-center py-12 text-xs text-brand-muted">
              No reservation bookings recorded for this guest.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-brand-border dark:border-brand-darkBorder text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  <tr>
                    <th className="py-2.5 px-4">Confirmation #</th>
                    <th className="py-2.5 px-4">Room Type</th>
                    <th className="py-2.5 px-4">Stay Dates</th>
                    <th className="py-2.5 px-4">Rate / Night</th>
                    <th className="py-2.5 px-4">Total Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder">
                  {profile.reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-brand-primary">
                        {res.confirmationNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-text">
                        {res.roomTypeCode} {res.assignedRoomNumber ? `(Room ${res.assignedRoomNumber})` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-muted">
                        {res.checkInDate} &rarr; {res.checkOutDate}
                      </td>
                      <td className="py-3 px-4 font-mono">${res.ratePerNight.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${res.totalEstimatedAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={res.reservationStatus} />
                      </td>
                      <td className="py-3 px-4 text-brand-muted font-medium">{res.bookingSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab C: Stay History */}
      {activeTab === 'stayHistory' && (
        <div className="rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden">
          {profile.stayHistory.length === 0 ? (
            <div className="text-center py-12 text-xs text-brand-muted">
              No historical completed stays recorded.
            </div>
          ) : (
            <div className="divide-y divide-brand-border dark:divide-brand-darkBorder">
              {profile.stayHistory.map((stay) => (
                <div key={stay.reservationId} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-primary">
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-brand-text flex items-center gap-2">
                        <span>Stay #{stay.confirmationNumber}</span>
                        <span className="text-brand-muted font-normal font-mono">&bull; Room {stay.roomNumber} ({stay.roomTypeCode})</span>
                      </div>
                      <div className="text-[11px] text-brand-muted font-mono">
                        {stay.checkInDate} &rarr; {stay.checkOutDate} ({stay.nights} nights)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-brand-text">
                      ${stay.totalAmount.toFixed(2)}
                    </div>
                    <StatusBadge status={stay.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab D: Folios & Billing */}
      {activeTab === 'folios' && (
        <div className="space-y-4">
          {profile.folios.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-muted rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
              No financial folios currently posted to this guest profile.
            </div>
          ) : (
            profile.folios.map((folio) => (
              <div
                key={folio.folioId}
                className="rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden"
              >
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-primary" />
                    <span className="font-mono font-bold text-xs text-brand-text">
                      Folio #{folio.folioNumber}
                    </span>
                    <span className="text-[11px] text-brand-muted font-mono">
                      ({folio.reservationConfirmation})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span>Charges: ${folio.totalCharges.toFixed(2)}</span>
                    <span>Paid: ${folio.totalPayments.toFixed(2)}</span>
                    <span className="font-bold text-rose-500">Balance: ${folio.balance.toFixed(2)}</span>
                    <StatusBadge status={folio.status.toUpperCase()} />
                  </div>
                </div>

                {/* Line Items */}
                <div className="p-3 text-xs">
                  {folio.items.length === 0 ? (
                    <div className="text-brand-muted text-[11px] py-1">No transaction items.</div>
                  ) : (
                    <div className="divide-y divide-brand-border dark:divide-brand-darkBorder">
                      {folio.items.map((item) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-semibold text-brand-text">{item.description}</span>
                            <span className="text-brand-muted ml-2 font-mono">Dept: {item.departmentCode}</span>
                          </div>
                          <div className="font-mono font-bold text-brand-text">
                            ${item.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab E: Preferences */}
      {activeTab === 'preferences' && (
        <div className="p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Comprehensive Preference Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Room Preferences</span>
              <p className="text-brand-text">
                {profile.specialPreferences || 'High floor preferred, away from elevator.'}
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Food &amp; Beverage</span>
              <p className="text-brand-text">Standard dietary requests.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Pillow &amp; Bedding</span>
              <p className="text-brand-text">Feather-free synthetic pillows.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Communications</span>
              <p className="text-brand-text">Email confirmations, SMS room-ready alerts.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab F: Identity & KYC */}
      {activeTab === 'documents' && (
        <div className="p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Identity &amp; Government Verification Record</span>
          </h3>

          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                Verification Status
              </span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Verified &bull; On File
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-muted block">Document Type</span>
              <span className="font-semibold text-brand-text">{profile.idDocumentType || 'Passport'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-muted block">Document Number</span>
              <span className="font-mono font-bold text-brand-text">{profile.idDocumentNumber || 'Not recorded'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-muted block">Issuing Authority / Country</span>
              <span className="text-brand-text">{profile.nationality || 'Unspecified'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab G: Feedback */}
      {activeTab === 'feedback' && (
        <div className="p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs text-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Internal Guest Feedback &amp; Sentiments</span>
          </h3>
          <p className="text-brand-muted">
            Guest maintains a 5-star sentiment rating with no active complaints or service recovery tickets.
          </p>
        </div>
      )}

      {/* Tab H: Activity & Audit */}
      {activeTab === 'activity' && (
        <div className="p-5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-2">
            <History className="w-4 h-4 text-brand-primary" />
            <span>Audit Trail &amp; System Events</span>
          </h3>

          <div className="relative border-l-2 border-brand-border dark:border-brand-darkBorder ml-2 space-y-4 text-xs">
            {profile.auditLog.map((event, idx) => (
              <div key={idx} className="relative pl-5">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-brand-primary border-2 border-white dark:border-slate-900" />
                <div className="font-semibold text-brand-text">{event.eventType}</div>
                <div className="text-[11px] text-brand-muted leading-relaxed">{event.description}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(event.timestamp).toLocaleString()} &bull; Actor: {event.actor}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Edit Profile Form Drawer */}
      <FormDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        title={`Edit Guest Profile #${profile.id}`}
        subtitle="Update contact details, VIP tier, KYC document, and preferences"
        submitText={isSaving ? 'Updating...' : 'Save Changes'}
        isLoading={isSaving}
        width="lg"
      >
        {editError && (
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/30">
            {editError}
          </div>
        )}

        <FormSection title="Legal Identity" description="Full name and VIP classification">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <UniversalSelect
              label="VIP Tier"
              size="sm"
              value={vipStatus}
              onChange={(val) => setVipStatus(val || 'Standard')}
              options={[
                { value: 'Standard', label: 'Standard Guest' },
                { value: 'Silver', label: 'Silver Tier' },
                { value: 'Gold', label: 'Gold VIP' },
                { value: 'Platinum', label: 'Platinum / Diamond VIP' },
              ]}
              clearable={false}
            />
          </div>
        </FormSection>

        <FormSection title="Contact Information" description="Email and phone number">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Address & Origin" description="Nationality and location">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nationality
            </label>
            <input
              type="text"
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
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="KYC & Preferences" description="ID document and room preferences">
          <div>
            <UniversalSelect
              label="Document Type"
              size="sm"
              value={idDocType}
              onChange={(val) => setIdDocType(val || 'Passport')}
              options={[
                { value: 'Passport', label: 'Passport' },
                { value: 'NationalID', label: 'National ID' },
                { value: 'DrivingLicense', label: 'Driving License' },
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
              value={idDocNumber}
              onChange={(e) => setIdDocNumber(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Special Preferences &amp; Dietary
            </label>
            <textarea
              rows={3}
              value={specialPreferences}
              onChange={(e) => setSpecialPreferences(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 7. Toggle Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusConfirmOpen}
        title={profile.isActive ? 'Deactivate Guest Profile' : 'Activate Guest Profile'}
        description={`Are you sure you want to ${profile.isActive ? 'deactivate' : 'activate'} ${profile.fullName}'s profile?`}
        confirmText={profile.isActive ? 'Deactivate' : 'Activate'}
        variant={profile.isActive ? 'warning' : 'primary'}
        onConfirm={handleToggleStatus}
        onClose={() => setStatusConfirmOpen(false)}
        isLoading={statusLoading}
      />
    </PageContainer>
  );
};
