import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserSession } from '@/types/auth';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Monitor, Smartphone, Globe, ShieldAlert, ArrowLeft, Trash2 } from 'lucide-react';

export const ActiveSessionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.getSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    try {
      const res = await authService.revokeSession(sessionId);
      if (res.success) {
        setSuccess('Session revoked successfully.');
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session.');
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Are you sure you want to revoke all active sessions across all devices?')) {
      return;
    }

    try {
      const res = await authService.revokeAllSessions();
      if (res.success) {
        setSuccess('All sessions revoked. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke all sessions.');
    }
  };

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Security', href: '/profile' },
          { label: 'Active Sessions' },
        ]}
        title="Active Security Sessions"
        subtitle="Manage devices and browsers currently authenticated to your HotelOS account"
        actions={
          <PageActions>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRevokeAll}
              disabled={isLoading || sessions.length <= 1}
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            >
              Revoke All Sessions
            </Button>
          </PageActions>
        }
      />

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.sessionId} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                {session.userAgent.toLowerCase().includes('mobile') ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    IP: {session.ipAddress}
                  </span>
                  {session.isCurrent && (
                    <Badge variant="success">Current Device</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-md">
                  {session.userAgent}
                </p>
                <p className="text-[11px] text-slate-400">
                  Signed in: {new Date(session.createdAt).toLocaleString()} &bull; Expires: {new Date(session.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                onClick={() => handleRevoke(session.sessionId)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Revoke
              </Button>
            </div>
          </Card>
        ))}

        {sessions.length === 0 && !isLoading && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No active sessions found.
          </div>
        )}
      </div>
    </PageContainer>
  );
};
