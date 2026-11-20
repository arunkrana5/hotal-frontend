import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { MenuItemDto } from '@/types/operations';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import {
  UtensilsCrossed,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle,
  Sparkles,
  Power,
} from 'lucide-react';

export const MenuItemsScreen: React.FC = () => {
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryTab, setCategoryTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MenuItemDto | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [itemCode, setItemCode] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('MAINS');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(25.0);
  const [prepTime, setPrepTime] = useState<number>(15);
  const [dietaryType, setDietaryType] = useState<string>('VEG');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await api.get<MenuItemDto[]>('/restaurant/menu');
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleAvailability = async (item: MenuItemDto) => {
    const res = await api.put(`/restaurant/menu/${item.id}/availability`, {
      isAvailable: !item.isAvailable,
    });
    if (res.success) {
      fetchItems();
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) {
      setErrorMsg('Item code and dish name are required.');
      return;
    }

    setCreating(true);
    setErrorMsg(null);
    const res = await api.post('/restaurant/menu', {
      itemCode,
      itemName,
      category,
      description,
      price: Number(price),
      preparationTimeMinutes: Number(prepTime),
      dietaryType,
      isAvailable: true,
    });

    if (res.success) {
      setShowCreateDrawer(false);
      setItemCode('');
      setItemName('');
      setDescription('');
      fetchItems();
    } else {
      setErrorMsg(res.message || 'Failed to create menu item.');
    }
    setCreating(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = categoryTab === 'ALL' || item.category === categoryTab;
      const matchDietary = dietaryFilter === 'ALL' || item.dietaryType === dietaryFilter;
      const matchSearch =
        !search.trim() ||
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchDietary && matchSearch;
    });
  }, [items, categoryTab, dietaryFilter, search]);

  const columns: ColumnDef<MenuItemDto>[] = useMemo(
    () => [
      {
        accessorKey: 'itemCode',
        header: 'Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'itemName',
        header: 'Dish / Item Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] text-brand-muted truncate max-w-xs">
              {info.row.original.description || info.row.original.category}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'dietaryType',
        header: 'Dietary',
        cell: (info) => {
          const dt = (info.getValue() as string) || 'VEG';
          return (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${dt === 'VEG' ? 'bg-[#16845B]/15 text-[#16845B]' : dt === 'NON_VEG' ? 'bg-[#D44848]/15 text-[#D44848]' : 'bg-purple-500/15 text-purple-700'}`}
            >
              {dt.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'preparationTimeMinutes',
        header: 'Prep Time',
        cell: (info) => (
          <div className="flex items-center space-x-1 font-mono text-xs text-brand-muted">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{info.getValue() as number} min</span>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price ($)',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'isAvailable',
        header: 'Availability',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleToggleAvailability(row.original)}
            className="flex items-center space-x-1.5 focus:outline-none"
            title="Click to toggle item availability (86 status)"
          >
            {row.original.isAvailable ? (
              <StatusBadge status="AVAILABLE" label="In Stock" />
            ) : (
              <StatusBadge status="OUTOFORDER" label="86'd (Sold Out)" />
            )}
          </button>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedItem(row.original)}
            isActive={row.original.isAvailable}
            onToggleStatus={() => handleToggleAvailability(row.original)}
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
        title="Restaurant Menu Catalog"
        badge={<StatusBadge status="ACTIVE" label="Live F&B Pricing" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Menu
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Dish / Item
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={categoryTab}
        onChange={setCategoryTab}
        tabs={[
          { id: 'ALL', label: 'All Dishes', count: items.length },
          { id: 'MAINS', label: 'Main Courses' },
          { id: 'APPETIZERS', label: 'Appetizers & Starters' },
          { id: 'DESSERTS', label: 'Desserts & Sweets' },
          { id: 'BEVERAGES', label: 'Bar & Cocktails' },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search dish by name, item code..."
        filters={[
          {
            id: 'dietary',
            label: 'Dietary Preference',
            value: dietaryFilter,
            options: [
              { label: 'All Dietary Types', value: 'ALL' },
              { label: 'Vegetarian', value: 'VEG' },
              { label: 'Non-Vegetarian', value: 'NON_VEG' },
              { label: 'Vegan', value: 'VEGAN' },
            ],
            onChange: setDietaryFilter,
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setDietaryFilter('ALL');
        }}
        isFiltered={search !== '' || dietaryFilter !== 'ALL'}
      />

      {/* 4. Data Table */}
      <DataTable
        data={filteredItems}
        columns={columns}
        totalCount={filteredItems.length}
        pageIndex={0}
        pageSize={50}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        isLoading={loading}
        enableSearch={false}
        enableExport={true}
      />

      {/* 5. Create Dish Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateItem}
        title="Add New Dish to Menu"
        subtitle="Configure dish classification, pricing, and prep duration"
        submitText={creating ? 'Saving...' : 'Add Item'}
        isLoading={creating}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Dish Identity" description="Item code and naming">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Item Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MN-STEAK-01"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value.toUpperCase())}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wagyu Ribeye Steak 250g"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="Menu Category"
              required
              size="sm"
              value={category}
              onChange={(val) => setCategory(val || 'MAINS')}
              options={[
                { value: 'MAINS', label: 'Main Courses', badge: 'MAIN' },
                { value: 'APPETIZERS', label: 'Appetizers & Starters', badge: 'APP' },
                { value: 'DESSERTS', label: 'Desserts', badge: 'DST' },
                { value: 'BEVERAGES', label: 'Beverages & Cocktails', badge: 'BEV' },
              ]}
              clearable={false}
            />
          </div>

          <div>
            <UniversalSelect
              label="Dietary Specification"
              size="sm"
              value={dietaryType}
              onChange={(val) => setDietaryType(val || 'NON_VEG')}
              options={[
                { value: 'VEG', label: 'Vegetarian', badge: 'VEG' },
                { value: 'NON_VEG', label: 'Non-Vegetarian', badge: 'NV' },
                { value: 'VEGAN', label: 'Strictly Vegan', badge: 'VGN' },
              ]}
              clearable={false}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Dish Description &amp; Ingredients
            </label>
            <input
              type="text"
              placeholder="e.g. Served with truffle mashed potatoes, grilled asparagus, and red wine jus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Pricing & Kitchen Timing" description="Menu price and preparation duration">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Menu Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-[#16845B] dark:text-[#45C79A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Preparation Time (Minutes)
            </label>
            <input
              type="number"
              min="1"
              value={prepTime}
              onChange={(e) => setPrepTime(parseInt(e.target.value) || 10)}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Detail Drawer */}
      {selectedItem && (
        <DetailDrawer
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.itemName}
          subtitle={`Code: ${selectedItem.itemCode} | Category: ${selectedItem.category}`}
          status={selectedItem.isAvailable ? 'AVAILABLE' : 'OUTOFORDER'}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Price</span>
                <span className="font-mono font-bold text-base text-brand-text">${selectedItem.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Average Prep</span>
                <span className="font-mono text-brand-text">{selectedItem.preparationTimeMinutes} minutes</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Dietary</span>
                <span className="text-brand-text">{selectedItem.dietaryType}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Availability</span>
                <StatusBadge status={selectedItem.isAvailable ? 'AVAILABLE' : 'OUTOFORDER'} />
              </div>
            </div>

            {selectedItem.description && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Description</span>
                <p className="text-brand-text">{selectedItem.description}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
