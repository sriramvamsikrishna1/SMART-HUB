import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  Sparkles,
  Users,
  Star,
  GitBranch,
  Code2,
  Send,
  Boxes,
  Cpu,
  Layers,
  Info,
  Lock,
  ExternalLink,
  X,
  Copy,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  FileCode
} from 'lucide-react'
import { studentProjectsData, type StudentProject } from '../data/departmentData'
import { useAuth } from '../context/useAuth'
import { cn } from '../lib/utils'

interface ProjectCardProps {
  project: StudentProject
  stars: number
  hasVoted: boolean
  shouldReduceMotion: boolean | null
  onUpvote: (id: string, defaultStars: number) => void
  onRepoAction: (project: StudentProject) => void
}

interface RepoMeta {
  isPublic: boolean
  url: string | null
  badgeLabel: string
  buttonLabel: string
  badgeClass: string
  buttonClass: string
}

const getRepoMeta = (project: StudentProject): RepoMeta => {
  const publicUrl = project.githubUrl || project.repoUrl || null
  const isValidUrl = Boolean(publicUrl && typeof publicUrl === 'string' && /^https?:\/\//i.test(publicUrl))

  if (isValidUrl) {
    return {
      isPublic: true,
      url: publicUrl,
      badgeLabel: 'Public GitHub',
      buttonLabel: 'View on GitHub',
      badgeClass: 'repo-badge-public',
      buttonClass: 'btn-repo-public',
    }
  }

  return {
    isPublic: false,
    url: null,
    badgeLabel: 'Internal Department Archive',
    buttonLabel: 'Internal Access Details',
    badgeClass: 'repo-badge-internal',
    buttonClass: 'btn-repo-internal',
  }
}

const CategoryBadgeIcon: React.FC<{ category: string }> = ({ category }) => {
  if (category.toLowerCase().includes('vision') || category.toLowerCase().includes('learning')) {
    return <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
  }
  if (category.toLowerCase().includes('web3') || category.toLowerCase().includes('blockchain')) {
    return <Boxes className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
  }
  return <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stars,
  hasVoted,
  shouldReduceMotion,
  onUpvote,
  onRepoAction,
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    })
    setIsHovered(true)
  }

  const handlePointerLeave = () => {
    setIsHovered(false)
  }

  const repoMeta = getRepoMeta(project)

  return (
    <motion.div
      layout={shouldReduceMotion ? false : 'position'}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('project-card', project.featured && 'project-card-featured')}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Pointer-Following Light */}
      <div
        className="project-card-spotlight"
        style={{
          opacity: isHovered ? 1 : 0,
          background: isHovered
            ? `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.06), rgba(59, 130, 246, 0.02), transparent 70%)`
            : 'none',
        }}
        aria-hidden="true"
      />

      {/* Hairline Top Light */}
      <div
        className={cn(
          'project-card-light',
          project.featured && 'project-card-light-featured'
        )}
        aria-hidden="true"
      />

      {/* Header: Category Badge + Status/Featured + Upvote Button */}
      <div className="project-card-top">
        <div className="project-category-badge">
          <CategoryBadgeIcon category={project.category} />
          <span>{project.category}</span>
        </div>

        <div className="project-top-right">
          {project.isStudentSubmission && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Student Submission
            </span>
          )}

          {project.featured && !project.isStudentSubmission && (
            <span className="project-featured-tag">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Featured</span>
            </span>
          )}

          <button
            type="button"
            className={cn('project-star-btn', hasVoted && 'project-star-btn-active')}
            onClick={() => onUpvote(project.id, project.stars)}
            aria-label={`Star project ${project.title}`}
            aria-pressed={hasVoted}
          >
            <Star
              className={cn(
                'w-3.5 h-3.5',
                hasVoted ? 'fill-amber-400 text-amber-400' : 'text-amber-400'
              )}
              aria-hidden="true"
            />
            <span>{stars}</span>
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="project-card-title">{project.title}</h3>
      <p className="project-card-desc">{project.description}</p>

      {/* Team Members */}
      <div className="project-team-row">
        <div className="team-label-group">
          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <span className="team-label">Team:</span>
        </div>
        <div className="team-names-wrap">
          {project.team.map((name, i) => (
            <span key={i} className="team-member-pill">{name}</span>
          ))}
        </div>
      </div>

      {/* Technology Stack Badges */}
      <div className="project-tech-tags" aria-label="Technology Stack">
        {project.techStack.map((tech, idx) => (
          <span key={idx} className="tech-pill">
            <Code2 className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{tech}</span>
          </span>
        ))}
      </div>

      {/* Card Footer: Clear Repository Status & Access Action */}
      <div className="project-actions-row">
        <div className="project-footer-actions">
          <div
            className={cn('repo-status-indicator', repoMeta.badgeClass)}
            title={
              repoMeta.isPublic
                ? 'Public open-source repository available on GitHub'
                : 'Hosted on GIST CSE internal network. External public mirror is not published.'
            }
          >
            {repoMeta.isPublic ? (
              <span className="repo-status-dot-public" aria-hidden="true" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            )}
            <span>{repoMeta.badgeLabel}</span>
          </div>

          {repoMeta.isPublic && repoMeta.url ? (
            <a
              href={repoMeta.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('btn-project-action', repoMeta.buttonClass)}
              aria-label={`Open public GitHub repository for ${project.title}`}
            >
              <span>{repoMeta.buttonLabel}</span>
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className={cn('btn-project-action', repoMeta.buttonClass)}
              onClick={() => onRepoAction(project)}
              aria-label={`View internal repository access details for ${project.title}`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{repoMeta.buttonLabel}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface StudentProjectsProps {
  onOpenLogin?: () => void
}

export const StudentProjects: React.FC<StudentProjectsProps> = ({ onOpenLogin }) => {
  const { user, isAuthenticated } = useAuth()
  const [projectVotes, setProjectVotes] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('gist_project_votes')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const [activeRepoProject, setActiveRepoProject] = useState<StudentProject | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false)
  const [isAuthWarningOpen, setIsAuthWarningOpen] = useState<boolean>(false)
  const [copiedClone, setCopiedClone] = useState<boolean>(false)

  // Custom submitted projects (persisted in localStorage)
  const [customProjects, setCustomProjects] = useState<StudentProject[]>(() => {
    try {
      const stored = localStorage.getItem('gist_custom_projects')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Submission Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Computer Vision & Deep Learning',
    team: '',
    techStack: '',
    description: '',
    repoUrl: ''
  })
  const [formError, setFormError] = useState<string | null>(null)

  const shouldReduceMotion = useReducedMotion()

  // Close modals on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveRepoProject(null)
        setIsSubmitModalOpen(false)
        setIsAuthWarningOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUpvote = (projectId: string, defaultStars: number) => {
    setProjectVotes((prev) => {
      const updated = {
        ...prev,
        [projectId]: (prev[projectId] ?? defaultStars) + 1
      }
      try {
        localStorage.setItem('gist_project_votes', JSON.stringify(updated))
      } catch {
        // Fallback
      }
      return updated
    })
  }

  const handleRepoAction = (project: StudentProject) => {
    setActiveRepoProject(project)
  }

  const handleOpenSubmit = () => {
    if (!isAuthenticated) {
      setIsAuthWarningOpen(true)
      return
    }
    if (user && !formData.team) {
      setFormData((prev) => ({
        ...prev,
        team: user.displayName || user.identifier
      }))
    }
    setIsSubmitModalOpen(true)
  }

  const handleCopyClone = async (cloneCmd: string) => {
    try {
      await navigator.clipboard.writeText(cloneCmd)
      setCopiedClone(true)
      setTimeout(() => setCopiedClone(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError('Please enter a project title.')
      return
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setFormError('Please provide a project description / abstract of at least 20 characters.')
      return
    }

    const teamList = formData.team
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const techList = formData.techStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const newProject: StudentProject = {
      id: `custom-proj-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      team: teamList.length > 0 ? teamList : [user?.displayName || 'Student Scholar'],
      description: formData.description.trim(),
      techStack: techList.length > 0 ? techList : ['TypeScript', 'Node.js', 'React'],
      featured: false,
      stars: 1,
      isStudentSubmission: true,
      status: 'Under Department Evaluation',
      repoUrl: formData.repoUrl.trim() || undefined
    }

    const updated = [newProject, ...customProjects]
    setCustomProjects(updated)
    try {
      localStorage.setItem('gist_custom_projects', JSON.stringify(updated))
    } catch {
      // Fallback
    }

    setIsSubmitModalOpen(false)
    setFormData({
      title: '',
      category: 'Computer Vision & Deep Learning',
      team: '',
      techStack: '',
      description: '',
      repoUrl: ''
    })
    setNoticeMessage(
      `Project Proposal Submitted: "${newProject.title}" has been registered in the Department Capstone Registry.`
    )
    setTimeout(() => setNoticeMessage(null), 7000)
  }

  const filterTabs = [
    { key: 'all', label: 'All Projects', icon: Layers },
    { key: 'Computer Vision & Deep Learning', label: 'AI & Vision', icon: Sparkles },
    { key: 'Web3 & Blockchain', label: 'Web3 & Blockchain', icon: Boxes },
    { key: 'Embedded Systems & Cloud', label: 'IoT & Cloud', icon: Cpu },
  ] as const

  const allProjects = [...customProjects, ...studentProjectsData]

  const filteredProjects = selectedCategory === 'all'
    ? allProjects
    : allProjects.filter((p) => p.category === selectedCategory)

  return (
    <section className="department-section" id="projects">
      {/* Header Block */}
      <div className="section-header-block">
        <div className="section-tag-pill">STUDENT INNOVATIONS</div>
        <h2 className="section-main-heading">
          Featured Student <span className="text-gradient">Projects &amp; R&amp;D</span>
        </h2>
        <p className="section-lead-text">
          Inspiring capstones, open-source repositories, and research prototypes engineered by B.Tech CSE scholars at GIST.
        </p>
      </div>

      {/* Filter Tabs Bar */}
      <div className="filter-tabs-bar" role="tablist" aria-label="Project categories">
        {filterTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = selectedCategory === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn('filter-tab-btn', isActive && 'active-tab')}
              onClick={() => setSelectedCategory(tab.key)}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Notification Banner */}
      <AnimatePresence>
        {noticeMessage && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="portal-notice-banner"
            role="status"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{noticeMessage}</span>
            </div>
            <button
              type="button"
              className="portal-notice-close"
              onClick={() => setNoticeMessage(null)}
              aria-label="Dismiss notice"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      <div className="projects-grid">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => {
            const stars = projectVotes[project.id] ?? project.stars
            const hasVoted = Boolean(projectVotes[project.id])

            return (
              <ProjectCard
                key={project.id}
                project={project}
                stars={stars}
                hasVoted={hasVoted}
                shouldReduceMotion={shouldReduceMotion}
                onUpvote={handleUpvote}
                onRepoAction={handleRepoAction}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Project Submission Banner */}
      <div className="submit-project-banner">
        <div className="submit-banner-content">
          <div className="submit-banner-badge">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>ANNUAL INNOVATION GRANT 2024–25</span>
          </div>
          <h4>Building an innovative engineering project?</h4>
          <p>
            Submit your semester capstone or research prototype to be featured on the Smart Hub and evaluated for the Annual Department Innovation Grant.
          </p>
        </div>
        <button
          type="button"
          className="btn-submit-project"
          onClick={handleOpenSubmit}
        >
          <span>Submit Project Proposal</span>
          <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </button>
      </div>

      {/* Modal 1: Internal Repository Access Details Modal */}
      <AnimatePresence>
        {activeRepoProject && (
          <div className="login-modal-overlay" onClick={() => setActiveRepoProject(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="repo-modal-title"
              className="login-modal-card max-w-xl!"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="login-modal-header border-b border-slate-200 pb-3">
                <div className="login-modal-title-group">
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Campus Network GitLab
                  </span>
                  <h3 id="repo-modal-title" className="text-lg font-bold text-slate-900 mt-1">
                    {activeRepoProject.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Internal Capstone Archive &bull; Domain: {activeRepoProject.category}
                  </p>
                </div>
                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setActiveRepoProject(null)}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold">
                    <Lock className="w-4 h-4 text-blue-700" />
                    <span>Campus Network Security Policy</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    This capstone project repository is hosted on the GIST CSE Internal GitLab cluster (<code>dept-gitlab.gist.edu.in</code>). Access is restricted to on-campus lab IP ranges, campus Wi-Fi, or authorized student VPN credentials.
                  </p>
                </div>

                <div>
                  <span className="text-slate-700 font-semibold block mb-1.5">Internal Repository Clone Command:</span>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                    <span className="truncate mr-2">
                      git clone git@dept-gitlab.gist.edu.in:cse-capstones/{activeRepoProject.id}.git
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyClone(
                          `git clone git@dept-gitlab.gist.edu.in:cse-capstones/${activeRepoProject.id}.git`
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedClone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-semibold">Project Documentation Roster:</strong>
                  <ul className="space-y-1 text-slate-600 pl-4 list-disc">
                    <li>Project Synopsis &amp; Problem Statement Specification</li>
                    <li>System Architecture &amp; Hardware Circuit Diagrams</li>
                    <li>Benchmark Test Results &amp; Code Coverage Reports</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveRepoProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200 transition"
                >
                  Close Access Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Auth Gate Modal (If not logged in) */}
      <AnimatePresence>
        {isAuthWarningOpen && (
          <div className="login-modal-overlay" onClick={() => setIsAuthWarningOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              className="login-modal-card max-w-md! text-center"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student or Faculty Authentication Required</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Project proposals can only be submitted by verified undergraduate scholars or faculty mentors. Please sign in with your institutional credentials to submit your capstone proposal.
              </p>

              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setIsAuthWarningOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthWarningOpen(false)
                    if (onOpenLogin) onOpenLogin()
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Continue</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Submit Project Proposal Modal (Protected for Authenticated Users) */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="login-modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-project-modal-title"
              className="login-modal-card max-w-xl! max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="login-modal-header border-b border-slate-200 pb-3">
                <div className="login-modal-title-group">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Authorized Submitter
                    </span>
                    <span className="text-xs text-slate-600">
                      {user?.displayName} ({user?.identifier})
                    </span>
                  </div>
                  <h3 id="submit-project-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                    Submit Capstone &amp; R&amp;D Proposal
                  </h3>
                  <p className="text-xs text-slate-600">
                    Proposals will be reviewed by the Department Project Evaluation Committee.
                  </p>
                </div>
                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setIsSubmitModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProposal} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Project Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Autonomous Edge AI Drone for Agricultural Telemetry"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Domain / Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Computer Vision & Deep Learning">Computer Vision &amp; Deep Learning</option>
                      <option value="Web3 & Blockchain">Web3 &amp; Blockchain</option>
                      <option value="Embedded Systems & Cloud">Embedded Systems &amp; Cloud</option>
                      <option value="Cyber Security & Networks">Cyber Security &amp; Networks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Team Members (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      placeholder="e.g., P. Sai Krishna, K. Meghana"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tech Stack (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="e.g., PyTorch, FastAPI, OpenCV, React"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Abstract &amp; System Overview <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe the engineering problem, solution architecture, and expected outcomes..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Repository Link (Optional)</label>
                  <input
                    type="url"
                    value={formData.repoUrl}
                    onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                    placeholder="https://github.com/... or campus gitlab link"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow flex items-center gap-1.5"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Submit Proposal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default StudentProjects
