import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { MenuItemDto } from '@/types/operations';
import { Card, StatCard } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  DollarSign,
  Search,
} from 'lucide-react';

export const MenuItemsScreen: React.FC = () => {
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [itemCode, setItemCode] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('MAINS');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(25.0);
  const [prepTime, setPrepTime] = useState<number>(15);
  const [dietaryType, setDietaryType] = useState<string>('VEG');

  const fetchItems = async () => {
    setLoading(true);
    const res = await api.get<MenuItemDto[]>('/restaurant/menu');
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleAvailability = async (item: MenuItemDto) => {
    const res = await api.put(`/restaurant/menu/${item.id}/availability`, {
      isAvailable: !item.isAvailable,
    });
    if (res.success) {
      await fetchItems();
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await api.post('/restaurant/menu', {
      itemCode,
      itemName,
      category,
      description,
      price,
      preparationTimeMinutes: prepTime,
      dietaryType,
      isAvailable: true,
    });
    setCreating(false);

    if (res.success) {
      setShowCreateModal(false);
      setItemCode('');
      setItemName('');
      setDescription('');
      await fetchItems();
    }
  };

  const categories = ['ALL', 'APPETIZERS', 'MAINS', 'BREADS', 'DESSERTS', 'COCKTAILS'];

  const filteredItems = items.filter((i) => {
    const matchesCat = selectedCategory === 'ALL' ? true : i.category === selectedCategory;
    const matchesQuery = searchQuery
      ? i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCat && matchesQuery;
  });

  const activeCount = items.filter((i) => i.isAvailable).length;
  const avgPrice = items.length
    ? Math.round((items.reduce((acc, i) => acc + i.price, 0) / items.length) * 10) / 10
    : 0;
  const avgPrep = items.length
    ? Math.round(items.reduce((acc, i) => acc + (i.preparationTimeMinutes || 0), 0) / items.length)
    : 0;

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'F&B', href: '/restaurant/pos' },
          { label: 'Menu Catalog' },
        ]}
        title="Culinary Menu Items & Pricing"
        subtitle="Manage food & beverage catalog, kitchen prep times, and real-time availability"
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchItems}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Menu Item
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Catalog Dishes"
          value={items.length}
          subtitle="Total menu selections"
          icon={<UtensilsCrossed className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Kitchen Ready (Active)"
          value={activeCount}
          subtitle="Currently available to order"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Average Dish Price"
          value={`$${avgPrice.toFixed(2)}`}
          subtitle="Menu gross ticket avg"
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Average Prep Time"
          value={`${avgPrep} min`}
          subtitle="Target ticket pace"
          icon={<Clock className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const count =
              cat === 'ALL' ? items.length : items.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-surface dark:bg-navy-900 text-slate-600 dark:text-slate-400 border border-border dark:border-navy-700/80 hover:bg-slate-50 dark:hover:bg-navy-800'
                }`}
              >
                <span>{cat.replace('_', ' ')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-indigo-500/80 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search dish or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border dark:border-navy-700 bg-surface dark:bg-navy-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Items Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Loading culinary catalog...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2 border-dashed">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Dishes Found</h3>
          <p className="text-xs">No culinary items match the current category and search criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all shadow-sm ${
                !item.isAvailable ? 'opacity-75 bg-slate-50/50 dark:bg-navy-900/50' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-border dark:border-navy-700">
                    {item.itemCode}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.dietaryType === 'VEG'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : item.dietaryType === 'VEGAN'
                          ? 'bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {item.dietaryType}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {item.itemName}
                </h3>
                {item.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">Fresh kitchen preparation</p>
                )}
              </div>

              <div className="pt-3 border-t border-border dark:border-navy-700/60 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{item.preparationTimeMinutes || 15} mins prep</span>
                </span>

                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
                    item.isAvailable
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> 86'd (Sold Out)
                    </>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Menu Dish"
        subtitle="Culinary specifications, pricing, and category mapping"
        icon={<UtensilsCrossed className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateItem}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={creating}
              isLoading={creating}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Register Dish
            </Button>
          </>
        }
      >
        <FormGrid cols={2}>
          <Input
            label="Item SKU / Code *"
            required
            placeholder="e.g. MNU-MAIN-05"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
          />
          <Input
            label="Selling Price ($) *"
            type="number"
            step="0.5"
            required
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          />
        </FormGrid>

        <Input
          label="Dish / Beverage Name *"
          required
          placeholder="e.g. Pan-Roasted Duck Breast"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />

        <DynamicDropdown
          masterCode="MENU_CATEGORY"
          label="Culinary Category *"
          value={category}
          onChange={(val) => setCategory(val)}
        />

        <FormGrid cols={2}>
          <Input
            label="Prep Time (Minutes)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(parseInt(e.target.value) || 15)}
          />

          <Select
            label="Dietary Classification"
            value={dietaryType}
            onChange={(e) => setDietaryType(e.target.value)}
            options={[
              { value: 'VEG', label: 'Vegetarian' },
              { value: 'NON_VEG', label: 'Non-Vegetarian' },
              { value: 'VEGAN', label: 'Strict Vegan' },
            ]}
          />
        </FormGrid>

        <Textarea
          label="Culinary Description &amp; Ingredients"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Served with parsnip puree, charred asparagus, and port wine glaze"
        />
      </Modal>
    </PageContainer>
  );
};
