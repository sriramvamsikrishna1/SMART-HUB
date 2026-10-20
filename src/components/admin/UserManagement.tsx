import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Mail,
  GraduationCap,
  School,
  ShieldCheck,
  Calendar
} from 'lucide-react'
import type { AdminUserItem } from '../../types/admin'
import type { UserRole } from '../../types/auth'

interface UserManagementProps {
  users: AdminUserItem[]
  currentUserId?: string
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>
  togglingUserId: string | null
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUserId,
  isLoading,
  error,
  onRefresh,
  onToggleStatus,
  togglingUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive)

      const s = u.studentProfile
      const f = u.facultyProfile
      const a = u.adminProfile

      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (s?.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s?.firstName && s.firstName.toLowerCase().includes(q)) ||
        (s?.lastName && s.lastName.toLowerCase().includes(q)) ||
        (f?.facultyId && f.facultyId.toLowerCase().includes(q)) ||
        (f?.firstName && f.firstName.toLowerCase().includes(q)) ||
        (f?.lastName && f.lastName.toLowerCase().includes(q)) ||
        (a?.adminCode && a.adminCode.toLowerCase().includes(q)) ||
        (a?.firstName && a.firstName.toLowerCase().includes(q)) ||
        (a?.lastName && a.lastName.toLowerCase().includes(q))

      return matchesRole && matchesStatus && matchesSearch
    })
  }, [users, roleFilter, statusFilter, searchQuery])

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </span>
        )
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <School className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </span>
        )
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </span>
        )
    }
  }

  const getIdentifierAndName = (u: AdminUserItem) => {
    if (u.studentProfile) {
      return {
        identifier: u.studentProfile.studentId,
        name: `${u.studentProfile.firstName} ${u.studentProfile.lastName}`,
        detail: `${u.studentProfile.department} (${u.studentProfile.batchYear})`
      }
    }
    if (u.facultyProfile) {
      return {
        identifier: u.facultyProfile.facultyId,
        name: `${u.facultyProfile.firstName} ${u.facultyProfile.lastName}`,
        detail: `${u.facultyProfile.designation} - ${u.facultyProfile.department}`
      }
    }
    if (u.adminProfile) {
      return {
        identifier: u.adminProfile.adminCode,
        name: `${u.adminProfile.firstName} ${u.adminProfile.lastName}`,
        detail: u.adminProfile.department || 'Department Administrator'
      }
    }
    return {
      identifier: 'SYSTEM-USER',
      name: u.email.split('@')[0],
      detail: 'Registered User'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            id="user-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all users, emails, IDs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                roleFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Roles ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('STUDENT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                roleFilter === 'STUDENT'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('FACULTY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                roleFilter === 'FACULTY'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-2xs"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <th className="py-4 px-5">User &amp; Identity</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Email Address</th>
                <th className="py-4 px-5">Registered Date</th>
                <th className="py-4 px-5">Account Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-28 mb-1.5" />
                      <div className="h-3 bg-slate-100/60 rounded w-36" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-100 rounded-md w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-44" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-100 rounded-full w-16" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-5 text-center text-slate-600">
                    <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-base font-semibold text-slate-800">No matching accounts</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No users found matching "${searchQuery}".`
                        : 'No accounts have been registered under this role filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const info = getIdentifierAndName(user)
                  const isSelf = user.id === currentUserId
                  const isToggling = togglingUserId === user.id

                  const formattedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Identifier & Name */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 tracking-wide flex items-center gap-2">
                          <span className="font-mono text-blue-700 text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 font-bold">
                            {info.identifier}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-800 mt-1 font-semibold">
                          {info.name}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          {info.detail}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-5">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {isSelf ? (
                          <span
                            className="text-xs text-slate-500 font-medium italic px-2 py-1"
                            title="You cannot deactivate your own administrative account"
                          >
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => onToggleStatus(user.id, user.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                              user.isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isToggling ? (
                              'Updating...'
                            ) : user.isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
