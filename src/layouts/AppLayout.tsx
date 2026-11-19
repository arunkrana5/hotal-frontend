import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/services/api';
import { signalRService } from '@/services/signalr';
import { reportingService } from '@/services/reportingService';
import { NavigationMenuDto } from '@/types/configuration';
import { AppNotification } from '@/types/reporting';
import {
  Building2,
  LayoutDashboard,
  Bed,
  CalendarCheck,
  Users,
  Sparkles,
  UtensilsCrossed,
  Flame,
  Wine,
  ShoppingBag,
  Boxes,
  Receipt,
  Briefcase,
  Wrench,
  ShieldCheck,
  Cpu,
  BarChart3,
  User,
  Shield,
  KeyRound,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Search,
  Sun,
  Moon,
  Laptop,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Bed,
  CalendarCheck,
  Users,
  Sparkles,
  UtensilsCrossed,
  Flame,
  Wine,
  ShoppingBag,
  Boxes,
  Receipt,
  Briefcase,
  Wrench,
  ShieldCheck,
  Cpu,
  BarChart3,
  BookOpen,
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hotelos_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menus, setMenus] = useState<NavigationMenuDto[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    IT: true,
    REPORTS: true,
    FRONTOFFICE: true,
  });

  // Top header popover states
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [propertySelectorOpen, setPropertySelectorOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hover Flyout state for Collapsed Sidebar
  const [hoveredMenu, setHoveredMenu] = useState<{ menu: NavigationMenuDto; top: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close flyout on route navigation
  useEffect(() => {
    setHoveredMenu(null);
  }, [location.pathname]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Refs for outside clicks
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const propertyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(target)) {
        setThemeOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (propertyRef.current && !propertyRef.current.contains(target)) {
        setPropertySelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [commandPaletteOpen]);

  // Fetch Dynamic Navigation Menus
  useEffect(() => {
    const fetchMenus = async () => {
      const res = await api.request<NavigationMenuDto[]>('/menus');
      if (res.success && res.data) {
        setMenus(res.data);
      }
    };
    fetchMenus();
  }, []);

  // Fetch live notifications
  const fetchNotifications = async () => {
    try {
      const data = await reportingService.getNotifications(20);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup live SignalR real-time event listeners
    const unsubNotif = signalRService.onNotification((newNotif: AppNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    const unsubLive = signalRService.onLiveEvent(() => {
      fetchNotifications();
    });

    return () => {
      unsubNotif();
      unsubLive();
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await reportingService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await reportingService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('hotelos_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleExpand = (menuCode: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuCode]: !prev[menuCode],
    }));
  };

  const handleMouseEnterItem = (e: React.MouseEvent, menu: NavigationMenuDto) => {
    if (!isSidebarCollapsed) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const top = Math.min(rect.top, window.innerHeight - 340);
    setHoveredMenu({ menu, top: Math.max(12, top) });
  };

  const handleMouseLeaveItem = () => {
    if (!isSidebarCollapsed) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 180);
  };

  const handleMouseEnterFlyout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveFlyout = () => {
    setHoveredMenu(null);
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <LayoutDashboard className="w-4 h-4" />;
    const IconComponent = iconMap[iconName] || LayoutDashboard;
    return <IconComponent className="w-4 h-4" />;
  };

  const renderNotificationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CRITICAL':
      case 'DANGER':
        return <AlertTriangle className="w-4 h-4 text-[#D44848] shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-[#C78B24] shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#2876C7] shrink-0" />;
    }
  };

  // Flatten searchable links for Ctrl+K Command Palette
  const searchableLinks = useMemo(() => {
    const list: { title: string; path: string; module: string; icon?: string }[] = [
      { title: 'Enterprise User Manual & Role Guides', path: '/manual', module: 'Documentation & Help', icon: 'BookOpen' },
      { title: 'IT Administration Manual & Maintenance', path: '/manual', module: 'IT Department', icon: 'ShieldCheck' },
      { title: 'Front Office & Check-In Guide', path: '/manual', module: 'Front Office', icon: 'Building2' },
      { title: 'Restaurant POS & Kitchen Guide', path: '/manual', module: 'Restaurant & POS', icon: 'UtensilsCrossed' }
    ];
    for (const m of menus) {
      if (m.path && (!m.children || m.children.length === 0)) {
        list.push({ title: m.title, path: m.path, module: m.module || 'Operations', icon: m.icon });
      }
      if (m.children) {
        for (const sub of m.children) {
          list.push({ title: sub.title, path: sub.path, module: m.title, icon: m.icon });
        }
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter((item) => item.title.toLowerCase().includes(q) || item.module.toLowerCase().includes(q));
    }
    return list;
  }, [menus, searchQuery]);

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-brand-bg text-brand-text antialiased">
      {/* 1. TOP NAVIGATION HEADER (Strictly fixed height, never scrolls) */}
      <header className="h-12 shrink-0 border-b border-brand-border bg-brand-surface/95 dark:bg-brand-darkSurface/95 backdrop-blur-md flex items-center justify-between z-30 transition-colors shadow-soft-xs">
        {/* Left Section: Sidebar Brand Segment (Width transitions seamlessly with sidebar below) */}
        <div
          className={cn(
            'flex items-center h-full border-r border-brand-border dark:border-brand-darkBorder transition-all duration-300 ease-in-out shrink-0 select-none bg-brand-surface dark:bg-navy-900',
            isSidebarCollapsed ? 'w-16 justify-center px-0' : 'w-60 px-3'
          )}
        >
          {/* Mobile Drawer Trigger (Small screens only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Drawer"
            className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-darkSecondary transition-colors mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isSidebarCollapsed ? (
            /* COLLAPSED STATE: ONLY ICON SHOWS ON TOP (Centered, no text) */
            <div className="flex items-center justify-center w-full">
              <Link to="/dashboard" title="HotelOS Enterprise PMS" className="group">
                <div className="w-7 h-7 rounded-lg bg-[#354FC7] dark:bg-[#8495FF] text-white dark:text-navy-950 flex items-center justify-center font-black text-xs shadow-soft-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
              </Link>
            </div>
          ) : (
            /* EXPANDED STATE: ICON WITH NAME (Full brand title) */
            <div className="flex items-center space-x-2 w-full min-w-0">
              <Link to="/dashboard" className="flex items-center space-x-2 group min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#354FC7] dark:bg-[#8495FF] text-white dark:text-navy-950 flex items-center justify-center font-black text-xs shadow-soft-xs group-hover:scale-105 transition-transform shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="font-extrabold tracking-tight text-sm text-brand-text truncate">HotelOS</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-[#354FC7] dark:bg-brand-darkSecondary dark:text-[#8495FF] border border-indigo-100 dark:border-brand-darkBorder shrink-0">
                    PMS
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Right Section: Header Content Area */}
        <div className="flex-1 h-full px-3 sm:px-4 flex items-center justify-between min-w-0">
          {/* Navigation Toggle Button NEXT TO the sidebar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSidebarCollapse}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors flex items-center justify-center"
              title={isSidebarCollapsed ? 'Expand Sidebar (Menu)' : 'Collapse Sidebar (Close)'}
            >
              {isSidebarCollapsed ? (
                <Menu className="w-4 h-4 text-brand-primary dark:text-[#8495FF]" />
              ) : (
                <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>
          </div>

          {/* Right Header Utilities: Search, Property Switcher, Theme, Notifications & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Quick Search / Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-brand-border bg-slate-50/70 hover:bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors shadow-soft-xs"
            title="Global Navigation Search (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">Search operations...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shadow-soft-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Property Selector */}
          <div className="relative" ref={propertyRef}>
            <button
              onClick={() => {
                setPropertySelectorOpen(!propertySelectorOpen);
                setNotificationsOpen(false);
                setProfileOpen(false);
                setThemeOpen(false);
              }}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface hover:bg-slate-50 dark:bg-brand-darkCard dark:border-brand-darkBorder text-xs transition-colors shadow-soft-xs"
            >
              <div className="w-2 h-2 rounded-full bg-[#16845B]" />
              <span className="font-semibold text-brand-text text-[11px] max-w-[130px] truncate">
                Grand Luxury Resort
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {propertySelectorOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface p-2 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-brand-border dark:border-brand-darkBorder">
                  Multi-Property Chain Switcher
                </div>
                <div className="py-1 space-y-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 text-brand-primary font-semibold cursor-default">
                    <div>
                      <div>Grand Luxury Resort &amp; Spa</div>
                      <div className="text-[10px] text-slate-400 font-normal">Property ID: #1 &bull; Flagship Resort</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                  </div>
                  <div className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 opacity-60 cursor-not-allowed">
                    <div>HotelOS City Grand Tower</div>
                    <div className="text-[10px] text-slate-400">Property ID: #2 &bull; Secondary Property</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher: Light / Dark / System */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => {
                setThemeOpen(!themeOpen);
                setNotificationsOpen(false);
                setProfileOpen(false);
                setPropertySelectorOpen(false);
              }}
              aria-label="Theme Settings"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors border border-transparent hover:border-brand-border dark:hover:border-brand-darkBorder"
              title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}`}
            >
              {themeMode === 'system' ? (
                <Laptop className="w-4 h-4 text-indigo-500" />
              ) : resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface p-1 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => {
                    setThemeMode('light');
                    setThemeOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors',
                    themeMode === 'light'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-brand-text hover:bg-slate-100 dark:hover:bg-brand-darkCard'
                  )}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => {
                    setThemeMode('dark');
                    setThemeOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors',
                    themeMode === 'dark'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-brand-text hover:bg-slate-100 dark:hover:bg-brand-darkCard'
                  )}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => {
                    setThemeMode('system');
                    setThemeOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors',
                    themeMode === 'system'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-brand-text hover:bg-slate-100 dark:hover:bg-brand-darkCard'
                  )}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>

          {/* User Manual & Knowledge Center */}
          <Link
            to="/manual"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors border border-transparent hover:border-brand-border dark:hover:border-brand-darkBorder"
            title="Enterprise User Manual & Role Guides"
          >
            <BookOpen className="w-4 h-4 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400" />
          </Link>

          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
                setPropertySelectorOpen(false);
                setThemeOpen(false);
              }}
              aria-label="Notifications"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors relative border border-transparent hover:border-brand-border dark:hover:border-brand-darkBorder"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#D44848] text-[9px] font-black text-white ring-2 ring-white dark:ring-brand-darkSurface animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between bg-slate-50/70 dark:bg-brand-darkCard">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-brand-text">Hotel Alerts &amp; Events</span>
                    {unreadCount > 0 && (
                      <span className="bg-[#D44848]/15 text-[#D44848] dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-semibold text-brand-primary dark:text-[#8495FF] hover:underline flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-brand-border dark:divide-brand-darkBorder">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet. You're completely up to date!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={cn(
                          'p-3 text-xs cursor-pointer transition-colors flex items-start space-x-2.5',
                          notif.isRead
                            ? 'bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50 dark:hover:bg-brand-darkCard'
                            : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40'
                        )}
                      >
                        {renderNotificationIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-brand-text truncate">{notif.title}</p>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 ml-1.5" />}
                          </div>
                          <p className="text-[11px] text-brand-muted mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-brand-border dark:border-brand-darkBorder text-center bg-slate-50/50 dark:bg-brand-darkCard">
                  <Link
                    to="/reports/center"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] text-brand-primary dark:text-[#8495FF] font-semibold hover:underline"
                  >
                    View Executive Reports &amp; Analytics &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
                setPropertySelectorOpen(false);
                setThemeOpen(false);
              }}
              aria-label="User Profile"
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors select-none border border-transparent hover:border-brand-border dark:hover:border-brand-darkBorder"
            >
              <div className="w-7 h-7 rounded-lg bg-navy-900 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-soft-xs">
                {user?.firstName?.charAt(0) || 'A'}
                {user?.lastName?.charAt(0) || 'D'}
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <div className="font-bold text-brand-text">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[10px] text-brand-muted mt-0.5">
                  {user?.roles?.[0] || 'Administrator'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface py-1.5 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-2.5 border-b border-brand-border dark:border-brand-darkBorder">
                  <div className="font-bold text-brand-text">{user?.username}</div>
                  <div className="text-[11px] text-brand-muted truncate">{user?.email}</div>
                  <div className="mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#16845B] border border-[#16845B]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Property #{user?.defaultPropertyId || 1} Primary
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/manual"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-brand-text text-xs"
                  >
                    <BookOpen className="w-4 h-4 mr-2 text-brand-primary dark:text-[#8495FF]" /> User Manual &amp; Guides
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-brand-text"
                  >
                    <User className="w-4 h-4 mr-2 text-slate-400" /> Account Profile
                  </Link>
                  <Link
                    to="/sessions"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-brand-text"
                  >
                    <Shield className="w-4 h-4 mr-2 text-slate-400" /> Active Sessions
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-brand-darkCard text-brand-text"
                  >
                    <KeyRound className="w-4 h-4 mr-2 text-slate-400" /> Change Password
                  </Link>
                </div>

                <div className="border-t border-brand-border dark:border-brand-darkBorder pt-1">
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-3.5 py-2 text-[#D44848] hover:bg-red-50 dark:hover:bg-red-950/30 text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: THREE STRICTLY INDEPENDENT REGIONS */}
      <div className="flex-1 flex overflow-hidden min-h-0 min-w-0">
        {/* DESKTOP SIDEBAR WRAPPER WITH SIDE NAVIGATION TOGGLE */}
        <div className="relative shrink-0 flex h-full">
          <aside
            className={cn(
              'hidden md:flex flex-col h-full border-r border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-navy-900 text-brand-text dark:text-slate-200 transition-all duration-300 ease-in-out z-20 select-none shadow-soft-sm overflow-hidden',
              isSidebarCollapsed ? 'w-16' : 'w-60'
            )}
          >
            {/* Navigation Items List (Starts directly at the top with maximum screen utilization) */}
            <div className="flex-1 overflow-y-auto p-2 pt-2.5 space-y-1 min-h-0 custom-scrollbar">
              {menus.map((menu) => {
                const hasChildren = menu.children && menu.children.length > 0;
                const isExpanded = expandedMenus[menu.code] ?? false;
                const isParentActive =
                  location.pathname === menu.path ||
                  (hasChildren && menu.children.some((c) => location.pathname.startsWith(c.path)));

                if (hasChildren) {
                  return (
                    <div key={menu.code} className="space-y-0.5">
                      <button
                        onClick={() => toggleExpand(menu.code)}
                        onMouseEnter={(e) => handleMouseEnterItem(e, menu)}
                        onMouseLeave={handleMouseLeaveItem}
                        title={isSidebarCollapsed ? menu.title : undefined}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group relative',
                          isParentActive
                            ? 'bg-brand-primary text-white shadow-soft-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800/80',
                          isSidebarCollapsed && 'justify-center'
                        )}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="shrink-0">{renderIcon(menu.icon)}</span>
                          {!isSidebarCollapsed && <span className="truncate">{menu.title}</span>}
                        </div>

                        {!isSidebarCollapsed && (
                          <span className={cn('transition-colors', isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white')}>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </span>
                        )}
                      </button>

                      {/* Submenu Children */}
                      {isExpanded && !isSidebarCollapsed && (
                        <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-brand-border dark:border-navy-800 ml-4 animate-in fade-in duration-150">
                          {menu.children.map((child) => {
                            const isChildActive = location.pathname === child.path;
                            return (
                              <Link
                                key={child.code}
                                to={child.path}
                                className={cn(
                                  'flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                                  isChildActive
                                    ? 'bg-brand-primary/10 text-brand-primary dark:bg-white/10 dark:text-white font-bold border-l-2 border-brand-primary dark:border-blue-400 pl-2'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800/60'
                                )}
                              >
                                <span className="truncate">{child.title}</span>
                                {child.badgeText && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-brand-primary dark:bg-blue-500/20 dark:text-blue-300 font-bold">
                                    {child.badgeText}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Direct link (no submenus)
                return (
                  <Link
                    key={menu.code}
                    to={menu.path}
                    onMouseEnter={(e) => handleMouseEnterItem(e, menu)}
                    onMouseLeave={handleMouseLeaveItem}
                    title={isSidebarCollapsed ? menu.title : undefined}
                    className={cn(
                      'flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group',
                      location.pathname === menu.path
                        ? 'bg-brand-primary text-white shadow-soft-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800/80',
                      isSidebarCollapsed && 'justify-center'
                    )}
                  >
                    <span className="shrink-0">{renderIcon(menu.icon)}</span>
                    {!isSidebarCollapsed && <span className="truncate">{menu.title}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Bottom: Fixed Footprint (Never scrolls away) */}
            <div className="p-2.5 border-t border-brand-border dark:border-navy-800/60 text-brand-muted text-[10px] shrink-0 bg-brand-secondarySurface dark:bg-navy-900">
              {!isSidebarCollapsed ? (
                <div className="flex items-center justify-between">
                  <span className="font-mono">v2.6.0 &bull; Enterprise</span>
                  <span className="w-2 h-2 rounded-full bg-[#16845B]" title="System Nominal" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#16845B]" title="System Nominal" />
                </div>
              )}
            </div>
          </aside>

          {/* HOVER FLYOUT FOR COLLAPSED SIDEBAR (Submenus visible and clickable on hover) */}
          {hoveredMenu && isSidebarCollapsed && (
            <div
              style={{ top: `${hoveredMenu.top}px` }}
              onMouseEnter={handleMouseEnterFlyout}
              onMouseLeave={handleMouseLeaveFlyout}
              className="fixed left-16 z-50 w-60 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 select-none"
            >
              {/* Flyout Header */}
              <div className="pb-2 border-b border-brand-border dark:border-brand-darkBorder flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF] shrink-0">
                    {renderIcon(hoveredMenu.menu.icon)}
                  </span>
                  <span className="font-bold text-xs text-brand-text truncate">
                    {hoveredMenu.menu.title}
                  </span>
                </div>
                {hoveredMenu.menu.path && (
                  <Link
                    to={hoveredMenu.menu.path}
                    onClick={() => setHoveredMenu(null)}
                    className="text-[10px] text-brand-primary dark:text-[#8495FF] hover:underline font-semibold shrink-0 ml-1"
                  >
                    Open &rarr;
                  </Link>
                )}
              </div>

              {/* Submenus List */}
              {hoveredMenu.menu.children && hoveredMenu.menu.children.length > 0 ? (
                <div className="space-y-0.5 pt-1 max-h-72 overflow-y-auto custom-scrollbar">
                  {hoveredMenu.menu.children.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.code}
                        to={child.path}
                        onClick={() => setHoveredMenu(null)}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isChildActive
                            ? 'bg-brand-primary text-white font-bold shadow-soft-xs'
                            : 'text-brand-text hover:bg-slate-100 dark:hover:bg-brand-darkCard hover:text-brand-primary dark:hover:text-white'
                        )}
                      >
                        <span className="truncate">{child.title}</span>
                        {child.badgeText && (
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.2 rounded font-bold',
                              isChildActive
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-50 text-brand-primary dark:bg-blue-500/20 dark:text-blue-300'
                            )}
                          >
                            {child.badgeText}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-1">
                  <Link
                    to={hoveredMenu.menu.path}
                    onClick={() => setHoveredMenu(null)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-brand-darkCard text-brand-primary hover:underline"
                  >
                    <span>Go to {hoveredMenu.menu.title}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE SLIDE-OUT DRAWER */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 h-full bg-brand-surface dark:bg-navy-900 text-brand-text dark:text-slate-200 p-4 space-y-3 overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 border-r border-brand-border dark:border-navy-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-brand-border dark:border-navy-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-brand-text">HotelOS Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-brand-muted hover:text-brand-text hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 space-y-1 overflow-y-auto">
                {menus.map((menu) => (
                  <div key={menu.code} className="space-y-0.5">
                    <Link
                      to={menu.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                        location.pathname.startsWith(menu.path)
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
                      )}
                    >
                      {renderIcon(menu.icon)}
                      <span>{menu.title}</span>
                    </Link>

                    {menu.children?.map((child) => (
                      <Link
                        key={child.code}
                        to={child.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'block pl-9 py-1.5 text-xs transition-colors rounded-md',
                          location.pathname === child.path
                            ? 'text-brand-primary dark:text-white font-bold bg-brand-primary/10 dark:bg-white/10'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800/40'
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* Drawer User Footer */}
              <div className="pt-3 border-t border-brand-border dark:border-navy-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-brand-text">{user?.username}</div>
                  <div className="text-[10px] text-brand-muted">{user?.roles?.[0]}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-red-500 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN CONTENT CONTAINER (Strictly independently scrollable) */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 min-h-0 min-w-0 bg-brand-bg transition-all">
          <Outlet />
        </main>
      </div>

      {/* 4. GLOBAL COMMAND PALETTE (CTRL + K) MODAL */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="p-3.5 border-b border-brand-border dark:border-brand-darkBorder flex items-center space-x-3 bg-slate-50/70 dark:bg-brand-darkCard">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to Front Office, POS, Inventory, HR, Reports..."
                className="w-full bg-transparent text-sm text-brand-text placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shadow-soft-xs">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
              {searchableLinks.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No operations or screens found matching "{searchQuery}".
                </div>
              ) : (
                searchableLinks.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate(item.path);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-brand-darkCard text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        {renderIcon(item.icon)}
                      </span>
                      <div>
                        <div className="font-bold text-brand-text">{item.title}</div>
                        <div className="text-[10px] text-brand-muted">{item.module}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono group-hover:text-brand-primary">
                      {item.path} &rarr;
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Quick Tips Footer */}
            <div className="p-2 border-t border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkCard flex items-center justify-between text-[11px] text-slate-400">
              <span>Use arrow keys to navigate</span>
              <span>HotelOS Enterprise Navigation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
