import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Card, Alert } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader } from '@/components/layout';
import { Key, Shield } from 'lucide-react';

export const ChangePasswordScreen: React.FC = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        setSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[
          { label: 'Security', href: '/profile' },
          { label: 'Change Password' },
        ]}
        title="Change Account Password"
        subtitle="Update your login password following the enterprise security policy"
      />

      <div className="max-w-xl mx-auto">
        <Card className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
              placeholder="Re-enter new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={isLoading}
            />

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading} icon={<Shield className="w-4 h-4" />}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
