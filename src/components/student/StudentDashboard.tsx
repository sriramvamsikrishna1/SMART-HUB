import React, { useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  LogOut,
  GraduationCap,
  BookOpen,
  Calendar,
  Check,
  User,
  Contact2,
  Building2,
  Mail,
  Layers,
  Code2,
  Users,
  Briefcase,
  Megaphone,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import AcademicResources from '../AcademicResources'
import CodingHub from '../CodingHub'
import StudentProjects from '../StudentProjects'
import PlacementsSection from '../PlacementsSection'
import EventsSection from '../EventsSection'

interface StudentDashboardProps {
  onExit: () => void
  onNavigateToSection: (sectionId: string) => void
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onExit,
  onNavigateToSection
}) => {
  const { user, logout } = useAuth()
  const student = user?.studentProfile
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const rollNumber = student?.studentId || user?.identifier || '242UA05397'
  const studentName = user?.displayName || 'Sriram Vamsikrishna'
  const departmentName = student?.department || user?.department || 'Computer Science and Engineering'
  const batchYear = student?.batchYear || '2022–2026'
  const semester = student?.semester ? `Semester ${student.semester}` : 'Semester 5'
  const section = student?.section ? `Section ${student.section}` : 'Section A'
  const email = user?.email || `${rollNumber.toLowerCase()}@gist.edu.in`

  // Highlight first name in electric blue matching the screenshot
  const nameParts = studentName.trim().split(/\s+/)
  const firstName = nameParts[0] || 'Student'
  const lastName = nameParts.slice(1).join(' ')

  const portalShortcuts = [
    {
      id: 'shortcut-academics',
      sectionId: 'academics',
      title: 'Academic Resources',
      tagline: 'CURRICULUM & LABS',
      description: 'Official university syllabi, laboratory experiment manuals, previous question banks, and lecture slides.',
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      buttonText: 'Open Academic Hub'
    },
    {
      id: 'shortcut-coding',
      sectionId: 'coding-hub',
      title: 'Coding Arena & Challenges',
      tagline: 'PRACTICE & CONTESTS',
      description: 'Competitive coding tracks, algorithmic problem sets, campus leaderboards, and hackathon registrations.',
      icon: <Code2 className="w-6 h-6 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
      buttonText: 'Open Coding Arena'
    },
    {
      id: 'shortcut-projects',
      sectionId: 'projects',
      title: 'Student Projects & R&D',
      tagline: 'INNOVATION & PAPERS',
      description: 'Department capstone projects, peer research papers, open-source repositories, and hardware prototypes.',
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      buttonText: 'Explore Projects'
    },
    {
      id: 'shortcut-placements',
      sectionId: 'placements',
      title: 'Placements & Internships',
      tagline: 'CAREER OPPORTUNITIES',
      description: 'Tier-1 campus recruitment drives, company eligibility details, internship opportunities, and career resources.',
      icon: <Briefcase className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      buttonText: 'View Opportunities'
    },
    {
      id: 'shortcut-events',
      sectionId: 'events',
      title: 'Department Circulars & Events',
      tagline: 'OFFICIAL NOTICES',
      description: 'Academic calendars, examination timetables, department notices, workshops, student symposiums, and upcoming events.',
      icon: <Megaphone className="w-6 h-6 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
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
        title: 'Academic Resources Hub',
        subtitle: 'Official University Syllabi, Laboratory Experiment Manuals, Question Banks & Lecture Notes',
        tag: 'CURRICULUM ARCHIVE'
      },
      'coding-hub': {
        title: 'Coding Arena & Challenges',
        subtitle: 'Competitive Coding Tracks, Algorithmic Problem Sets & Campus Leaderboards',
        tag: 'PRACTICE ARENA'
      },
      projects: {
        title: 'Student Projects & R&D',
        subtitle: 'Department Capstone Prototypes, Peer Publications & Open Source Repositories',
        tag: 'INNOVATION & PAPERS'
      },
      placements: {
        title: 'Placements & Career Training',
        subtitle: 'Tier-1 Recruitment Drives, Company Selection Patterns & CRT Resources',
        tag: 'CAREER PORTAL'
      },
      events: {
        title: 'Department Circulars & Events',
        subtitle: 'Official Academic Bulletins, Exam Schedules, Technical Symposiums & Notices',
        tag: 'DEPARTMENT NOTICES'
      }
    }

    const currentMeta = sectionTitleMap[activeSection] || {
      title: 'Department Hub',
      subtitle: 'Department of Computer Science & Engineering',
      tag: 'PORTAL'
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
        {/* Navigation Bar for Module View */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-17 sm:h-18 lg:h-19 flex items-center shadow-2xs">
          <div className="max-w-375 w-full mx-auto flex items-center justify-between gap-4">
            {/* Left: Return to Student Dashboard */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                id="back-to-student-dashboard-btn"
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs shrink-0"
                title="Return to Student Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Back to Student Dashboard</span>
              </button>

              <div className="flex items-center gap-3 sm:ml-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs shrink-0">
                  CSE
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    <span>{currentMeta.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {currentMeta.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 hidden md:block">
                    Department of Computer Science &amp; Engineering &bull; GIST
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Account Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 font-medium">Student:</span>
                <span className="font-semibold text-slate-900 truncate max-w-40">{studentName}</span>
              </div>

              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-600">
                {rollNumber}
              </span>

              <button
                type="button"
                id="student-module-logout-btn"
                onClick={async () => {
                  await logout()
                  onExit()
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-600 transition shadow-2xs shrink-0"
                title="Sign Out of Student Session"
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
                className="hover:text-blue-600 transition font-medium"
              >
                Student Dashboard
              </button>
              <span>/</span>
              <span className="text-slate-700">Department Resource Hubs</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">{currentMeta.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition"
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

  // Default Overview: The Complete Approved Student Dashboard
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header (approx. 68–76px high) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-17 sm:h-18 lg:h-19 flex items-center shadow-2xs">
        <div className="max-w-375 w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Branding & Return Button */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              id="student-exit-dashboard-btn"
              onClick={onExit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs shrink-0"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Public Website</span>
              <span className="sm:hidden">Back</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            </button>

            <div className="flex items-center gap-3 sm:ml-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs shrink-0">
                CSE
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 tracking-tight leading-none">
                  Smart Hub
                </div>
                <div className="text-xs text-slate-600 mt-1 hidden md:block">
                  Department of Computer Science &amp; Engineering
                </div>
              </div>
            </div>
          </div>

          {/* Right: Account Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs"
              id="student-profile-badge"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 font-medium">Student:</span>
              <span className="font-semibold text-slate-900 truncate max-w-40">{studentName}</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-600">
              {rollNumber}
            </span>

            <button
              type="button"
              id="student-dashboard-logout-btn"
              onClick={async () => {
                await logout()
                onExit()
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-600 transition shadow-2xs shrink-0"
              title="Sign Out of Student Session"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-375 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 lg:space-y-8">
        {/* Welcome Hero Banner (220–250px tall on desktop, 28–32px padding) */}
        <div className="relative overflow-hidden p-6 sm:p-7 lg:p-8 rounded-2xl bg-linear-to-r from-[#edf5ff] via-[#f4f9ff] to-[#e4f1fe] border border-blue-100 shadow-xs flex flex-col justify-center">
          {/* Subtle decorative concentric curves */}
          <svg
            className="absolute right-0 top-0 bottom-0 h-full w-auto pointer-events-none opacity-40 hidden sm:block"
            viewBox="0 0 500 240"
            fill="none"
            preserveAspectRatio="none"
          >
            <circle cx="440" cy="120" r="140" stroke="#bfdbfe" strokeWidth="35" strokeOpacity="0.4" />
            <circle cx="440" cy="120" r="230" stroke="#dbeafe" strokeWidth="50" strokeOpacity="0.5" />
            <circle cx="440" cy="120" r="320" stroke="#e0f2fe" strokeWidth="60" strokeOpacity="0.3" />
          </svg>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
            <div className="max-w-3xl flex-1 min-w-0">
              {/* Top Portal Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  <GraduationCap className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Undergraduate Academic Portal</span>
              </div>

              {/* Responsive Heading with First Name Highlighted (40–46px on desktop) */}
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 leading-snug lg:leading-tight">
                Welcome back,{' '}
                <span className="inline-block whitespace-nowrap">
                  <span className="text-blue-600 font-bold">{firstName}</span>
                  {lastName ? ` ${lastName}` : ''}
                </span>
              </h1>

              {/* Subtitle with Roll Number and Department */}
              <p className="text-sm text-slate-600 mt-2.5 flex items-center gap-2 flex-wrap leading-relaxed">
                <span>Roll Number: <strong className="font-bold text-slate-900 font-mono">{rollNumber}</strong></span>
                <span className="text-slate-400 font-bold">&bull;</span>
                <span className="text-slate-700 font-medium">{departmentName}</span>
              </p>

              {/* Metadata Badges Row (separated by 10–12px) */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4.5 sm:mt-5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-medium text-slate-700 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>{semester}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-medium text-slate-700 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>{section}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-medium text-slate-700 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Batch {batchYear}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Active Student Account</span>
                </span>
              </div>
            </div>

            {/* Authentication Status Card (Right Aligned, won't overlap heading) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-5 py-4 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto lg:self-center">
              <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Authentication Status
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">
                  Verified GIST Identity
                </span>
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white stroke-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Identity Record (24px padding, 20px spacing to grid) */}
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3.5 mb-5 sm:mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
              <Contact2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Academic Identity Record</h2>
              <p className="text-xs text-slate-500 mt-0.5">Official student registry data synced with institutional database</p>
            </div>
          </div>

          {/* 7 Fields: 4 columns in row 1, 3 in row 2 (Email spans 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-sm">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <Contact2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Roll Number</span>
                <span className="font-mono font-bold text-sm text-slate-900 break-words block leading-snug">{rollNumber}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Student Full Name</span>
                <span className="font-semibold text-sm text-slate-900 break-words block leading-snug">{studentName}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Department</span>
                <span className="font-semibold text-sm text-slate-900 break-words block leading-snug">{departmentName}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Batch &amp; Year</span>
                <span className="font-semibold text-sm text-slate-900 break-words block leading-snug">{batchYear}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Academic Semester</span>
                <span className="font-semibold text-sm text-slate-900 break-words block leading-snug">{semester}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Section Assigned</span>
                <span className="font-mono font-semibold text-sm text-slate-900 break-words block leading-snug">{section}</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 col-span-1 sm:col-span-2 lg:col-span-2 flex items-center gap-3.5 min-h-18">
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Institutional Email</span>
                <span className="font-mono font-semibold text-sm text-slate-900 break-all block leading-snug">{email}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Department Resource Hubs (3 equal-width columns on wide desktop, natural 2nd row) */}
        <section className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Department Resource Hubs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quick access to your department tools and resources</p>
            </div>
          </div>

          {/* 3 equal-width columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {portalShortcuts.map((item) => (
              <div
                key={item.id}
                id={item.id}
                onClick={() => handleNavigateToSection(item.sectionId)}
                className="group cursor-pointer p-5.5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex items-start gap-4 sm:gap-4.5 h-full"
              >
                <div className={`p-3 rounded-xl border ${item.iconBg} shrink-0 mt-0.5`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1.5">
                      {item.tagline}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight leading-snug mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-1 sm:pt-2 flex items-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                      <span>{item.buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard
