import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge, PageTabs } from '@/components/enterprise';
import {
  guestOrderApi,
  RoomQrCodeDto,
  GenerateRoomQrRequest,
} from '@/services/guestOrderApi';
import { api } from '@/services/api';
import { RoomDto } from '@/types/pms';
import { toast } from 'sonner';
import {
  QrCode,
  Printer,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Download,
  KeyRound,
  ShieldAlert,
  Layers,
  Eye,
  Check,
  X,
  Plus,
} from 'lucide-react';

export const RoomQrManagementScreen: React.FC = () => {
  const [qrList, setQrList] = useState<RoomQrCodeDto[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [previewQr, setPreviewQr] = useState<RoomQrCodeDto | null>(null);
  const [printCard, setPrintCard] = useState<RoomQrCodeDto | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showSingleGenModal, setShowSingleGenModal] = useState<boolean>(false);
  const [showPrintAllModal, setShowPrintAllModal] = useState<boolean>(false);

  // Single Generate Form
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [requirePin, setRequirePin] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Bulk options
  const [bulkOverwrite, setBulkOverwrite] = useState<boolean>(false);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

  // QR Canvas ref for PNG download
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const fetchQrCodes = useCallback(async () => {
    setLoading(true);
    const res = await guestOrderApi.getRoomQrCodes();
    if (res.success && res.data) {
      setQrList(res.data);
    }
    setLoading(false);
  }, []);

  const fetchRooms = useCallback(async () => {
    const res = await api.get<{ items: RoomDto[] }>('/rooms?pageSize=100');
    if (res.success && res.data) {
      setRooms(res.data.items || []);
    }
  }, []);

  useEffect(() => {
    fetchQrCodes();
    fetchRooms();
  }, [fetchQrCodes, fetchRooms]);

  // Handle single room generation
  const handleGenerateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error('Please select a room.');
      return;
    }

    setSubmitting(true);
    const req: GenerateRoomQrRequest = {
      roomId: Number(selectedRoomId),
      requirePin,
      pinCode: requirePin && pinCode.trim() ? pinCode.trim() : null,
    };

    const res = await guestOrderApi.generateRoomQr(req);
    setSubmitting(false);

    if (res.success && res.data) {
      toast.success(`QR code for Room ${res.data.roomNumber} generated.`);
      setShowSingleGenModal(false);
      setSelectedRoomId('');
      setRequirePin(false);
      setPinCode('');
      fetchQrCodes();
    } else {
      toast.error(res.message || 'Failed to generate QR code.');
    }
  };

  // Handle bulk generation
  const handleBulkGenerate = async () => {
    setBulkLoading(true);
    const res = await guestOrderApi.bulkGenerateRoomQr({
      overwriteExisting: bulkOverwrite,
    });
    setBulkLoading(false);

    if (res.success && res.data) {
      toast.success(`Successfully generated ${res.data.length} room QR codes.`);
      setShowBulkModal(false);
      fetchQrCodes();
    } else {
      toast.error(res.message || 'Failed to generate QR codes.');
    }
  };

  // Handle Revoke
  const handleRevoke = async (qr: RoomQrCodeDto) => {
    if (!window.confirm(`Disable QR code for Room ${qr.roomNumber}? Guests will no longer be able to scan it.`)) {
      return;
    }

    const res = await guestOrderApi.revokeRoomQr(qr.id);
    if (res.success) {
      toast.success(`Room ${qr.roomNumber} QR code revoked.`);
      fetchQrCodes();
    } else {
      toast.error(res.message || 'Failed to revoke QR code.');
    }
  };

  // Handle Regenerate
  const handleRegenerate = async (qr: RoomQrCodeDto) => {
    if (!window.confirm(`Regenerate QR token for Room ${qr.roomNumber}? The existing physical QR code in the room will stop working immediately.`)) {
      return;
    }

    const res = await guestOrderApi.generateRoomQr({
      roomId: qr.roomId,
      requirePin: qr.requirePin,
      pinCode: qr.pinCode,
    });

    if (res.success) {
      toast.success(`Room ${qr.roomNumber} QR token regenerated.`);
      fetchQrCodes();
    } else {
      toast.error(res.message || 'Failed to regenerate.');
    }
  };

  // Copy Link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Guest Portal link copied to clipboard.');
  };

  // Download QR PNG
  const handleDownloadPng = (roomNumber: string) => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas) {
      toast.error('Unable to capture QR code canvas.');
      return;
    }
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `HotelOS-Room-${roomNumber}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success(`Downloaded QR for Room ${roomNumber}`);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return qrList.filter((item) => {
      const matchSearch =
        search === '' ||
        item.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.roomType.toLowerCase().includes(search.toLowerCase()) ||
        item.qrToken.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'ACTIVE') return item.isActive;
      if (activeTab === 'REVOKED') return !item.isActive;
      if (activeTab === 'PIN') return item.requirePin;

      return true;
    });
  }, [qrList, search, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const total = qrList.length;
    const active = qrList.filter((q) => q.isActive).length;
    const revoked = total - active;
    const totalScans = qrList.reduce((acc, q) => acc + (q.scanCount || 0), 0);
    return { total, active, revoked, totalScans };
  }, [qrList]);

  // Table Columns (Strict single-line standard)
  const columns = useMemo<ColumnDef<RoomQrCodeDto>[]>(() => [
    {
      accessorKey: 'roomNumber',
      header: 'Room',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold text-xs">
            {row.original.roomNumber}
          </div>
          <span className="text-xs font-semibold text-surface-900 dark:text-white">
            Room {row.original.roomNumber}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 font-medium">
            {row.original.roomType}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'qrToken',
      header: 'QR Token & Access URL',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <code className="text-[11px] font-mono bg-surface-100 dark:bg-surface-800/80 px-1.5 py-0.5 rounded text-surface-700 dark:text-surface-300">
            {row.original.qrToken.substring(0, 10)}...
          </code>
          <button
            onClick={() => handleCopyLink(row.original.qrUrl)}
            title="Copy Guest URL"
            className="p-1 rounded text-surface-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a
            href={row.original.qrUrl}
            target="_blank"
            rel="noreferrer"
            title="Open Guest Portal"
            className="p-1 rounded text-surface-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'requirePin',
      header: 'Security PIN',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          {row.original.requirePin ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <KeyRound className="h-3 w-3" />
              <span>PIN: {row.original.pinCode || 'Required'}</span>
            </span>
          ) : (
            <span className="text-[11px] text-surface-400">Direct Scan (No PIN)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'scanCount',
      header: 'Guest Scans',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-surface-800 dark:text-surface-200">
            {row.original.scanCount} scans
          </span>
          {row.original.lastScannedAt && (
            <span className="text-[11px] text-surface-400">
              ({new Date(row.original.lastScannedAt).toLocaleDateString()})
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.isActive ? 'ACTIVE' : 'REVOKED'}
          variant={row.original.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      accessorKey: 'generatedAt',
      header: 'Generated',
      cell: ({ row }) => (
        <span className="text-xs text-surface-500">
          {new Date(row.original.generatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const qr = row.original;
        return (
          <div className="flex items-center justify-end space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewQr(qr)}
              className="h-7 px-2 text-xs"
              title="Preview QR Code"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrintCard(qr)}
              className="h-7 px-2 text-xs"
              title="Print Tent Card"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Card
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRegenerate(qr)}
              className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
              title="Regenerate Token"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {qr.isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(qr)}
                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                title="Revoke QR"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [qrList]);

  return (
    <PageContainer>
      <PageHeader
        title="Room QR Management"
        actions={
          <PageActions>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPrintAllModal(true)}
              className="h-8 text-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print All Cards
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBulkModal(true)}
              className="h-8 text-xs"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Bulk Generate
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSingleGenModal(true)}
              className="h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Room QR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchQrCodes}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </PageActions>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 mb-1">
            Configured Rooms
          </div>
          <div className="text-xl font-bold text-surface-900 dark:text-white">
            {stats.total}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            Active QR Codes
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-1">
            Revoked / Inactive
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {stats.revoked}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
            Total Guest Scans
          </div>
          <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {stats.totalScans}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <PageTabs
        tabs={[
          { id: 'ALL', label: `All Rooms (${qrList.length})` },
          { id: 'ACTIVE', label: `Active (${stats.active})` },
          { id: 'PIN', label: 'PIN Protected' },
          { id: 'REVOKED', label: `Revoked (${stats.revoked})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Single-Line Data Table */}
      <div className="mt-4">
        <DataTable
          data={filteredList}
          columns={columns}
          totalCount={filteredList.length}
          pageIndex={0}
          pageSize={100}
          isLoading={loading}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
      </div>

      {/* MODAL: PREVIEW QR CODE */}
      {previewQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <div className="text-left">
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Room {previewQr.roomNumber} QR
                </h3>
                <p className="text-xs text-surface-500">In-Room Dining & Services Portal</p>
              </div>
              <button
                onClick={() => setPreviewQr(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={qrCanvasRef}
              className="p-4 bg-white rounded-xl border border-surface-200 shadow-inner flex flex-col items-center justify-center mx-auto my-2"
            >
              <QRCodeCanvas
                value={previewQr.qrUrl}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="mt-3 text-left bg-surface-50 dark:bg-surface-800/60 p-2.5 rounded-lg border border-surface-200 dark:border-surface-700/60">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-0.5">
                Portal URL
              </div>
              <div className="text-xs font-mono text-surface-700 dark:text-surface-300 truncate">
                {previewQr.qrUrl}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyLink(previewQr.qrUrl)}
                className="w-full text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy URL
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPng(previewQr.roomNumber)}
                className="w-full text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download PNG
              </Button>
            </div>

            <div className="mt-3">
              <a
                href={previewQr.qrUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Test scan in browser
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE ROOM TENT CARD PRINT VIEW */}
      {printCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                Print Table Tent Card
              </h3>
              <button
                onClick={() => setPrintCard(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Card Mockup */}
            <div className="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-2xl p-6 bg-gradient-to-b from-surface-50 to-white dark:from-surface-800 dark:to-surface-900 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-2 text-primary-600 dark:text-primary-400 mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold tracking-widest uppercase">
                  Grand Hotel & Resort
                </span>
              </div>
              <h4 className="text-xl font-extrabold text-surface-900 dark:text-white mt-1">
                In-Room Dining & Services
              </h4>
              <p className="text-xs text-surface-500 mb-4">
                Scan with any mobile camera to view our fresh chef menu & place instant room service orders
              </p>

              <div className="inline-block p-3 bg-white rounded-xl shadow-md border border-surface-200 my-2">
                <QRCodeSVG value={printCard.qrUrl} size={160} level="H" />
              </div>

              <div className="mt-4">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-600 text-white font-black text-sm tracking-wide shadow-xs">
                  ROOM {printCard.roomNumber}
                </span>
              </div>
              <p className="text-[11px] text-surface-400 mt-3">
                No app download required • Fast delivery to your room
              </p>
            </div>

            <div className="flex space-x-2 mt-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPrintCard(null)}
                className="w-1/2 text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="w-1/2 text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK GENERATE */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-surface-900 dark:text-white mb-2">
              Bulk Generate Room QR Codes
            </h3>
            <p className="text-xs text-surface-500 mb-4">
              Generate unique cryptographically secure QR tokens for all active hotel rooms.
            </p>

            <div className="space-y-3 mb-5">
              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkOverwrite}
                  onChange={(e) => setBulkOverwrite(e.target.checked)}
                  className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-surface-800 dark:text-surface-200 block">
                    Overwrite existing active QR codes
                  </span>
                  <span className="text-surface-400 text-[11px]">
                    If checked, existing room QR codes will be invalidated and replaced with fresh tokens.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkModal(false)}
                className="w-1/2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkGenerate}
                disabled={bulkLoading}
                className="w-1/2 text-xs"
              >
                {bulkLoading ? 'Generating...' : 'Start Bulk Generation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / CONFIGURE SINGLE ROOM QR */}
      {showSingleGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleGenerateSingle}
            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
          >
            <h3 className="text-base font-bold text-surface-900 dark:text-white mb-2">
              Configure Room QR Code
            </h3>
            <p className="text-xs text-surface-500 mb-4">
              Assign or regenerate a QR code token for an individual room.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Select Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  required
                  className="w-full text-xs rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose a room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
                <label className="flex items-center space-x-2 text-xs font-medium text-surface-700 dark:text-surface-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePin}
                    onChange={(e) => setRequirePin(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Require security PIN to access menu</span>
                </label>

                {requirePin && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-semibold text-surface-500 mb-1">
                      Room PIN Code (e.g., 4-digit code)
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="e.g. 1234"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      required={requirePin}
                      className="w-full text-xs rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowSingleGenModal(false)}
                className="w-1/2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={submitting}
                className="w-1/2 text-xs"
              >
                {submitting ? 'Saving...' : 'Generate QR'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PRINT ALL CARDS SHEET */}
      {showPrintAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-surface-200 dark:border-surface-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Print All In-Room QR Cards ({qrList.filter((q) => q.isActive).length} Active Rooms)
                </h3>
                <p className="text-xs text-surface-500">
                  Ready-to-cut guest tent cards for room nightstands and desks
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Sheet
                </Button>
                <button
                  onClick={() => setShowPrintAllModal(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Multi-Card Printable Grid */}
            <div className="overflow-y-auto flex-1 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {qrList
                .filter((q) => q.isActive)
                .map((qr) => (
                  <div
                    key={qr.id}
                    className="border border-surface-300 dark:border-surface-700 rounded-xl p-4 bg-white dark:bg-surface-800 text-center shadow-xs flex flex-col items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-primary-600 dark:text-primary-400 uppercase">
                        Grand Hotel & Resort
                      </div>
                      <div className="text-sm font-extrabold text-surface-900 dark:text-white mt-0.5">
                        In-Room Dining
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-surface-200 shadow-xs my-2">
                      <QRCodeSVG value={qr.qrUrl} size={120} level="M" />
                    </div>

                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-600 text-white font-bold text-xs">
                        ROOM {qr.roomNumber}
                      </span>
                      <p className="text-[10px] text-surface-400 mt-1">
                        Scan with camera to order
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
