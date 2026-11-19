import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/common/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDeniedScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { requiredPermission?: string } | undefined;

  return (
    <AuthLayout title="Access Denied" subtitle="Security authorization barrier">
      <div className="space-y-5 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-950/60 border border-rose-600/50 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-slate-200 font-medium">Insufficient Permissions</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            You do not possess the required permission or departmental role to view or interact with this resource.
          </p>
          {state?.requiredPermission && (
            <p className="text-xs font-mono text-rose-300 bg-rose-950/50 px-2.5 py-1 rounded border border-rose-800/50 mt-2">
              Required: {state.requiredPermission}
            </p>
          )}
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Main Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-slate-400"
            onClick={() => navigate('/profile')}
          >
            Review My Permissions
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};
