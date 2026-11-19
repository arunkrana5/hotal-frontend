import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/common/Button';
import { Lock, HelpCircle, ArrowLeft } from 'lucide-react';

export const AccountLockedScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { message?: string } | undefined;

  return (
    <AuthLayout title="Account Locked" subtitle="Protection against unauthorized access">
      <div className="space-y-5 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-950/60 border border-red-600/50 flex items-center justify-center text-red-400">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-200 font-medium">Security Safeguard Triggered</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {state?.message || 'Your account has been temporarily locked due to 5 consecutive unsuccessful login attempts.'}
          </p>
          <div className="text-xs text-slate-400 bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-left space-y-1">
            <div className="flex items-center text-slate-300 font-semibold mb-1">
              <HelpCircle className="w-3.5 h-3.5 mr-1 text-blue-400" /> Resolution options:
            </div>
            <div>&bull; Wait 15 minutes for automatic lockout expiration.</div>
            <div>&bull; Contact your hotel IT Department administrator.</div>
            <div>&bull; Use password recovery if you forgot your credentials.</div>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/forgot-password')}
          >
            Reset My Password
          </Button>

          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full text-xs text-slate-400 hover:text-white pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
