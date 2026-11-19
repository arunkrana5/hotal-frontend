import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Recover access to your account via security token">
      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Reset Link Dispatched</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            If <span className="font-semibold text-white">{email}</span> matches an active employee record, a secure password reset token has been dispatched.
          </p>

          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              className="w-full text-xs"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
            >
              Enter Reset Token Now
            </Button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full text-xs text-slate-400 hover:text-white pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error" message={error} />}

          <Input
            label="Registered Work Email"
            type="email"
            placeholder="e.g. employee@hotelos.internal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoFocus
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Send Security Reset Token
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
