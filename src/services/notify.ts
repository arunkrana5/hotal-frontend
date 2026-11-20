import React from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  WifiOff,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export interface NotifyOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
  id?: string | number;
}

// In-memory deduplication cache
const recentToasts = new Map<string, number>();
const DEDUPE_INTERVAL_MS = 1500;

function shouldDedupe(key: string): boolean {
  const now = Date.now();
  const lastTime = recentToasts.get(key);
  if (lastTime && now - lastTime < DEDUPE_INTERVAL_MS) {
    return true;
  }
  recentToasts.set(key, now);
  // Cleanup old entries
  if (recentToasts.size > 50) {
    for (const [k, v] of recentToasts.entries()) {
      if (now - v > DEDUPE_INTERVAL_MS * 2) {
        recentToasts.delete(k);
      }
    }
  }
  return false;
}

// Format error safely (never expose raw SQL, stack traces, or internal server tokens)
export function sanitizeErrorMessage(rawError: unknown): string {
  if (!rawError) return 'An unexpected error occurred. Please try again.';

  if (typeof rawError === 'string') {
    if (
      rawError.includes('Npgsql') ||
      rawError.includes('Postgres') ||
      rawError.includes('SQL') ||
      rawError.includes('Exception') ||
      rawError.includes('Stack trace')
    ) {
      return 'The database encountered an error executing this request. Please contact IT support.';
    }
    return rawError;
  }

  if (typeof rawError === 'object') {
    const errObj = rawError as any;
    if (errObj.message && typeof errObj.message === 'string') {
      return sanitizeErrorMessage(errObj.message);
    }
    if (errObj.title && typeof errObj.title === 'string') {
      return errObj.title;
    }
  }

  return 'Operation could not be completed. Please verify inputs and retry.';
}

export const notify = {
  success(message: string, options?: NotifyOptions | string) {
    const description = typeof options === 'string' ? options : options?.description;
    const opts = typeof options === 'object' ? options : {};
    const key = `success:${message}:${description || ''}`;
    if (shouldDedupe(key)) return;

    return toast.success(message, {
      description,
      duration: opts.duration ?? 4000,
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-[#16845B] dark:text-[#45C79A] shrink-0' }),
      action: opts.action,
      cancel: opts.cancel,
      id: opts.id,
    });
  },

  error(message: string, options?: NotifyOptions | string | unknown) {
    let description: string | undefined;
    let opts: NotifyOptions = {};

    if (typeof options === 'string') {
      description = options;
    } else if (options && typeof options === 'object' && ('description' in options || 'duration' in options)) {
      opts = options as NotifyOptions;
      description = opts.description;
    } else if (options) {
      description = sanitizeErrorMessage(options);
    }

    const key = `error:${message}:${description || ''}`;
    if (shouldDedupe(key)) return;

    return toast.error(message, {
      description,
      duration: opts.duration ?? 5500,
      icon: React.createElement(AlertCircle, { className: 'w-4 h-4 text-[#D44848] dark:text-[#F07878] shrink-0' }),
      action: opts.action,
      cancel: opts.cancel,
      id: opts.id,
    });
  },

  warning(message: string, options?: NotifyOptions | string) {
    const description = typeof options === 'string' ? options : options?.description;
    const opts = typeof options === 'object' ? options : {};
    const key = `warning:${message}:${description || ''}`;
    if (shouldDedupe(key)) return;

    return toast.warning(message, {
      description,
      duration: opts.duration ?? 4500,
      icon: React.createElement(AlertTriangle, { className: 'w-4 h-4 text-[#C78B24] dark:text-[#FBBF24] shrink-0' }),
      action: opts.action,
      cancel: opts.cancel,
      id: opts.id,
    });
  },

  info(message: string, options?: NotifyOptions | string) {
    const description = typeof options === 'string' ? options : options?.description;
    const opts = typeof options === 'object' ? options : {};
    const key = `info:${message}:${description || ''}`;
    if (shouldDedupe(key)) return;

    return toast.info(message, {
      description,
      duration: opts.duration ?? 4000,
      icon: React.createElement(Info, { className: 'w-4 h-4 text-[#354FC7] dark:text-[#8495FF] shrink-0' }),
      action: opts.action,
      cancel: opts.cancel,
      id: opts.id,
    });
  },

  loading(message: string, options?: NotifyOptions | string) {
    const description = typeof options === 'string' ? options : options?.description;
    const opts = typeof options === 'object' ? options : {};

    return toast.loading(message, {
      description,
      icon: React.createElement(Loader2, { className: 'w-4 h-4 text-[#354FC7] animate-spin shrink-0' }),
      duration: opts.duration ?? 10000,
      id: opts.id,
    });
  },

  promise<T>(
    promise: Promise<T>,
    data: {
      loading: string;
      success: string | ((result: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) {
    return toast.promise(promise, {
      loading: data.loading,
      success: (result: T) => {
        return typeof data.success === 'function' ? data.success(result) : data.success;
      },
      error: (err: unknown) => {
        if (typeof data.error === 'function') {
          return data.error(err);
        }
        return `${data.error}: ${sanitizeErrorMessage(err)}`;
      },
    });
  },

  networkError(retryFn?: () => void) {
    const key = 'network:offline';
    if (shouldDedupe(key)) return;

    return toast.error('Network Connectivity Error', {
      description: 'Unable to connect to HotelOS API. Please check your internet connection.',
      icon: React.createElement(WifiOff, { className: 'w-4 h-4 text-[#D44848] shrink-0' }),
      duration: 6000,
      action: retryFn
        ? {
            label: 'Retry',
            onClick: retryFn,
          }
        : undefined,
    });
  },

  sessionExpired(onReLogin?: () => void) {
    const key = 'auth:expired';
    if (shouldDedupe(key)) return;

    return toast.warning('Session Expired', {
      description: 'Your security token has expired. Please sign in again to continue.',
      icon: React.createElement(Clock, { className: 'w-4 h-4 text-[#C78B24] shrink-0' }),
      duration: 7000,
      action: onReLogin
        ? {
            label: 'Sign In',
            onClick: onReLogin,
          }
        : undefined,
    });
  },

  permissionDenied(actionName?: string) {
    const key = `auth:forbidden:${actionName || ''}`;
    if (shouldDedupe(key)) return;

    return toast.error('Access Restricted', {
      description: actionName
        ? `You do not have the required permissions to ${actionName}.`
        : 'You do not have permission to execute this operation.',
      icon: React.createElement(ShieldAlert, { className: 'w-4 h-4 text-[#D44848] shrink-0' }),
      duration: 5000,
    });
  },

  dismiss(toastId?: string | number) {
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};
