import React, { useState, useEffect } from 'react'
import {
  School,
  BookOpen,
  Code2,
  Rocket,
  Briefcase,
  Bell,
  ArrowLeft,
  LogOut,
  Mail,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  GraduationCap,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { facultyApi, type FacultyDepartmentOverviewResponse } from '../../services/facultyApi'
import AcademicResources from '../AcademicResources'
import CodingHub from '../CodingHub'
import StudentProjects from '../StudentProjects'
import PlacementsSection from '../PlacementsSection'
import EventsSection from '../EventsSection'

interface FacultyDashboardProps {
  onExit: () => void
  onNavigateToSection: (sectionId: string) => void
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onExit,
  onNavigateToSection
}) => {
  const { user, logout } = useAuth()
  const [profileData, setProfileData] = useState<any>(user?.facultyProfile || null)
  const [userEmail, setUserEmail] = useState<string>(user?.email || '')
  const [overview, setOverview] = useState<FacultyDepartmentOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const faculty = profileData || user?.facultyProfile
  const facultyId = faculty?.facultyId || user?.identifier || 'N/A'
  const facultyName = faculty?.firstName
    ? `${faculty.firstName} ${faculty.lastName || ''}`.trim()
    : user?.displayName || 'Faculty Member'
  const departmentName = faculty?.department || user?.department || 'Computer Science and Engineering'
  const designation = faculty?.designation || 'Faculty Member'
  const specialization = faculty?.specialization || 'Computer Science & Engineering'
  const email = userEmail || user?.email || (facultyId !== 'N/A' ? `${facultyId.toLowerCase()}@gist.edu.in` : 'faculty@gist.edu.in')

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profileRes, overviewRes] = await Promise.allSettled([
        facultyApi.getProfile(),
        facultyApi.getDepartmentOverview()
      ])

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.profile) {
        setProfileData(profileRes.value.data.profile)
        if (profileRes.value.data.user?.email) {
          setUserEmail(profileRes.value.data.user.email)
        }
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data) {
        setOverview(overviewRes.value.data)
      } else if (overviewRes.status === 'rejected') {
        const err = overviewRes.reason
        setError(err?.responseData?.message || err?.message || 'Failed to load department overview.')
      }
    } catch (err: any) {
      setError(err?.responseData?.message || err?.message || 'Failed to load faculty information.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [profileRes, overviewRes] = await Promise.allSettled([
          facultyApi.getProfile(),
          facultyApi.getDepartmentOverview()
        ])

        if (isCancelled) return

        setError(null)
        if (profileRes.status === 'fulfilled' && profileRes.value.data?.profile) {
          setProfileData(profileRes.value.data.profile)
          if (profileRes.value.data.user?.email) {
            setUserEmail(profileRes.value.data.user.email)
          }
        }

        if (overviewRes.status === 'fulfilled' && overviewRes.value.data) {
          setOverview(overviewRes.value.data)
        } else if (overviewRes.status === 'rejected') {
          const err = overviewRes.reason
          setError(err?.responseData?.message || err?.message || 'Failed to load department overview.')
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.responseData?.message || err?.message || 'Failed to load faculty information.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [])

  const portalShortcuts = [
    {
      id: 'shortcut-faculty-academics',
      sectionId: 'academics',
      title: 'Curriculum & Course Repository',
      tagline: 'SYLLABUS & LAB MANUALS',
      description: 'Official university curriculum regulation schemes, semester lab experiment guides, and lecture presentation notes.',
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      buttonText: 'Open Academic Hub'
    },
    {
      id: 'shortcut-faculty-coding',
      sectionId: 'coding-hub',
      title: 'Coding Arena & Lab Practice',
      tagline: 'ALGORITHMS & CONTESTS',
      description: 'Review departmental competitive coding tracks, student practice leaderboards, and programming challenges.',
      icon: <Code2 className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      buttonText: 'Open Coding Arena'
    },
    {
      id: 'shortcut-faculty-projects',
      sectionId: 'projects',
      title: 'Student Projects & Research Mentorship',
      tagline: 'CAPSTONE & PUBLICATIONS',
      description: 'Monitor undergraduate capstone prototypes, research publications, peer repositories, and project evaluations.',
      icon: <Rocket className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
      buttonText: 'Review Projects'
    },
    {
      id: 'shortcut-faculty-placements',
      sectionId: 'placements',
      title: 'Placements & Career Training',
      tagline: 'RECRUITMENT & DRIVES',
      description: 'Tier-1 campus recruitment analytics, company placement criteria, and student technical interview preparedness.',
      icon: <Briefcase className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      buttonText: 'View Placements'
    },
    {
      id: 'shortcut-faculty-events',
      sectionId: 'events',
      title: 'Department Circulars & Notices',
      tagline: 'ANNOUNCEMENTS & SEMINARS',
      description: 'Official academic circulars, semester exam schedules, technical workshops, faculty meetings, and guest lectures.',
      icon: <Bell className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      buttonText: 'View Circulars & Events'
    }
  ]

  const handleNavigateToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    onNavigateToSection?.(sectionId)
  }

  // If a department module is active, render its complete original interface
  if (activeSection) {
    const sectionTitleMap: Record<string, { title: string; subtitle: string; tag: string }> = {
      academics: {
        title: 'Curriculum & Course Repository',
        subtitle: 'Official University Syllabi, Laboratory Experiment Manuals, Question Banks & Lecture Notes',
        tag: 'CURRICULUM ARCHIVE'
      },
      'coding-hub': {
        title: 'Coding Arena & Lab Practice',
        subtitle: 'Review Competitive Coding Tracks, Algorithmic Problem Sets & Campus Leaderboards',
        tag: 'PRACTICE ARENA'
      },
      projects: {
        title: 'Student Projects & Research Mentorship',
        subtitle: 'Undergraduate Capstone Prototypes, Peer Publications & Open Source Repositories',
        tag: 'CAPSTONE & RESEARCH'
      },
      placements: {
        title: 'Placements & Career Training',
        subtitle: 'Tier-1 Campus Recruitment Analytics, Company Placement Patterns & CRT Resources',
        tag: 'CAREER PORTAL'
      },
      events: {
        title: 'Department Circulars & Notices',
        subtitle: 'Official Academic Bulletins, Exam Schedules, Technical Workshops & Notices',
        tag: 'DEPARTMENT NOTICES'
      }
    }

    const currentMeta = sectionTitleMap[activeSection] || {
      title: 'Department Operational Hub',
      subtitle: 'Department of Computer Science & Engineering',
      tag: 'PORTAL'
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
        {/* Navigation Bar for Module View */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-17 sm:h-18 lg:h-19 flex items-center shadow-2xs">
          <div className="max-w-375 w-full mx-auto flex items-center justify-between gap-4">
            {/* Left: Return to Faculty Dashboard */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                id="back-to-faculty-dashboard-btn"
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition shadow-2xs shrink-0"
                title="Return to Faculty Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                <span>Back to Faculty Dashboard</span>
              </button>

              <div className="flex items-center gap-3 sm:ml-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs shrink-0">
                  CSE
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    <span>{currentMeta.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {currentMeta.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 hidden md:block">
                    Department of Computer Science &amp; Engineering &bull; Faculty Console
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Account Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs"
                id="faculty-module-profile-badge"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-600 font-medium">Faculty:</span>
                <span className="font-semibold text-slate-900 truncate max-w-40">{facultyName}</span>
              </div>

              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-600">
                {facultyId}
              </span>

              <button
                type="button"
                id="faculty-module-logout-btn"
                onClick={async () => {
                  await logout()
                  onExit()
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-600 transition shadow-2xs shrink-0"
                title="Sign Out of Faculty Session"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation Bar */}
        <div className="bg-white border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-375 w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="hover:text-indigo-600 transition font-medium"
              >
                Faculty Dashboard
              </button>
              <span>/</span>
              <span className="text-slate-700">Department Operational Hubs</span>
              <span>/</span>
              <span className="text-indigo-600 font-semibold">{currentMeta.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard Overview</span>
            </button>
          </div>
        </div>

        {/* Module Content Container */}
        <main className="flex-1 max-w-375 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {activeSection === 'academics' && <AcademicResources />}
          {activeSection === 'coding-hub' && <CodingHub />}
          {activeSection === 'projects' && <StudentProjects />}
          {activeSection === 'placements' && <PlacementsSection />}
          {activeSection === 'events' && <EventsSection />}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Branding & Return Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="faculty-exit-dashboard-btn"
              onClick={onExit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition group shadow-2xs"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Public Website</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <School className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span>Smart Hub</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                    FACULTY
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 hidden sm:block">
                  Department of Computer Science &amp; Engineering
                </div>
              </div>
            </div>
          </div>

          {/* Right: Faculty Badge & Sign Out */}
          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              id="faculty-profile-badge"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-slate-600 font-medium">Faculty:</span>
              <span className="font-semibold text-slate-900">{facultyName}</span>
              <span className="font-mono text-indigo-700 px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-[10.5px] font-bold">
                {facultyId}
              </span>
            </div>

            <button
              type="button"
              id="faculty-dashboard-logout-btn"
              onClick={async () => {
                await logout()
                onExit()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition shadow-2xs"
              title="Sign Out of Faculty Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instructional &amp; Academic Faculty Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, <span className="text-indigo-600">{facultyName}</span>
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Faculty ID: <strong className="text-slate-900 font-mono">{facultyId}</strong> &bull; {designation} &bull; {departmentName}
              </p>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{designation}</span>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                  Domain: {specialization}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Active Instructional Staff</span>
                </span>
              </div>
            </div>

            {/* Department Quick Stats */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-32.5 shadow-2xs">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto w-fit mb-2">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {isLoading ? '...' : overview?.enrolledStudents ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">Students Enrolled</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-32.5 shadow-2xs">
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 mx-auto w-fit mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {isLoading ? '...' : overview?.departmentFaculty ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">Colleague Faculty</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification if department overview failed */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Verified Faculty Profile Card */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Faculty Academic Credentials</h2>
                <p className="text-xs text-slate-600">Verified departmental instructional record and appointment credentials</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 font-semibold">
              ID: {user?.id.slice(0, 8)}...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Faculty ID</span>
              <span className="font-mono font-bold text-base text-indigo-700">{facultyId}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Full Name</span>
              <span className="font-semibold text-slate-900">{facultyName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Academic Designation</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>{designation}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Department</span>
              <span className="font-medium text-slate-800">{departmentName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Specialization / Domain</span>
              <span className="font-medium text-slate-800">{specialization}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Official Institutional Email</span>
              <span className="font-mono text-slate-800 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{email}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Department Platform Shortcuts Grid */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Department Operational Hubs</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Instructional management shortcuts to department courses, student arenas, and recruitment portals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portalShortcuts.map((item) => (
              <div
                key={item.id}
                id={item.id}
                onClick={() => handleNavigateToSection(item.sectionId)}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">
                      {item.tagline}
                    </span>
                    <div className={`p-2 rounded-lg border ${item.iconBg}`}>
                      {item.icon}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNavigateToSection(item.sectionId)
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-700 border border-slate-200 hover:border-indigo-600 transition group/btn"
                  >
                    <span>{item.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default FacultyDashboard
