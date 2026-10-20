import React from 'react'
import { LogIn, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/useAuth'

interface HeaderProps {
  stageText?: string
  onOpenLogin?: () => void
  onOpenAdminDashboard?: () => void
  onOpenStudentDashboard?: () => void
  onOpenFacultyDashboard?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenAdminDashboard,
  onOpenStudentDashboard,
  onOpenFacultyDashboard
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  return (
    <header className="landing-header" id="main-header">
      <div className="landing-header-container">
        {/* Left Section: GIST CSE branding, Smart Hub title, Subtitle */}
        <div className="header-left-brand">
          <div className="header-gist-badge" aria-label="GIST CSE">
            GIST CSE
          </div>
          <div className="header-brand-divider" aria-hidden="true" />
          <div className="header-text-group">
            <span className="header-main-title">Smart Hub</span>
            <span className="header-subtitle">Computer Science and Engineering</span>
          </div>
        </div>

        {/* Right Section: Login button or Active Session controls */}
        <div className="header-right-actions">
          {!isLoading && (
            isAuthenticated && user ? (
              <div className="header-auth-group">
                <div
                  className="header-user-badge"
                  id="header-user-badge"
                  title={`${user.displayName} (${user.identifier})`}
                >
                  <span className={`header-role-tag ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                  <span className="header-user-name">
                    {user.displayName}
                  </span>
                </div>

                {user.role === 'ADMIN' && onOpenAdminDashboard && (
                  <button
                    type="button"
                    id="header-admin-dashboard-btn"
                    className="header-dashboard-btn admin"
                    onClick={onOpenAdminDashboard}
                    aria-label="Open Admin Dashboard"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                )}

                {user.role === 'STUDENT' && onOpenStudentDashboard && (
                  <button
                    type="button"
                    id="header-student-dashboard-btn"
                    className="header-dashboard-btn student"
                    onClick={onOpenStudentDashboard}
                    aria-label="Open Student Dashboard"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                )}

                {user.role === 'FACULTY' && onOpenFacultyDashboard && (
                  <button
                    type="button"
                    id="header-faculty-dashboard-btn"
                    className="header-dashboard-btn faculty"
                    onClick={onOpenFacultyDashboard}
                    aria-label="Open Faculty Dashboard"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                )}

                <button
                  type="button"
                  id="header-signout-btn"
                  className="header-signout-btn"
                  onClick={() => logout()}
                  aria-label="Sign out of active session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="header-signin-btn"
                className="header-login-btn"
                onClick={onOpenLogin}
                aria-label="Open Portal Login"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
