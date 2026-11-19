import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Card';
import { UserCheck, ArrowLeft } from 'lucide-react';

export const FirstLoginScreen: React.FC = () => {
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
      setError('Email and invitation token are required.');
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
      const res = await authService.firstLoginSetup({
        email,
        token,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        setSuccess('Employee account activated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete first login setup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Employee Onboarding" subtitle="Set your official password to activate your HotelOS employee account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          label="Assigned Work Email"
          type="email"
          placeholder="employee@hotelos.internal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Onboarding Security Token"
          type="text"
          placeholder="Enter single-use invitation token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Establish New Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
          <UserCheck className="w-4 h-4 mr-2" /> Activate Account
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
