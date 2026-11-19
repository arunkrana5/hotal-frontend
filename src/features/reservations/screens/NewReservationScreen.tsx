import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { CreateReservationRequest, GuestDto, ReservationDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  ArrowLeft,
  User,
  Bed,
  CreditCard,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const NewReservationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { documentNumber, isLoading: isDocLoading, refetch: refetchDoc } = useDocumentNumber('RESERVATION');

  // Mode: existing vs new guest
  const [guestMode, setGuestMode] = useState<'new' | 'existing'>('new');
  const [existingGuests, setExistingGuests] = useState<GuestDto[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);

  // New guest fields
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIdType, setNewIdType] = useState('Passport');
  const [newIdNumber, setNewIdNumber] = useState('');
  const [newNationality, setNewNationality] = useState('');

  // Booking fields
  const [roomType, setRoomType] = useState('DLX');
  const [bookingSource, setBookingSource] = useState('DIRECT');
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDateStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(nextDateStr);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [customRate, setCustomRate] = useState<number>(180);
  const [specialRequests, setSpecialRequests] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuests = async () => {
      const res = await api.request<PagedResult<GuestDto>>('/pms/guests?pageSize=50');
      if (res.success && res.data) {
        setExistingGuests(res.data.items);
        if (res.data.items.length > 0) {
          setSelectedGuestId(res.data.items[0].id);
        }
      }
    };
    fetchGuests();
  }, []);

  // Compute stay nights & estimated total
  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  const diffTime = outD.getTime() - inD.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
  const estimatedSubtotal = customRate * nights;
  const estimatedTax = estimatedSubtotal * 0.12;
  const estimatedTotal = estimatedSubtotal + estimatedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateReservationRequest = {
        roomTypeCode: roomType,
        checkInDate,
        checkOutDate,
        adultsCount,
        childrenCount,
        bookingSource,
        customRate,
        specialRequests: specialRequests.trim() || undefined,
      };

      if (guestMode === 'existing' && selectedGuestId) {
        payload.guestId = selectedGuestId;
      } else {
        if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPhone.trim()) {
          setError('First name, last name, email, and phone number are required for guest profile creation.');
          setIsLoading(false);
          return;
        }

        payload.newGuest = {
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          idDocumentType: newIdType,
          idDocumentNumber: newIdNumber.trim() || undefined,
          nationality: newNationality.trim() || undefined,
        };
      }

      const res = await api.request<ReservationDto>('/pms/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        navigate(`/reservations?created=${res.data.confirmationNumber}`);
      } else {
        setError(res.message || 'Failed to create reservation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="7xl">
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Reservations', href: '/reservations' },
          { label: 'New Reservation' },
        ]}
        title="New Reservation"
        subtitle="PMS Booking Engine • Room allocation, stay dates, guest profile, and folio initialization"
        badge={<Badge variant="info">New Booking</Badge>}
        actions={
          <PageActions>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/reservations')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              isLoading={isLoading}
              onClick={handleSubmit as any}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Create Reservation
            </Button>
          </PageActions>
        }
      />

      {error && (
        <Alert
          type="error"
          title="Reservation Validation Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Universal First Field: Transaction Document Number */}
            <Card className="p-4 sm:p-5">
              <DocumentNumberField
                value={documentNumber}
                label="Reservation Document Number"
                isLoading={isDocLoading}
                onRefresh={refetchDoc}
              />
            </Card>

            {/* Guest Identification Section */}
            <Card className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border dark:border-border gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Guest Profile Identification</h3>
                    <p className="text-xs text-slate-500">Attach existing profile or register a new guest</p>
                  </div>
                </div>

                <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setGuestMode('new')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      guestMode === 'new'
                        ? 'bg-white dark:bg-navy-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    New Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestMode('existing')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      guestMode === 'existing'
                        ? 'bg-white dark:bg-navy-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Existing Guest ({existingGuests.length})
                  </button>
                </div>
              </div>

              {guestMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Guest Record *
                  </label>
                  <Select
                    value={selectedGuestId || ''}
                    onChange={(e) => setSelectedGuestId(Number(e.target.value))}
                  >
                    {existingGuests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.fullName} &bull; {g.email} &bull; {g.phone} ({g.vipStatus})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormGrid cols={2}>
                    <Input
                      label="First Name *"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="e.g. Alexander"
                    />
                    <Input
                      label="Last Name *"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="e.g. Wright"
                    />
                  </FormGrid>

                  <FormGrid cols={2}>
                    <Input
                      label="Email Address *"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="alex.wright@corporate.com"
                    />
                    <Input
                      label="Phone / Mobile *"
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                    />
                  </FormGrid>

                  <FormGrid cols={3}>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        ID Document Type
                      </label>
                      <Select
                        value={newIdType}
                        onChange={(e) => setNewIdType(e.target.value)}
                      >
                        <option value="Passport">Passport</option>
                        <option value="NationalID">National ID / Aadhaar</option>
                        <option value="DriversLicense">Driver's License</option>
                      </Select>
                    </div>
                    <Input
                      label="ID Document #"
                      value={newIdNumber}
                      onChange={(e) => setNewIdNumber(e.target.value)}
                      placeholder="e.g. P1829402"
                      className="font-mono"
                    />
                    <Input
                      label="Nationality"
                      value={newNationality}
                      onChange={(e) => setNewNationality(e.target.value)}
                      placeholder="e.g. United Kingdom"
                    />
                  </FormGrid>
                </div>
              )}
            </Card>

            {/* Room & Stay Schedule */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border dark:border-border">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Stay Schedule &amp; Accommodations</h3>
                  <p className="text-xs text-slate-500">Select dates, category, and rate code</p>
                </div>
              </div>

              <FormGrid cols={2}>
                <Input
                  label="Check-In Date *"
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
                <Input
                  label="Check-Out Date *"
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </FormGrid>

              <FormGrid cols={2}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Room Type *
                  </label>
                  <DynamicDropdown
                    masterCode="ROOM_TYPE"
                    value={roomType}
                    onChange={(val) => setRoomType(val)}
                    placeholder="Choose Room Category..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Booking Source Channel *
                  </label>
                  <DynamicDropdown
                    masterCode="BOOKING_SOURCE"
                    value={bookingSource}
                    onChange={(val) => setBookingSource(val)}
                    placeholder="Select Booking Channel..."
                  />
                </div>
              </FormGrid>

              <FormGrid cols={3}>
                <Input
                  label="Adults Count"
                  type="number"
                  min="1"
                  max="10"
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(Number(e.target.value))}
                />
                <Input
                  label="Children Count"
                  type="number"
                  min="0"
                  max="6"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                />
                <Input
                  label="Agreed Rate/Night ($) *"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="font-mono font-semibold"
                />
              </FormGrid>

              <div>
                <Textarea
                  label="Special Requests / Concierge Directives"
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. High floor ocean view, quiet wing, champagne setup for anniversary..."
                />
              </div>
            </Card>
          </div>

          {/* Stay Calculation Sidebar (1 Col) */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-20 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-border">
                <CreditCard className="w-4 h-4 text-brand-indigo" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Stay Summary &amp; Folio Estimate</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Selected Category:</span>
                  <Badge variant="brand" size="sm">{roomType}</Badge>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Duration of Stay:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{nights} Night(s)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Rate per Night:</span>
                  <span className="font-mono">${customRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Occupancy:</span>
                  <span>{adultsCount} Adult(s), {childrenCount} Child</span>
                </div>

                <div className="pt-3 border-t border-border dark:border-border space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Room Charges:</span>
                    <span className="font-mono">${estimatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Occupancy Tax (12%):</span>
                    <span className="font-mono">${estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-border dark:border-border text-slate-900 dark:text-white">
                    <span>Estimated Total:</span>
                    <span className="text-brand-indigo dark:text-brand-blue font-mono text-base">
                      ${estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-navy-800/60 border border-blue-100 dark:border-navy-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Creating this reservation automatically provisions an active PMS Master Folio and locks availability for room allocation.</span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-semibold flex items-center justify-center gap-2 py-2.5 shadow-md shadow-brand-indigo/15"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Confirming Booking...' : 'Confirm Reservation'}</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
