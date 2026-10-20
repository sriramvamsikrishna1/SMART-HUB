import React from 'react'
import {
  Users,
  GraduationCap,
  School,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserPlus,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import type { AdminDashboardStats } from '../../types/admin'

interface DashboardOverviewProps {
  stats: AdminDashboardStats | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onOpenCreateStudent: () => void
  onOpenCreateFaculty: () => void
  onNavigateTab: (tab: 'students' | 'faculty' | 'users') => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  isLoading,
  error,
  onRefresh,
  onOpenCreateStudent,
  onOpenCreateFaculty,
  onNavigateTab
}) => {
  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load overview analytics</h3>
        <p className="text-slate-600 text-sm mb-5 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    )
  }

  const statCards = [
    {
      id: 'stat-total-users',
      label: 'Total Registered Users',
      value: stats?.totalUsers ?? 0,
      description: 'Overall active & archived directory entries',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      textColor: 'text-slate-900',
      actionTab: 'users' as const
    },
    {
      id: 'stat-students',
      label: 'Enrolled Students',
      value: stats?.totalStudents ?? 0,
      description: 'Undergraduate student portal accounts',
      icon: <GraduationCap className="w-5 h-5 text-cyan-600" />,
      iconBg: 'bg-cyan-50 border-cyan-100',
      textColor: 'text-slate-900',
      actionTab: 'students' as const
    },
    {
      id: 'stat-faculty',
      label: 'Department Faculty',
      value: stats?.totalFaculty ?? 0,
      description: 'Instructional and research professors',
      icon: <School className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      textColor: 'text-slate-900',
      actionTab: 'faculty' as const
    },
    {
      id: 'stat-admins',
      label: 'System Administrators',
      value: stats?.totalAdmins ?? 0,
      description: 'Authorized department governance keys',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
      textColor: 'text-slate-900',
      actionTab: 'users' as const
    },
    {
      id: 'stat-active-users',
      label: 'Active Accounts',
      value: stats?.activeUsers ?? 0,
      description: 'Currently enabled login access permissions',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      textColor: 'text-emerald-700',
      actionTab: 'users' as const
    },
    {
      id: 'stat-inactive-users',
      label: 'Inactive / Suspended',
      value: stats?.inactiveUsers ?? 0,
      description: 'Locked or deactivated credentials',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      textColor: 'text-rose-700',
      actionTab: 'users' as const
    }
  ]

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>GIST CSE Administrative Governance</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional User &amp; Identity Operations
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Real-time monitoring and credential management for Department students, faculty, and administrative staff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              id="admin-quick-add-student-btn"
              onClick={onOpenCreateStudent}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-xs transition active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision Student</span>
            </button>
            <button
              type="button"
              id="admin-quick-add-faculty-btn"
              onClick={onOpenCreateFaculty}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-xs transition active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision Faculty</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Dashboard Metrics"
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              aria-label="Refresh Dashboard Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className="group relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                  {card.icon}
                </div>
              </div>

              <div className="mb-2">
                {isLoading ? (
                  <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  <div className={`text-4xl font-extrabold tracking-tight ${card.textColor}`}>
                    {card.value}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
              <p className="text-xs text-slate-600 font-medium truncate max-w-50">
                {card.description}
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab(card.actionTab)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardOverview
