import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/common/Button';
import { Clock, LogIn } from 'lucide-react';

export const SessionExpiredScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout title="Session Expired" subtitle="Your security authorization has ended">
      <div className="space-y-5 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-slate-200 font-medium">Authentication Timeout</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your active session token has expired or was revoked by security policy. For data protection, please sign in again with your credentials.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          <LogIn className="w-4 h-4 mr-2" /> Return to Sign In
        </Button>
      </div>
    </AuthLayout>
  );
};
