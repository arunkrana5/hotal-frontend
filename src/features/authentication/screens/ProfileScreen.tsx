import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { User, Shield, KeyRound, Monitor, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/types/auth';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authUser);
  const [, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await authService.getProfile();
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Security', href: '/profile' },
          { label: 'User Profile' },
        ]}
        title={`${profile?.firstName || 'User'} ${profile?.lastName || 'Account'}`}
        subtitle={`@${profile?.username || 'user'} • ${profile?.email || 'authenticated'} • Role: ${profile?.roles?.join(', ') || 'Staff'}`}
        actions={
          <PageActions>
            <Button variant="outline" size="sm" onClick={() => navigate('/change-password')} icon={<KeyRound className="w-3.5 h-3.5" />}>
              Change Password
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/sessions')} icon={<Monitor className="w-3.5 h-3.5" />}>
              Sessions
            </Button>
            <Button variant="danger" size="sm" onClick={logout} icon={<LogOut className="w-3.5 h-3.5" />}>
              Logout
            </Button>
          </PageActions>
        }
      />

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Account Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center mb-4">
              <User className="w-4 h-4 mr-2 text-blue-600" /> Account Identity
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Account Status</span>
                <Badge variant={profile?.status === 'Active' ? 'success' : 'danger'}>
                  {profile?.status}
                </Badge>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Employee ID</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile?.employeeId || 'N/A (System)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile?.phoneNumber || 'Not configured'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Default Property Scope</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Property #{profile?.defaultPropertyId || 1}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Security Public ID</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                  {profile?.publicId}
                </span>
              </div>
            </div>
          </Card>

          {/* Granular Permissions */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Authorized Permissions
              </h2>
              <span className="text-xs text-slate-400">{profile?.permissions?.length || 0} granted</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
              {profile?.permissions?.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-800"
                >
                  {perm}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Roles & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center mb-3">
              <Shield className="w-4 h-4 mr-2 text-blue-600" /> Assigned Roles
            </h2>
            <div className="space-y-2">
              {profile?.roles?.map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs"
                >
                  <span className="font-semibold text-blue-900 dark:text-blue-300">{role}</span>
                  <Badge variant="info">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Security Compliance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              All logins, password changes, and sensitive administrative operations are recorded in the central audit ledger.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/sessions')}
            >
              Inspect Active Sessions
            </Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
