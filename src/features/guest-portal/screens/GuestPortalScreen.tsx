import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  guestOrderApi,
  QrValidationResultDto,
  GuestSessionDto,
  MenuItemDto,
  GuestPlaceOrderRequest,
  GuestCreateServiceRequest,
} from '@/services/guestOrderApi';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Clock,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  Phone,
  BedDouble,
  ChevronRight,
  Flame,
  Droplet,
  Wrench,
  Luggage,
  ShieldCheck,
  Send,
  ArrowRight,
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItemDto;
  quantity: number;
  notes: string;
}

export const GuestPortalScreen: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // QR validation & Session
  const [validating, setValidating] = useState<boolean>(true);
  const [qrInfo, setQrInfo] = useState<QrValidationResultDto | null>(null);
  const [session, setSession] = useState<GuestSessionDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PIN security
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSubmitting, setPinSubmitting] = useState<boolean>(false);

  // Active View Tab: 'MENU' or 'SERVICES'
  const [activeTab, setActiveTab] = useState<'MENU' | 'SERVICES'>('MENU');

  // Menu items & filtering
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  // Cart
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [contactPhone, setContactPhone] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CHARGE_TO_ROOM' | 'PAY_ON_DELIVERY'>('CHARGE_TO_ROOM');
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Service Request
  const [serviceModal, setServiceModal] = useState<{ type: string; title: string; dept: string } | null>(null);
  const [serviceDescription, setServiceDescription] = useState<string>('');
  const [serviceSubmitting, setServiceSubmitting] = useState<boolean>(false);

  // 1. Resolve QR token on mount
  useEffect(() => {
    if (!token) {
      setErrorMessage('No room QR token provided. Please scan the QR code in your room.');
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      setValidating(true);
      const res = await guestOrderApi.resolveQrToken(token);
      if (res.success && res.data && res.data.isValid) {
        setQrInfo(res.data);
        if (!res.data.requirePin) {
          // Initialize session directly
          await startSession(token, null, res.data.guestName || undefined);
        }
      } else {
        setErrorMessage(res.message || res.data?.errorMessage || 'This room QR code is invalid or has expired.');
      }
      setValidating(false);
    };

    validateToken();
  }, [token]);

  // Start guest session
  const startSession = async (qrToken: string, pin: string | null, guestName?: string) => {
    try {
      setPinSubmitting(true);
      const res = await guestOrderApi.initSession({
        qrToken,
        pinCode: pin,
        guestName,
      });

      if (res.success && res.data) {
        setSession(res.data);
        setPinError(null);
        await loadMenu(res.data.sessionToken);
      } else {
        setPinError(res.message || 'Incorrect PIN code. Please check with the front desk.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Failed to authenticate session.');
    } finally {
      setPinSubmitting(false);
    }
  };

  // Handle PIN form submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || !token) return;
    startSession(token, pinInput.trim());
  };

  // Load Menu
  const loadMenu = async (sessionToken: string) => {
    setMenuLoading(true);
    const res = await guestOrderApi.getGuestMenu(sessionToken);
    if (res.success && res.data) {
      setMenuItems(res.data);
    }
    setMenuLoading(false);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [menuItems]);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (vegOnly && item.dietaryType !== 'VEG') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  // Cart Management
  const addToCart = (item: MenuItemDto) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const qty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: qty,
          notes: existing?.notes || '',
        },
      };
    });
    toast.success(`Added ${item.itemName} to cart`);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: newQty },
      };
    });
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, notes },
      };
    });
  };

  // Cart Totals
  const { cartItemsList, cartTotalCount, cartSubtotal, cartTax, cartGrandTotal } = useMemo(() => {
    const list = Object.values(cart);
    const count = list.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = list.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const grandTotal = subtotal + tax;
    return {
      cartItemsList: list,
      cartTotalCount: count,
      cartSubtotal: subtotal,
      cartTax: tax,
      cartGrandTotal: grandTotal,
    };
  }, [cart]);

  // Place Order
  const handlePlaceOrder = async () => {
    if (!session || cartItemsList.length === 0) return;

    setPlacingOrder(true);
    const orderPayload: GuestPlaceOrderRequest = {
      sessionToken: session.sessionToken,
      guestDisplayName: session.guestDisplayName,
      deliveryContactPhone: contactPhone.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      paymentMethod,
      items: cartItemsList.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        notes: c.notes.trim() || undefined,
      })),
    };

    const res = await guestOrderApi.placeGuestOrder(orderPayload);
    setPlacingOrder(false);

    if (res.success && res.data) {
      toast.success('Your order has been received by the kitchen!');
      setCart({});
      setCartDrawerOpen(false);
      navigate(`/guest/order/${res.data.orderNumber}`);
    } else {
      toast.error(res.message || 'Failed to place order. Please try again.');
    }
  };

  // Submit Service Request
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !serviceModal) return;

    setServiceSubmitting(true);
    const payload: GuestCreateServiceRequest = {
      sessionToken: session.sessionToken,
      requestType: serviceModal.type,
      description: serviceDescription.trim() || undefined,
    };

    const res = await guestOrderApi.requestService(payload);
    setServiceSubmitting(false);

    if (res.success && res.data) {
      toast.success(`Request ${res.data.requestNumber} logged. Our team is on the way!`);
      setServiceModal(null);
      setServiceDescription('');
    } else {
      toast.error(res.message || 'Failed to submit service request.');
    }
  };

  // State: Loading / Validating
  if (validating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full border-3 border-primary-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Connecting to your room...
        </h2>
        <p className="text-xs text-slate-400 mt-1">Verifying room QR security token</p>
      </div>
    );
  }

  // State: Error
  if (errorMessage || !qrInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Room QR Unavailable
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
          {errorMessage || 'The QR token could not be verified.'}
        </p>
        <div className="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left max-w-xs w-full text-xs space-y-2">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Need in-room dining assistance?
          </div>
          <p className="text-slate-500">
            Please dial <span className="font-bold font-mono">0</span> or <span className="font-bold font-mono">204</span> from your in-room telephone to reach the Front Desk or Room Service.
          </p>
        </div>
      </div>
    );
  }

  // State: PIN Entry Required
  if (qrInfo.requirePin && !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 text-xs font-bold uppercase tracking-wider">
            Room {qrInfo.roomNumber}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
            Enter Room PIN
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            This room is protected with a security PIN. Enter the PIN provided at check-in.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className="w-full text-center text-2xl tracking-widest font-mono py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {pinError && (
                <p className="text-xs text-rose-500 mt-1.5 font-medium">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pinSubmitting || !pinInput.trim()}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition"
            >
              {pinSubmitting ? 'Verifying...' : 'Unlock Guest Menu'}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4">
            Forgot PIN? Dial 0 from your in-room telephone for support.
          </p>
        </div>
      </div>
    );
  }

  // State: Active Guest Portal
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white pb-24">
      {/* Mobile-Centric Container */}
      <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl border-x border-slate-200 dark:border-slate-800/80 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-primary-600 dark:text-primary-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                  Grand Hotel & Resort
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                In-Room Guest Portal
              </h1>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-600 text-white text-xs font-black shadow-xs tracking-wide">
                ROOM {session?.roomNumber || qrInfo.roomNumber}
              </span>
              {session?.guestDisplayName && (
                <div className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                  {session.guestDisplayName}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Pill Switch: Dining vs Room Services */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mt-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('MENU')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'MENU'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>In-Room Dining</span>
            </button>
            <button
              onClick={() => setActiveTab('SERVICES')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'SERVICES'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BedDouble className="h-3.5 w-3.5" />
              <span>Hotel Services</span>
            </button>
          </div>
        </header>

        {/* TAB 1: IN-ROOM DINING MENU */}
        {activeTab === 'MENU' && (
          <div className="flex-1 p-4 space-y-4">
            {/* Search & Dietary Toggle */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, desserts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Category Pills & Veg Filter */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center space-x-1 ${
                    vegOnly
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>Veg Only</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            {menuLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading culinary menu...
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-slate-400">No menu items match your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMenu.map((item) => {
                  const inCart = cart[item.id];
                  const isVeg = item.dietaryType === 'VEG';

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex justify-between items-start space-x-3 transition hover:border-primary-400"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          {/* Veg / Non-Veg Indicator */}
                          <span
                            className={`h-3 w-3 rounded-xs border flex items-center justify-center p-0.5 ${
                              isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                            title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.itemName}
                          </h3>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1.5">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.preparationTimeMinutes > 0 && (
                            <span className="text-[10px] text-slate-400 flex items-center space-x-0.5">
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              {item.preparationTimeMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity or Add Button */}
                      <div className="shrink-0 flex items-center">
                        {inCart ? (
                          <div className="flex items-center space-x-1.5 bg-primary-50 dark:bg-primary-950/60 p-1 rounded-xl border border-primary-200 dark:border-primary-800">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-6 w-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs text-xs"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-primary-700 dark:text-primary-300">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-6 w-6 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-xs text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold transition flex items-center space-x-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOTEL & ROOM SERVICES */}
        {activeTab === 'SERVICES' && (
          <div className="flex-1 p-4 space-y-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950/40 rounded-2xl border border-primary-100 dark:border-primary-900 text-xs text-primary-900 dark:text-primary-200 space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                <span>Instant In-Room Service Requests</span>
              </span>
              <p className="text-[11px] text-primary-700 dark:text-primary-300">
                Select any amenity or service below. Our concierge and housekeeping teams will be dispatched to Room {session?.roomNumber}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setServiceModal({
                    type: 'EXTRA_TOWELS',
                    title: 'Fresh Towels & Bathrobe',
                    dept: 'Housekeeping',
                  })
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-primary-500 transition shadow-xs space-y-1.5"
              >
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Extra Towels
                </div>
                <div className="text-[10px] text-slate-400">Bath & face towels</div>
              </button>

              <button
                onClick={() =>
                  setServiceModal({
                    type: 'BOTTLED_WATER',
                    title: 'Mineral Water & Glasses',
                    dept: 'Room Service',
                  })
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-primary-500 transition shadow-xs space-y-1.5"
              >
                <div className="h-8 w-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
                  <Droplet className="h-4 w-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Mineral Water
                </div>
                <div className="text-[10px] text-slate-400">Complimentary bottles</div>
              </button>

              <button
                onClick={() =>
                  setServiceModal({
                    type: 'ROOM_CLEANING',
                    title: 'Tidy & Make Up Room',
                    dept: 'Housekeeping',
                  })
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-primary-500 transition shadow-xs space-y-1.5"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Room Cleaning
                </div>
                <div className="text-[10px] text-slate-400">Turn-down / refresh</div>
              </button>

              <button
                onClick={() =>
                  setServiceModal({
                    type: 'MAINTENANCE_ISSUE',
                    title: 'AC / TV / Room Assistance',
                    dept: 'Maintenance',
                  })
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-primary-500 transition shadow-xs space-y-1.5"
              >
                <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Maintenance
                </div>
                <div className="text-[10px] text-slate-400">AC, TV, plumbing issue</div>
              </button>

              <button
                onClick={() =>
                  setServiceModal({
                    type: 'BELLBOY_LUGGAGE',
                    title: 'Luggage / Bellboy Help',
                    dept: 'Front Desk',
                  })
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-primary-500 transition shadow-xs space-y-1.5 col-span-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                    <Luggage className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Luggage Assistance & Bellboy
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Assistance with check-in/out bags
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* FLOATING CART BAR (If items added) */}
        {cartTotalCount > 0 && activeTab === 'MENU' && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="w-full bg-slate-900 dark:bg-primary-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between transition transform active:scale-98"
            >
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                  {cartTotalCount}
                </span>
                <span>View Order Cart</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-black">
                <span>${cartGrandTotal.toFixed(2)}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}

        {/* CART & CHECKOUT DRAWER / MODAL */}
        {cartDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Your In-Room Order
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Delivering to Room {session?.roomNumber}
                  </p>
                </div>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {cartItemsList.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.menuItem.itemName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ${item.menuItem.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity adjustment */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="h-6 w-6 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="h-6 w-6 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Custom note */}
                      <input
                        type="text"
                        placeholder="Add prep notes (e.g. less salt)..."
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                        className="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-44"
                      />
                    </div>
                  </div>
                ))}

                {/* Bill Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>F&B Tax & Service (5%)</span>
                    <span>${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Amount</span>
                    <span>${cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number (Optional, for SMS/Call alerts)
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Delivery Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ring bell twice, leave outside door, etc."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Payment Settlement Method
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CHARGE_TO_ROOM')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          paymentMethod === 'CHARGE_TO_ROOM'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[11px]">Charge to Room</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Post to room folio
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('PAY_ON_DELIVERY')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          paymentMethod === 'PAY_ON_DELIVERY'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[11px]">Pay on Delivery</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Cash / Card to runner
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Action */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {placingOrder
                      ? 'Submitting to Kitchen...'
                      : `Place Order • $${cartGrandTotal.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SERVICE REQUEST MODAL */}
        {serviceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <form
              onSubmit={handleServiceSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                    {serviceModal.dept} Request
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {serviceModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Specific Requests or Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please bring 2 extra bath sheets, or notify before knocking..."
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setServiceModal(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  {serviceSubmitting ? 'Sending...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
