/**
 * Centralized Z-Index Overlay Tokens
 * Enforces strict global stacking order across HotelOS:
 * 
 * - Normal content: 0–9
 * - Sticky headers/sidebar: 10–25
 * - Dropdowns & Popovers: 2000 (must escape modals when opened inside them)
 * - Modal/Dialog Backdrops: 1000
 * - Modal/Dialog/Drawer Content: 1050
 * - Confirmation Dialog Backdrop: 1100
 * - Confirmation Dialog Content: 1150
 * - Toast Notifications: 9999 (ALWAYS above all modals, dialogs & drawers)
 * - Critical System Alerts: 10000
 */
export const Z_INDEX = {
  BASE: 0,
  STICKY_HEADER: 20,
  SIDEBAR: 25,
  DROPDOWN_TRIGGER: 30,
  MODAL_BACKDROP: 1000,
  MODAL_CONTENT: 1050,
  DRAWER_BACKDROP: 1000,
  DRAWER_CONTENT: 1050,
  CONFIRM_BACKDROP: 1100,
  CONFIRM_CONTENT: 1150,
  DROPDOWN_POPUP: 2000,
  TOAST_NOTIFICATION: 9999,
  CRITICAL_ALERT: 10000,
} as const;

export type ZIndexLevel = keyof typeof Z_INDEX;
