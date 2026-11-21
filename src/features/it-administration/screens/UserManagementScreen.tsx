import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data-table/DataTable';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { StatusBadge } from '@/components/enterprise/StatusBadge';
import { RowActions, DetailDrawer, FormDrawer, FormSection } from '@/components/enterprise';
import { api } from '@/services/api';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  User as UserIcon,
  Shield,
  Layers,
  Filter
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  employeeId?: string;
  status: 'Active' | 'Inactive' | 'Locked';
  roles: string[];
  lastLoginAt?: string;
  createdAt: string;
}

interface RoleItem {
  id: number;
  name: string;
  normalizedName: string;
  description: string;
  isSystemRole: boolean;
  usersCount: number;
  permissions: string[];
}

interface PagedUsersResponse {
  items: UserItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const UserManagementScreen: React.FC = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('/it/roles') ? 'roles' : 'users';

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(initialTab);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modals & Drawers state
  const [formDrawerOpen, setFormDrawerOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    phoneNumber: '',
    employeeId: '',
    selectedRoleIds: [] as number[],
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = `?page=${page}&pageSize=10`;
      if (searchQuery.trim()) query += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (roleFilter) query += `&role=${encodeURIComponent(roleFilter)}`;

      const res = await api.request<PagedUsersResponse>(`/users${query}`);
      if (res.success && res.data) {
        setUsers(res.data.items);
        setTotalUsers(res.data.totalCount);
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to load user directory.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.request<RoleItem[]>('/roles');
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === 'Active' ? 'Locked' : 'Active';
    try {
      const res = await api.request(`/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: `User ${user.username} status updated to ${newStatus}.` });
        fetchUsers();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 6) {
      setActionMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      const res = await api.request(`/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: `Password for ${resetModalUser.username} successfully reset.` });
        setResetModalUser(null);
        setNewPassword('');
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to reset password.' });
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      phoneNumber: '',
      employeeId: '',
      selectedRoleIds: roles.length > 0 ? [roles[0].id] : [1],
    });
    setFormDrawerOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    const matchedRoleIds = roles
      .filter((r) => user.roles.includes(r.name))
      .map((r) => r.id);

    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      phoneNumber: user.phoneNumber || '',
      employeeId: user.employeeId || '',
      selectedRoleIds: matchedRoleIds.length > 0 ? matchedRoleIds : [1],
    });
    setFormDrawerOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setActionMessage(null);

    try {
      if (editingUser) {
        // Edit existing user
        const res = await api.put<UserItem>(`/users/${editingUser.id}`, {
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim() || null,
          employeeId: formData.employeeId.trim() || null,
          roleIds: formData.selectedRoleIds.length > 0 ? formData.selectedRoleIds : undefined,
        });

        if (res.success) {
          setActionMessage({ type: 'success', text: `User ${editingUser.username} updated successfully.` });
          setFormDrawerOpen(false);
          setEditingUser(null);
          fetchUsers();
        } else {
          setActionMessage({ type: 'error', text: res.message || 'Update failed.' });
        }
      } else {
        // Create new user
        if (!formData.username || !formData.email || !formData.password) {
          setActionMessage({ type: 'error', text: 'Username, email and password are required.' });
          setIsSaving(false);
          return;
        }

        const res = await api.request<UserItem>('/users', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            roleIds: formData.selectedRoleIds.length > 0 ? formData.selectedRoleIds : [1],
          }),
        });

        if (res.success) {
          setActionMessage({ type: 'success', text: `User ${formData.username} created successfully.` });
          setFormDrawerOpen(false);
          fetchUsers();
        } else {
          setActionMessage({ type: 'error', text: res.message || 'Creation failed' });
        }
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error saving user' });
    } finally {
      setIsSaving(false);
    }
  };

  const userColumns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'User & Full Name',
        cell: (info) => {
          const u = info.row.original;
          return (
            <div className="flex items-center space-x-2 truncate">
              <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF] flex items-center justify-center font-bold text-[10px] shrink-0">
                {u.firstName?.[0] || u.username[0].toUpperCase()}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {u.fullName || u.username}
              </span>
              <span className="text-[11px] font-mono text-brand-muted shrink-0">
                (@{u.username}{u.employeeId ? ` • ${u.employeeId}` : ''})
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email Address',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-text truncate block max-w-[200px]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'roles',
        header: 'Assigned Roles',
        cell: (info) => {
          const userRoles = (info.getValue() as string[]) || [];
          return (
            <div className="flex items-center gap-1 overflow-hidden">
              {userRoles.slice(0, 2).map((r) => (
                <span
                  key={r}
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-brand-primary dark:bg-indigo-950/60 dark:text-[#8495FF] border border-indigo-100 dark:border-indigo-900/40 shrink-0"
                >
                  {r}
                </span>
              ))}
              {userRoles.length > 2 && (
                <span className="text-[10px] px-1 py-0.5 text-brand-muted shrink-0">
                  +{userRoles.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <StatusBadge
              status={status === 'Active' ? 'ACTIVE' : status === 'Locked' ? 'MAINTENANCE' : 'INACTIVE'}
              label={status}
            />
          );
        },
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last Sign-In',
        cell: (info) => {
          const val = info.getValue() as string;
          return (
            <span className="font-mono text-[11px] text-brand-muted">
              {val ? new Date(val).toLocaleString() : 'Never'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <RowActions
              onView={() => setViewingUser(u)}
              onEdit={() => handleOpenEdit(u)}
              isActive={u.status === 'Active'}
              onToggleStatus={() => handleToggleStatus(u)}
              customActions={[
                {
                  label: 'Reset Password',
                  icon: <KeyRound className="w-3.5 h-3.5" />,
                  onClick: () => setResetModalUser(u),
                },
              ]}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Universal Page Header */}
      <PageHeader
        title={activeTab === 'users' ? 'User Directory & Authentication Accounts' : 'Enterprise Roles & Permissions Matrix'}
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-brand-border bg-slate-100 dark:bg-navy-950 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Users ({totalUsers})
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'roles'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Roles ({roles.length})
              </button>
            </div>

            <button
              onClick={() => {
                fetchUsers();
                fetchRoles();
              }}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 shadow-soft-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {activeTab === 'users' && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/95 text-xs font-semibold shadow-soft-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create User</span>
              </button>
            )}
          </div>
        }
      />

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-150 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TAB: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <DataTable
          data={users}
          columns={userColumns}
          totalCount={totalUsers}
          pageIndex={page - 1}
          pageSize={10}
          onPageChange={(p) => setPage(p + 1)}
          onPageSizeChange={() => {}}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          searchPlaceholder="Search by username, email or name..."
          filters={[
            {
              id: 'status',
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val || '');
                setPage(1);
              },
              placeholder: 'All Statuses',
              options: [
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active', badge: 'ACT' },
                { value: 'Locked', label: 'Locked', badge: 'LCK' },
                { value: 'Inactive', label: 'Inactive', badge: 'INA' },
              ],
            },
            {
              id: 'role',
              value: roleFilter,
              onChange: (val) => {
                setRoleFilter(val || '');
                setPage(1);
              },
              placeholder: 'All Roles',
              options: [
                { value: '', label: 'All Roles' },
                ...roles.map((r) => ({ value: r.name, label: r.name })),
              ],
            },
          ]}
          onResetFilters={() => {
            setStatusFilter('');
            setRoleFilter('');
            setSearchQuery('');
            setPage(1);
          }}
          isFiltered={!!statusFilter || !!roleFilter || !!searchQuery}
          enableExport={true}
          enableColumnVisibility={true}
          exportFileName="users_directory.csv"
          onRefresh={fetchUsers}
        />
      )}

      {/* 3. TAB: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl p-4 shadow-soft-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-brand-primary dark:text-[#8495FF]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{role.name}</h3>
                    {role.isSystemRole && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200">
                        System Core
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                  {role.usersCount} Operators
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Assigned Permissions ({role.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {role.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 border border-brand-border dark:border-brand-darkBorder"
                    >
                      {p}
                    </span>
                  ))}
                  {role.permissions.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No direct permissions assigned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL DRAWER */}
      {viewingUser && (
        <DetailDrawer
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title={viewingUser.fullName || viewingUser.username}
          status={viewingUser.status}
          width="md"
          onEdit={() => {
            const u = viewingUser;
            setViewingUser(null);
            handleOpenEdit(u);
          }}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Username</span>
                <span className="font-mono font-semibold text-brand-text">@{viewingUser.username}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Status</span>
                <span className="font-semibold text-brand-text">{viewingUser.status}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Email</span>
                <span className="font-mono text-brand-text">{viewingUser.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Phone</span>
                <span className="font-mono text-brand-text">{viewingUser.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Staff ID</span>
                <span className="font-mono text-brand-text">{viewingUser.employeeId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Account Created</span>
                <span className="font-mono text-brand-muted">{new Date(viewingUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
              <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Assigned Security Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {viewingUser.roles.map((r) => (
                  <span
                    key={r}
                    className="text-[11px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-brand-primary dark:bg-indigo-950/60 dark:text-[#8495FF] border border-indigo-100 dark:border-indigo-900/40"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* CREATE / EDIT FORM DRAWER */}
      <FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? `Edit User Profile #${editingUser.id}` : 'Create Operator User'}
        onSubmit={handleSubmitUser}
        submitText={isSaving ? 'Saving Profile...' : editingUser ? 'Update User' : 'Create User'}
        width="lg"
      >
        <FormSection title="Account Credentials" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              disabled={!!editingUser}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. john.doe"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@hotelos.internal"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
          {!editingUser && (
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          )}
        </FormSection>

        <FormSection title="Personnel Information" columns={2}>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1-555-0199"
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Staff ID / Employee Code
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="EMP-0042"
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Security Role Assignment" columns={1}>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => {
              const isChecked = formData.selectedRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className="flex items-center space-x-2 p-2 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkCard/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-brand-darkCard transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, selectedRoleIds: [...formData.selectedRoleIds, r.id] });
                      } else {
                        setFormData({ ...formData, selectedRoleIds: formData.selectedRoleIds.filter((id) => id !== r.id) });
                      }
                    }}
                    className="rounded text-brand-primary"
                  />
                  <span className="text-xs font-medium text-brand-text">{r.name}</span>
                </label>
              );
            })}
          </div>
        </FormSection>
      </FormDrawer>

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 1100, marginTop: 0 }}
          className="fixed inset-0 z-50 !mt-0 !m-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            style={{ marginTop: 0 }}
            className="w-full !mt-0 max-w-sm bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-brand-border pb-2">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Reset Password for {resetModalUser.username}
                </h3>
              </div>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-primary/95"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagementScreen;
