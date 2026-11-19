import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Card';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const VerifyTokenScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !token.trim()) {
      setError('Both email and reset token are required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyResetToken(email, token);
      if (res.success && res.data?.isValid) {
        setSuccess('Token is valid. Redirecting to password reset...');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
        }, 1200);
      } else {
        setError(res.data?.message || 'Invalid or expired token.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Verify Security Token" subtitle="Verify your one-time verification or reset code">
      <form onSubmit={handleVerify} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          label="Registered Work Email"
          type="email"
          placeholder="employee@hotelos.internal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Security Token / OTP"
          type="text"
          placeholder="Paste single-use token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isLoading}
          autoFocus
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
          <KeyRound className="w-4 h-4 mr-2" /> Validate Token
        </Button>

        <div className="text-center pt-2">
          <Link to="/login" className="inline-flex items-center text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
