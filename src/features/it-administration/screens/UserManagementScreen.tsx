import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListToolbar } from '@/components/enterprise/ListToolbar';
import { UniversalSelect } from '@/components/common/UniversalSelect';
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

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setActionMessage({ type: 'error', text: 'Username, email and password are required.' });
      return;
    }
    try {
      const res = await api.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          roleIds: formData.selectedRoleIds.length > 0 ? formData.selectedRoleIds : [1],
        }),
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: `User ${formData.username} created successfully.` });
        setCreateModalOpen(false);
        setFormData({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          phoneNumber: '',
          employeeId: '',
          selectedRoleIds: [],
        });
        fetchUsers();
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Creation failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error creating user' });
    }
  };

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
                onClick={() => setCreateModalOpen(true)}
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
        <div className="space-y-3">
          {/* Universal List Toolbar */}
          <ListToolbar
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
          />

          {/* Users DataTable */}
          <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl overflow-hidden shadow-soft-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-navy-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">User &amp; Full Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Assigned Roles</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Sign-In</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary dark:text-[#8495FF] flex items-center justify-center font-bold text-xs shrink-0">
                            {u.firstName?.[0] || u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <span>{u.username}</span>
                              {u.employeeId && (
                                <span className="text-[10px] text-slate-400 font-normal">({u.employeeId})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 text-brand-primary dark:bg-indigo-950/60 dark:text-[#8495FF] border border-indigo-100 dark:border-indigo-900/40"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : u.status === 'Locked'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'Active' ? 'bg-emerald-500' : u.status === 'Locked' ? 'bg-red-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setResetModalUser(u)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-brand-primary transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded transition-colors ${
                              u.status === 'Active'
                                ? 'hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600'
                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-600'
                            }`}
                            title={u.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                          >
                            {u.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand-border dark:border-brand-darkBorder pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Operator User</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. john.doe"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@hotelos.internal"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-slate-50 dark:bg-navy-950"
                />
              </div>

              <div>
                <UniversalSelect
                  label="Assign Primary Role"
                  size="sm"
                  value={formData.selectedRoleIds[0] || ''}
                  onChange={(val) => {
                    const id = Number(val);
                    if (id) setFormData({ ...formData, selectedRoleIds: [id] });
                  }}
                  options={roles.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                  placeholder="Select Primary Role..."
                  clearable={false}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-border dark:border-brand-darkBorder">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-slate-600 hover:bg-slate-50 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-primary/95 shadow-soft-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
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
