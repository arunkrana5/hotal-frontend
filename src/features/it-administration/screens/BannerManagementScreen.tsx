import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { FormDrawer, FormSection, RowActions, StatusBadge, ListToolbar } from '@/components/enterprise';
import { useConfirm } from '@/context/ConfirmContext';
import { notify } from '@/services/notify';
import {
  Image as ImageIcon,
  Plus,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export interface BannerItemDto {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  propertyId?: number;
  targetRole?: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const BannerManagementScreen: React.FC = () => {
  const [banners, setBanners] = useState<BannerItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBanner, setSelectedBanner] = useState<BannerItemDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm } = useConfirm();

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    badge: 'Executive Announcement',
    imageUrl: '',
    ctaText: 'View Details',
    ctaLink: '/dashboard',
    displayOrder: 1,
    isActive: true,
  });

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<BannerItemDto[]>('/system/banners?activeOnly=false');
      if (res.success && res.data) {
        setBanners(res.data);
      }
    } catch {
      notify.error('Failed to load banner announcements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenCreate = () => {
    setSelectedBanner(null);
    setFormState({
      title: '',
      subtitle: '',
      badge: 'Executive Pulse',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Explore',
      ctaLink: '/dashboard',
      displayOrder: banners.length + 1,
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (banner: BannerItemDto) => {
    setSelectedBanner(banner);
    setFormState({
      title: banner.title,
      subtitle: banner.subtitle,
      badge: banner.badge || 'Announcement',
      imageUrl: banner.imageUrl,
      ctaText: banner.ctaText || 'View Details',
      ctaLink: banner.ctaLink || '/dashboard',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setIsDrawerOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.imageUrl.trim()) {
      notify.warning('Title and Image URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedBanner) {
        const res = await api.put(`/system/banners/${selectedBanner.id}`, formState);
        if (res.success) {
          notify.success('Banner updated successfully');
          setIsDrawerOpen(false);
          fetchBanners();
        } else {
          notify.error(res.message || 'Failed to update banner');
        }
      } else {
        const res = await api.post('/system/banners', formState);
        if (res.success) {
          notify.success('New banner announcement created');
          setIsDrawerOpen(false);
          fetchBanners();
        } else {
          notify.error(res.message || 'Failed to create banner');
        }
      }
    } catch (err) {
      notify.error('Server error saving banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (banner: BannerItemDto) => {
    const res = await confirm({
      title: `Delete Announcement Banner?`,
      message: `Are you sure you want to delete "${banner.title}"? It will immediately disappear from all dashboard carousels.`,
      variant: 'delete',
      confirmText: 'Delete Banner',
    });

    if (res.confirmed) {
      try {
        const delRes = await api.delete(`/system/banners/${banner.id}`);
        if (delRes.success) {
          notify.success('Banner deleted');
          fetchBanners();
        } else {
          notify.error(delRes.message || 'Failed to delete banner');
        }
      } catch {
        notify.error('Network error deleting banner');
      }
    }
  };

  const filteredBanners = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Carousel Banners' },
        ]}
        title="Dashboard Banners & Announcements"
        subtitle="Manage executive welcome carousel slides, operational highlights, and property announcements"
        icon={<ImageIcon className="w-4 h-4 text-brand-primary" />}
        actions={
          <PageActions>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-all flex items-center space-x-1.5 shadow-soft-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Announcement</span>
            </button>
          </PageActions>
        }
      />

      {/* Toolbar */}
      <ListToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter banners by title or badge..."
        onResetFilters={() => setSearchQuery('')}
        isFiltered={!!searchQuery}
      />

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-brand-muted">
            Loading carousel announcement slides...
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-brand-muted bg-brand-surface dark:bg-brand-darkSurface rounded-2xl border border-brand-border dark:border-brand-darkBorder">
            No banners found. Click "+ Create Announcement" to publish your first slide.
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-primary/90 text-white backdrop-blur-md">
                      {banner.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2.5">
                    <StatusBadge status={banner.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-sm text-brand-text line-clamp-1">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                    {banner.subtitle}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-brand-border dark:border-brand-darkBorder flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-brand-muted">Order: #{banner.displayOrder}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="px-2.5 py-1 rounded-lg border border-brand-border bg-slate-50 dark:bg-brand-darkCard hover:bg-slate-100 text-xs font-semibold text-brand-text"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner)}
                    className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-[#D44848] hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-over Form Drawer */}
      <FormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleSaveBanner}
        title={selectedBanner ? `Edit Banner #${selectedBanner.id}` : 'Create Carousel Announcement'}
        subtitle="Configure banner visuals, scheduling, call-to-action button, and display priority"
        submitText={isSubmitting ? 'Saving...' : selectedBanner ? 'Update Slide' : 'Publish Slide'}
        isLoading={isSubmitting}
        width="md"
      >
        <FormSection title="Visual Appearance" description="Hero image and header tags">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Banner Headline *
            </label>
            <input
              type="text"
              required
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="e.g. Grand Luxury Resort — Operational Yield Peak"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Subtitle / Overview Message
            </label>
            <textarea
              rows={2}
              value={formState.subtitle}
              onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
              placeholder="Summary of this operational highlight or event..."
              className="w-full p-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Badge Pill Text
            </label>
            <input
              type="text"
              value={formState.badge}
              onChange={(e) => setFormState({ ...formState, badge: e.target.value })}
              placeholder="e.g. Executive Pulse"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Display Sequence Order
            </label>
            <input
              type="number"
              min={1}
              value={formState.displayOrder}
              onChange={(e) => setFormState({ ...formState, displayOrder: Number(e.target.value) })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Cover Image URL *
            </label>
            <input
              type="url"
              required
              value={formState.imageUrl}
              onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Call To Action & Routing" description="Configure direct navigation trigger">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              CTA Button Label
            </label>
            <input
              type="text"
              value={formState.ctaText}
              onChange={(e) => setFormState({ ...formState, ctaText: e.target.value })}
              placeholder="e.g. View Room Matrix"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Target Route Path
            </label>
            <input
              type="text"
              value={formState.ctaLink}
              onChange={(e) => setFormState({ ...formState, ctaLink: e.target.value })}
              placeholder="e.g. /front-office/room-grid"
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="flex items-center pt-2 sm:col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer select-none text-xs font-semibold text-brand-text">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              <span>Publish and show on live hotel dashboard</span>
            </label>
          </div>
        </FormSection>
      </FormDrawer>
    </PageContainer>
  );
};
