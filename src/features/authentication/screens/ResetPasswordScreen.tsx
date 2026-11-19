import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Card';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !token) {
      setError('Email and reset token are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        email,
        token,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        setSuccess('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Establish a secure new password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          label="Registered Work Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Security Token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste security reset token"
          disabled={isLoading}
        />

        <Input
          label="New Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Re-type new password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
          <ShieldCheck className="w-4 h-4 mr-2" /> Update Password
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
