import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { VendorDto, CreateVendorRequest } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Mail,
  Phone,
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export const VendorDirectoryScreen: React.FC = () => {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
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

  const fetchVendors = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (searchTerm) query.append('search', searchTerm);

    const res = await api.get<PagedResult<VendorDto>>(`/purchase/vendors?${query.toString()}`);
    if (res.success && res.data) {
      setVendors(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, [pageIndex, pageSize, searchTerm]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<VendorDto>('/purchase/vendors', formData);
    if (res.success) {
      setShowCreateModal(false);
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
    }
    setSubmitting(false);
  };

  const columns = useMemo<ColumnDef<VendorDto>[]>(
    () => [
      {
        accessorKey: 'vendorCode',
        header: 'Vendor Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'vendorName',
        header: 'Vendor / Company Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {info.row.original.address}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'contactPerson',
        header: 'Primary Representative',
        cell: (info) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {(info.getValue() as string) || 'Account Rep'}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Supplier Contacts',
        cell: (info) => (
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{info.getValue() as string}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{info.row.original.phone}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'paymentTermsDays',
        header: 'Credit Terms',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            Net {info.getValue() as number} Days
          </Badge>
        ),
      },
      {
        accessorKey: 'taxNumber',
        header: 'Tax ID / VAT',
        cell: (info) => (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {(info.getValue() as string) || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Supplier Status',
        cell: (info) => {
          const status = info.getValue() as string;
          return status === 'ACTIVE' ? (
            <Badge variant="success" dot>Active Vendor</Badge>
          ) : (
            <Badge variant="neutral">{status || 'Approved'}</Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Procurement', href: '/purchase/requisitions' },
          { label: 'Vendors' },
        ]}
        title="Vendor Directory & Supplier Master"
        subtitle="Approved supplier database, payment terms, tax registrations & contract compliance"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Vendor
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Registered Vendors
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Suppliers
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compliance Status
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              KYV &amp; Tax Registered
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Standard Terms
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              Net 30 &amp; 60 Days
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Procurement Desk
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Live Central ERP
            </div>
          </div>
        </Card>
      </div>

      {/* Vendors DataTable */}
      <DataTable<VendorDto>
        title="Supplier &amp; Vendor Directory"
        subtitle="Hotel master vendor register with credit terms and tax compliance numbers"
        data={vendors}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSearchChange={(s) => {
          setSearchTerm(s);
          setPageIndex(0);
        }}
        onRefresh={fetchVendors}
        searchPlaceholder="Filter vendors by name, code, contact..."
        exportFileName="vendor_directory.csv"
      />

      {/* Register Vendor Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Hotel Supplier"
        subtitle="Add corporate vendor profile to procurement master database"
        icon={<Building2 className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateVendor}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !formData.vendorCode || !formData.vendorName}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Register Vendor
            </Button>
          </>
        }
      >
        <FormGrid cols={2}>
          <Input
            label="Vendor Code *"
            required
            value={formData.vendorCode}
            onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
            placeholder="e.g. VEN-BEV-001"
            className="font-mono uppercase"
          />
          <Input
            label="Company Name *"
            required
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
            placeholder="e.g. Royal Beverage Supplies LLC"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="e.g. Marcus Aurelius"
          />
          <Input
            label="Phone / Mobile"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 789-0123"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="orders@royalbeverage.com"
          />
          <Input
            label="Tax ID / VAT Registration #"
            value={formData.taxNumber}
            onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
            placeholder="e.g. TX-98214-GB"
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Registered Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Suite 400, Industrial Harbor Park"
          />
          <Input
            label="Credit Terms (Days)"
            type="number"
            min="0"
            value={formData.paymentTermsDays}
            onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
            className="font-mono"
          />
        </FormGrid>
      </Modal>
    </PageContainer>
  );
};
