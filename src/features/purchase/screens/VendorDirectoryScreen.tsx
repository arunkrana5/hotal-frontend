import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { VendorDto, CreateVendorRequest } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  CreditCard,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const VendorDirectoryScreen: React.FC = () => {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateVendorRequest>({
    vendorCode: '',
    vendorName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    paymentTermsDays: 30,
  });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab === 'ACTIVE') query.append('isActive', 'true');
    if (activeTab === 'INACTIVE') query.append('isActive', 'false');

    const res = await api.get<PagedResult<VendorDto>>(`/purchase/vendors?${query.toString()}`);
    if (res.success && res.data) {
      setVendors(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorCode.trim() || !formData.vendorName.trim()) {
      setErrorMsg('Vendor code and company name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const res = await api.post<VendorDto>('/purchase/vendors', formData);
    if (res.success) {
      setShowCreateDrawer(false);
      setFormData({
        vendorCode: '',
        vendorName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        paymentTermsDays: 30,
      });
      fetchVendors();
    } else {
      setErrorMsg(res.message || 'Failed to register vendor.');
    }
    setSubmitting(false);
  };

  const columns: ColumnDef<VendorDto>[] = useMemo(
    () => [
      {
        accessorKey: 'vendorCode',
        header: 'Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'vendorName',
        header: 'Supplier / Company Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] font-mono text-brand-muted">
              {info.row.original.vendorCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'contactPerson',
        header: 'Point of Contact',
        cell: (info) => (
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {info.getValue() as string || 'General Desk'}
            </div>
            <div className="text-[11px] text-brand-muted flex items-center space-x-1.5">
              {info.row.original.email && <span>{info.row.original.email}</span>}
              {info.row.original.phone && <span className="font-mono">({info.row.original.phone})</span>}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'paymentTermsDays',
        header: 'Payment Terms',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-text">
            Net {info.getValue() as number || 30} Days
          </span>
        ),
      },
      {
        accessorKey: 'taxNumber',
        header: 'Tax Registration',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-muted">
            {info.getValue() as string || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedVendor(row.original)}
            isActive={row.original.status === 'ACTIVE'}
            onToggleStatus={() => {}}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Approved Suppliers & Vendors"
        badge={<StatusBadge status="ACTIVE" label="Procurement Registry" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Supplier
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Suppliers', count: totalCount },
          { id: 'ACTIVE', label: 'Active Approved' },
          { id: 'INACTIVE', label: 'Inactive / On Hold' },
        ]}
      />

      {/* 3. Data Table with Unified Top Toolbar */}
      <DataTable
        data={vendors}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vendor by name, code, contact person..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="vendor_directory.csv"
      />

      {/* 5. Create Supplier Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateVendor}
        title="Register New Vendor"
        subtitle="Add approved supplier to hotel procurement ledger"
        submitText={submitting ? 'Registering...' : 'Save Vendor'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Company Profile" description="Legal trade name and vendor code">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Vendor Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VND-FB-001"
              value={formData.vendorCode}
              onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value.toUpperCase() })}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Supplier Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gourmet Organic Meats Ltd."
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Contact & Settlement Terms" description="Point of contact and credit terms">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Direct Phone
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 304-9982"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="orders@gourmetmeats.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Tax ID / GST Number
            </label>
            <input
              type="text"
              placeholder="e.g. TAX-993821"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Billing &amp; Warehouse Address
            </label>
            <input
              type="text"
              placeholder="128 Industrial Boulevard, Suite 400"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Vendor Detail Drawer */}
      {selectedVendor && (
        <DetailDrawer
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={selectedVendor.vendorName}
          subtitle={`Vendor Code: ${selectedVendor.vendorCode}`}
          status={selectedVendor.status}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Contact Person</span>
                <span className="font-semibold text-brand-text">{selectedVendor.contactPerson || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Phone</span>
                <span className="font-mono text-brand-text">{selectedVendor.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Email</span>
                <span className="text-brand-text">{selectedVendor.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Payment Terms</span>
                <span className="font-mono text-brand-text">Net {selectedVendor.paymentTermsDays || 30} Days</span>
              </div>
            </div>

            {selectedVendor.address && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Physical Address</span>
                <p className="text-brand-text">{selectedVendor.address}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
