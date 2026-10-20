import React, { useState, useMemo } from 'react'
import {
  GraduationCap,
  Search,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Mail
} from 'lucide-react'
import type { AdminUserItem } from '../../types/admin'

interface StudentManagementProps {
  users: AdminUserItem[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onOpenCreateStudent: () => void
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>
  togglingUserId: string | null
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  users,
  isLoading,
  error,
  onRefresh,
  onOpenCreateStudent,
  onToggleStatus,
  togglingUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter students only
  const studentUsers = useMemo(() => {
    return users.filter((u) => u.role === 'STUDENT')
  }, [users])

  // Filter by search query and status
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return studentUsers.filter((u) => {
      const student = u.studentProfile
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (student?.studentId && student.studentId.toLowerCase().includes(q)) ||
        (student?.firstName && student.firstName.toLowerCase().includes(q)) ||
        (student?.lastName && student.lastName.toLowerCase().includes(q)) ||
        (student?.department && student.department.toLowerCase().includes(q)) ||
        (student?.batchYear && student.batchYear.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive)

      return matchesSearch && matchesStatus
    })
  }, [studentUsers, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            id="student-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by roll number, name, email or batch..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({studentUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
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
              className={`px-3 py-1.5 rounded-lg transition ${
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
            title="Refresh student list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            id="student-table-provision-btn"
            onClick={onOpenCreateStudent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-xs transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Student</span>
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
                <th className="py-4 px-5">Student / Roll No</th>
                <th className="py-4 px-5">Department &amp; Batch</th>
                <th className="py-4 px-5">Academic Details</th>
                <th className="py-4 px-5">Institutional Email</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-24 mb-1.5" />
                      <div className="h-3 bg-slate-100/60 rounded w-32" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-36" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-28" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-40" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-100 rounded-full w-16" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-12 px-5 text-center text-slate-600">
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-base font-semibold text-slate-900">No student accounts found</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No results match your search query "${searchQuery}". Try a different keyword.`
                        : 'No students have been provisioned in the directory yet.'}
                    </p>
                    {!searchQuery && (
                      <button
                        type="button"
                        onClick={onOpenCreateStudent}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Provision First Student</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((user) => {
                  const p = user.studentProfile
                  const isToggling = togglingUserId === user.id

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Roll Number & Name */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 tracking-wide flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                            {p?.studentId || 'UNASSIGNED'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-1 font-medium">
                          {p ? `${p.firstName} ${p.lastName}` : 'Profile Incomplete'}
                        </div>
                      </td>

                      {/* Department & Batch */}
                      <td className="py-4 px-5">
                        <div className="text-sm font-semibold text-slate-800">
                          {p?.department || 'CSE'}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          Batch: {p?.batchYear || 'N/A'}
                        </div>
                      </td>

                      {/* Academic Details */}
                      <td className="py-4 px-5">
                        <div className="text-xs text-slate-700">
                          Sem: <strong className="text-slate-900 font-semibold">{p?.semester ? `Semester ${p.semester}` : 'N/A'}</strong>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          Section: <span className="text-slate-800 font-mono font-semibold">{p?.section || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{user.email}</span>
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

export default StudentManagement
