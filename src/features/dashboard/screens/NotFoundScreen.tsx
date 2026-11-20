import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileQuestion, ArrowLeft, BookOpen, LayoutDashboard } from 'lucide-react';

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      <PageHeader
        title="Page Not Found"
        actions={
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/95 text-xs font-semibold shadow-soft-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        }
      />

      <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-soft-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF] flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Unrecognized Application Route
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The path <code className="font-mono text-brand-primary bg-slate-100 dark:bg-navy-900 px-1.5 py-0.5 rounded text-[11px]">{location.pathname}</code> does not match any registered screen.
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            ✓ Your authentication session is active and secure.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-brand-border bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-soft-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/manual')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-brand-border bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-soft-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
            <span>Open User Manual</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default NotFoundScreen;
