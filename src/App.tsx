import { useState, lazy, Suspense } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { LoginModal } from './components/auth/LoginModal'
import { DashboardSkeleton } from './components/ui/DashboardSkeleton'
import { GraduationCap, School, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from './context/useAuth'
import type { UserRole } from './types/auth'
import './App.css'

// Dashboard-level lazy code-splitting
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })))
const FacultyDashboard = lazy(() => import('./components/faculty/FacultyDashboard').then(m => ({ default: m.FacultyDashboard })))

export function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [viewMode, setViewModeState] = useState<'public' | 'admin-dashboard' | 'student-dashboard' | 'faculty-dashboard'>(() => {
    try {
      const saved = sessionStorage.getItem('smart_cse_hub_view_mode')
      if (saved && ['admin-dashboard', 'student-dashboard', 'faculty-dashboard'].includes(saved)) {
        return saved as any
      }
    } catch {}
    return 'public'
  })

  const setViewMode = (mode: 'public' | 'admin-dashboard' | 'student-dashboard' | 'faculty-dashboard') => {
    try {
      sessionStorage.setItem('smart_cse_hub_view_mode', mode)
    } catch {}
    setViewModeState(mode)
  }

  const [activeNotice, setActiveNotice] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false)
  const [loginModalRole, setLoginModalRole] = useState<UserRole>('STUDENT')

  const handleOpenLogin = (role: UserRole) => {
    setLoginModalRole(role)
    setIsLoginModalOpen(true)
  }

  // Handle loading skeleton during page refresh when previous view was a dashboard
  if (isLoading && viewMode !== 'public') {
    return <DashboardSkeleton title="Restoring department session..." />
  }

  // Guard against unauthorized or expired sessions trying to stay in dashboard viewMode
  if (!isLoading && viewMode !== 'public') {
    const isAuthorized =
      isAuthenticated &&
      ((viewMode === 'admin-dashboard' && user?.role === 'ADMIN') ||
       (viewMode === 'student-dashboard' && user?.role === 'STUDENT') ||
       (viewMode === 'faculty-dashboard' && user?.role === 'FACULTY'))
    if (!isAuthorized) {
      setViewMode('public')
    }
  }

  // Render Admin Dashboard full-page experience when navigated by an authenticated administrator
  if (viewMode === 'admin-dashboard' && isAuthenticated && user?.role === 'ADMIN') {
    return (
      <Suspense fallback={<DashboardSkeleton title="Loading Administrative Console" />}>
        <AdminDashboard onExit={() => setViewMode('public')} />
      </Suspense>
    )
  }

  // Render Student Dashboard full-page experience when navigated by an authenticated student
  if (viewMode === 'student-dashboard' && isAuthenticated && user?.role === 'STUDENT') {
    return (
      <Suspense fallback={<DashboardSkeleton title="Loading Student Workspace" />}>
        <StudentDashboard
          onExit={() => setViewMode('public')}
          onNavigateToSection={() => {
            // Reconnected: section navigation handled within authenticated dashboard
          }}
        />
      </Suspense>
    )
  }

  // Render Faculty Dashboard full-page experience when navigated by an authenticated faculty member
  if (viewMode === 'faculty-dashboard' && isAuthenticated && user?.role === 'FACULTY') {
    return (
      <Suspense fallback={<DashboardSkeleton title="Loading Faculty Workspace" />}>
        <FacultyDashboard
          onExit={() => setViewMode('public')}
          onNavigateToSection={() => {
            // Reconnected: section navigation handled within authenticated dashboard
          }}
        />
      </Suspense>
    )
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Header
        onOpenLogin={() => handleOpenLogin('STUDENT')}
        onOpenAdminDashboard={() => setViewMode('admin-dashboard')}
        onOpenStudentDashboard={() => setViewMode('student-dashboard')}
        onOpenFacultyDashboard={() => setViewMode('faculty-dashboard')}
      />

      {/* Main Landing Flow */}
      <main className="main-content">
        {/* Notice Banner */}
        {activeNotice && (
          <div className="portal-notice-banner" role="status">
            <span>{activeNotice}</span>
            <button
              type="button"
              className="portal-notice-close"
              onClick={() => setActiveNotice(null)}
              aria-label="Dismiss notice"
            >
              &times;
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="landing-hero" id="hero-section">
          <div className="landing-hero-badge-group">
            <span className="landing-hero-tag">SMART HUB</span>
            <span className="landing-hero-badge-divider" aria-hidden="true">&bull;</span>
            <span className="landing-hero-inst">Geethanjali Institute of Science and Technology</span>
          </div>

          <h1 className="landing-hero-headline">
            Your Department. Your Resources. One Hub.
          </h1>

          <p className="landing-hero-description">
            A centralized digital gateway for the Computer Science and Engineering department. Access your department portal securely through your designated account.
          </p>

          <div className="landing-hero-actions" aria-label="Portal Quick Actions">
            <button
              type="button"
              id="hero-student-portal-btn"
              className="hero-portal-action-btn"
              onClick={() => handleOpenLogin('STUDENT')}
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              id="hero-faculty-portal-btn"
              className="hero-portal-action-btn"
              onClick={() => handleOpenLogin('FACULTY')}
            >
              <School className="w-4 h-4 text-indigo-600" />
              <span>Faculty Portal</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              id="hero-admin-portal-btn"
              className="hero-portal-action-btn"
              onClick={() => handleOpenLogin('ADMIN')}
            >
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </section>

        {/* Portal Cards Section */}
        <section className="landing-portals-section" id="portals-section" aria-label="Department Portals">
          <div className="landing-portals-grid">
            {/* 1. Student Portal Card */}
            <div className="portal-card" id="card-student-portal">
              <div className="portal-card-header">
                <div className="portal-card-icon student" aria-hidden="true">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="portal-role-pill">Academic Services</span>
              </div>

              <div className="portal-card-body">
                <h2 className="portal-card-title">Student Portal</h2>
                <p className="portal-card-desc">
                  Access student services and academic resources.
                </p>
              </div>

              <div className="portal-card-footer">
                {isAuthenticated && user?.role === 'STUDENT' ? (
                  <div className="portal-session-actions">
                    <div className="portal-active-user">
                      <span className="portal-pulse-dot" />
                      <span>Signed in: <strong>{user.identifier}</strong></span>
                    </div>
                    <button
                      type="button"
                      id="student-dashboard-btn"
                      className="portal-action-btn primary"
                      onClick={() => setViewMode('student-dashboard')}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Access Student Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id="student-signout-btn"
                      className="portal-signout-link"
                      onClick={() => {
                        logout()
                        setActiveNotice('Successfully signed out of Student Portal.')
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="student-login-btn"
                    className="portal-action-btn primary"
                    onClick={() => handleOpenLogin('STUDENT')}
                  >
                    <span>Student Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Faculty Portal Card */}
            <div className="portal-card" id="card-faculty-portal">
              <div className="portal-card-header">
                <div className="portal-card-icon faculty" aria-hidden="true">
                  <School className="w-6 h-6" />
                </div>
                <span className="portal-role-pill">Faculty Tools</span>
              </div>

              <div className="portal-card-body">
                <h2 className="portal-card-title">Faculty Portal</h2>
                <p className="portal-card-desc">
                  Access faculty tools and department resources.
                </p>
              </div>

              <div className="portal-card-footer">
                {isAuthenticated && user?.role === 'FACULTY' ? (
                  <div className="portal-session-actions">
                    <div className="portal-active-user">
                      <span className="portal-pulse-dot" />
                      <span>Signed in: <strong>{user.identifier}</strong></span>
                    </div>
                    <button
                      type="button"
                      id="faculty-dashboard-btn"
                      className="portal-action-btn primary"
                      onClick={() => setViewMode('faculty-dashboard')}
                    >
                      <School className="w-4 h-4" />
                      <span>Access Faculty Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id="faculty-signout-btn"
                      className="portal-signout-link"
                      onClick={() => {
                        logout()
                        setActiveNotice('Successfully signed out of Faculty Portal.')
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="faculty-login-btn"
                    className="portal-action-btn primary"
                    onClick={() => handleOpenLogin('FACULTY')}
                  >
                    <span>Faculty Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Admin Portal Card */}
            <div className="portal-card" id="card-admin-portal">
              <div className="portal-card-header">
                <div className="portal-card-icon admin" aria-hidden="true">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="portal-role-pill">Administration</span>
              </div>

              <div className="portal-card-body">
                <h2 className="portal-card-title">Admin Portal</h2>
                <p className="portal-card-desc">
                  Manage department users and administration.
                </p>
              </div>

              <div className="portal-card-footer">
                {isAuthenticated && user?.role === 'ADMIN' ? (
                  <div className="portal-session-actions">
                    <div className="portal-active-user">
                      <span className="portal-pulse-dot" />
                      <span>Signed in: <strong>{user.identifier}</strong></span>
                    </div>
                    <button
                      type="button"
                      id="admin-dashboard-btn"
                      className="portal-action-btn primary"
                      onClick={() => setViewMode('admin-dashboard')}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Access Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id="admin-signout-btn"
                      className="portal-signout-link"
                      onClick={() => {
                        logout()
                        setActiveNotice('Successfully signed out of Admin Portal.')
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="admin-login-btn"
                    className="portal-action-btn primary"
                    onClick={() => handleOpenLogin('ADMIN')}
                  >
                    <span>Admin Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Academic Footer */}
      <Footer />

      {/* Reusable Accessible Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialRole={loginModalRole}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(authenticatedUser) => {
          setActiveNotice(
            `Welcome, ${authenticatedUser.displayName}! Successfully authenticated as ${authenticatedUser.role} (${authenticatedUser.identifier}).`
          )
          if (authenticatedUser.role === 'STUDENT') {
            setViewMode('student-dashboard')
          } else if (authenticatedUser.role === 'FACULTY') {
            setViewMode('faculty-dashboard')
          } else if (authenticatedUser.role === 'ADMIN') {
            setViewMode('admin-dashboard')
          }
        }}
      />
    </div>
  )
}

export default App
