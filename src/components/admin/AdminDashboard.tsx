import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  School,
  Users,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Menu
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { adminApi } from '../../services/adminApi'
import type { AdminDashboardStats, AdminUserItem } from '../../types/admin'
import { DashboardOverview } from './DashboardOverview'
import { StudentManagement } from './StudentManagement'
import { FacultyManagement } from './FacultyManagement'
import { UserManagement } from './UserManagement'
import { CreateStudentModal } from './CreateStudentModal'
import { CreateFacultyModal } from './CreateFacultyModal'

interface AdminDashboardProps {
  onExit: () => void
}

type DashboardTab = 'overview' | 'students' | 'faculty' | 'users'

const TAB_CONFIG: Record<DashboardTab, { label: string; icon: React.FC<{ className?: string }> }> = {
  overview: { label: 'Overview & Analytics', icon: LayoutDashboard },
  students: { label: 'Student Management', icon: GraduationCap },
  faculty: { label: 'Faculty Management', icon: School },
  users: { label: 'Master User Control', icon: Users }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  // Keyboard shortcut: close sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false)
  const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false)

  // Clear notification after 6 seconds
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      setNotification(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [notification])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers({ limit: 100 })
      ])

      if (statsRes.data) {
        setStats(statsRes.data)
      }
      if (usersRes.data?.users) {
        setUsers(usersRes.data.users)
      }
    } catch (err: any) {
      setError(err?.responseData?.message || err?.message || 'Failed to load administrative data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      adminApi.getStats(),
      adminApi.listUsers({ limit: 100 })
    ])
      .then(([statsRes, usersRes]) => {
        if (isCancelled) return
        if (statsRes.data) {
          setStats(statsRes.data)
        }
        if (usersRes.data?.users) {
          setUsers(usersRes.data.users)
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          setError(err?.responseData?.message || err?.message || 'Failed to load administrative data.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setTogglingUserId(userId)
    const newStatus = !currentStatus
    try {
      const res = await adminApi.toggleUserStatus(userId, newStatus)
      if (res.data?.user) {
        // Update user in local list
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: res.data!.user.isActive } : u))
        )
        // Refresh overview stats
        adminApi.getStats().then((s) => {
          if (s.data) setStats(s.data)
        })
        setNotification({
          type: 'success',
          message: `User status successfully updated to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`
        })
      } else {
        setNotification({
          type: 'error',
          message: res.message || 'Failed to update user status.'
        })
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.responseData?.message || err?.message || 'Network error updating user status.'
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const handleStudentCreated = (newUser: AdminUserItem) => {
    setUsers((prev) => [newUser, ...prev])
    adminApi.getStats().then((s) => {
      if (s.data) setStats(s.data)
    })
    setNotification({
      type: 'success',
      message: `Student account created for ${newUser.studentProfile?.firstName} (${newUser.studentProfile?.studentId || newUser.email}).`
    })
  }

  const handleFacultyCreated = (newUser: AdminUserItem) => {
    setUsers((prev) => [newUser, ...prev])
    adminApi.getStats().then((s) => {
      if (s.data) setStats(s.data)
    })
    setNotification({
      type: 'success',
      message: `Faculty account created for ${newUser.facultyProfile?.firstName} (${newUser.facultyProfile?.facultyId || newUser.email}).`
    })
  }

  const navItem = (tab: DashboardTab, id: string) => {
    const { label, icon: Icon } = TAB_CONFIG[tab]
    const isActive = activeTab === tab
    let countBadge = null
    if (tab === 'students' && stats) countBadge = stats.totalStudents
    if (tab === 'faculty' && stats) countBadge = stats.totalFaculty
    if (tab === 'users' && stats) countBadge = stats.totalUsers

    return (
      <button
        key={tab}
        type="button"
        id={id}
        onClick={() => {
          setActiveTab(tab)
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarOpen(false)
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
          isActive
            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
          <span>{label}</span>
        </div>
        {countBadge !== null && (
          <span className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded font-bold ${
            isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {countBadge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          id="admin-sidebar-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity motion-reduce:transition-none"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Collapsible SaaS Sidebar */}
      <aside
        id="admin-dashboard-sidebar"
        aria-label="Admin Navigation Sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out motion-reduce:transition-none shadow-lg lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span>Smart Hub</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                    ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">Department Console</div>
              </div>
            </div>

            <button
              type="button"
              id="admin-sidebar-close-btn"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Navigation
            </div>
            {navItem('overview', 'admin-tab-overview')}
            {navItem('students', 'admin-tab-students')}
            {navItem('faculty', 'admin-tab-faculty')}
            {navItem('users', 'admin-tab-users')}
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            id="admin-exit-dashboard-btn"
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition group shadow-2xs"
            title="Return to Public Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Public Website</span>
          </button>

          <button
            type="button"
            id="admin-dashboard-logout-btn"
            onClick={async () => {
              await logout()
              onExit()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition shadow-2xs"
            title="Sign Out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out motion-reduce:transition-none ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        {/* Sticky SaaS Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="admin-sidebar-toggle-btn"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
              aria-expanded={isSidebarOpen}
              aria-controls="admin-dashboard-sidebar"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span>Console</span>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{TAB_CONFIG[activeTab].label}</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight hidden sm:block">
                {TAB_CONFIG[activeTab].label}
              </h1>
            </div>
          </div>

          {/* Topbar Right: Identity & Quick Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 font-medium">Signed in:</span>
              <span className="font-semibold text-slate-900">{user?.displayName || user?.identifier}</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[10px] uppercase border border-purple-200">
                {user?.role}
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout()
                onExit()
              }}
              className="lg:hidden p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content Panes */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs transition ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="p-1 rounded text-slate-500 hover:text-slate-800"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'overview' && (
            <DashboardOverview
              stats={stats}
              isLoading={isLoading}
              error={error}
              onRefresh={loadData}
              onOpenCreateStudent={() => setIsCreateStudentOpen(true)}
              onOpenCreateFaculty={() => setIsCreateFacultyOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              users={users}
              isLoading={isLoading}
              error={error}
              onRefresh={loadData}
              onOpenCreateStudent={() => setIsCreateStudentOpen(true)}
              onToggleStatus={handleToggleStatus}
              togglingUserId={togglingUserId}
            />
          )}

          {activeTab === 'faculty' && (
            <FacultyManagement
              users={users}
              isLoading={isLoading}
              error={error}
              onRefresh={loadData}
              onOpenCreateFaculty={() => setIsCreateFacultyOpen(true)}
              onToggleStatus={handleToggleStatus}
              togglingUserId={togglingUserId}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement
              users={users}
              currentUserId={user?.id}
              isLoading={isLoading}
              error={error}
              onRefresh={loadData}
              onToggleStatus={handleToggleStatus}
              togglingUserId={togglingUserId}
            />
          )}
        </main>
      </div>

      {/* Provision Student Modal */}
      <CreateStudentModal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        onSuccess={handleStudentCreated}
      />

      {/* Provision Faculty Modal */}
      <CreateFacultyModal
        isOpen={isCreateFacultyOpen}
        onClose={() => setIsCreateFacultyOpen(false)}
        onSuccess={handleFacultyCreated}
      />
    </div>
  )
}

export default AdminDashboard
