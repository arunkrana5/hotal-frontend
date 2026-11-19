import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Card';
import { Eye, EyeOff, Lock, KeyRound } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim()) {
      setError('Username or email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(usernameOrEmail, password, rememberMe);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
        if (res.message.toLowerCase().includes('locked')) {
          navigate('/account-locked', { state: { message: res.message } });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setUsernameOrEmail('admin');
    setPassword('Admin@HotelOS2026!');
  };

  return (
    <AuthLayout
      title="Hotel Executive Sign In"
      subtitle="Authenticate using your enterprise operator or administrative credentials"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="relative">
          <Input
            label="Username or Enterprise Email"
            type="text"
            placeholder="e.g. admin or operator@hotelos.internal"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <div className="relative">
            <Input
              label="Secret Passphrase"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-200 transition"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Remember session for 30 days</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/50 py-2.5 text-sm font-semibold"
          isLoading={isLoading}
          icon={<Lock className="w-4 h-4" />}
        >
          Sign In to HotelOS
        </Button>

        {/* Quick Fill Admin for convenient demo / dev */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <KeyRound className="w-3 h-3" />
            <span>Fill Admin Demo Creds</span>
          </button>
          <Link to="/first-login" className="text-slate-400 hover:text-slate-200 hover:underline">
            First time onboarding?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
