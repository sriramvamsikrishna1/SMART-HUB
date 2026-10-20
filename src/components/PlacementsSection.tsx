import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Briefcase,
  TrendingUp,
  Award,
  BookOpen,
  Info,
  CheckCircle2,
  Code2,
  X,
  Target,
  CheckSquare,
  Square,
  RotateCcw
} from 'lucide-react'
import { placementStats, topRecruiters, type Recruiter } from '../data/departmentData'
import { cn } from '../lib/utils'

interface PrepTopic {
  title: string
  category: string
  description: string
  topics: string[]
}

const interviewPrepTopics: PrepTopic[] = [
  {
    title: 'Data Structures & Algorithms',
    category: 'Core Technical',
    description: 'Foundational algorithmic concepts tested in tier-1 tech coding assessments.',
    topics: ['Arrays & HashMaps', 'Trees & Binary Search', 'Dynamic Programming', 'Graph BFS/DFS']
  },
  {
    title: 'Systems & Database Engineering',
    category: 'Core Computer Science',
    description: 'Essential computer science fundamentals required in technical interview rounds.',
    topics: ['Relational Schema & SQL', 'Indexing & Transactions', 'Concurrency & Locks', 'Process & Threads']
  },
  {
    title: 'Resume & Portfolio Review',
    category: 'Career Readiness',
    description: 'Guidelines for crafting ATS-compliant developer resumes and project portfolios.',
    topics: ['Clear Impact Metrics', 'Public Code Samples', 'Clean 1-Page Layout', 'Technical Accuracy']
  }
]

export const PlacementsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recruiters' | 'prep'>('recruiters')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null)
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false)

  // Interview Prep Checklist state (persisted in localStorage)
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('gist_placement_prep_checklist')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDriveModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRecruiterClick = (recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter)
    setIsDriveModalOpen(true)
  }

  const toggleTopic = (topicName: string) => {
    setCompletedTopics((prev) => {
      const updated = {
        ...prev,
        [topicName]: !prev[topicName]
      }
      try {
        localStorage.setItem('gist_placement_prep_checklist', JSON.stringify(updated))
      } catch {
        // Fallback
      }
      return updated
    })
  }

  const handleResetChecklist = () => {
    setCompletedTopics({})
    try {
      localStorage.removeItem('gist_placement_prep_checklist')
    } catch {
      // Fallback
    }
  }

  // Calculate total topics and progress
  const allTopicItems = interviewPrepTopics.flatMap((t) => t.topics)
  const totalTopicsCount = allTopicItems.length
  const completedCount = allTopicItems.filter((item) => completedTopics[item]).length
  const progressPercent = Math.round((completedCount / totalTopicsCount) * 100)

  // Filter recruiters by Tier
  const tierFilters = [
    { key: 'all', label: 'All Partners' },
    { key: 'Tier 1 MNC', label: 'Tier 1 MNC' },
    { key: 'Product Co.', label: 'Product Co.' },
    { key: 'Global Tech', label: 'Global Tech' },
    { key: 'Consulting Tech', label: 'Consulting Tech' }
  ]

  const filteredRecruiters = selectedTier === 'all'
    ? topRecruiters
    : topRecruiters.filter((r) => r.tier === selectedTier)

  return (
    <section className="department-section" id="placements">
      <div className="section-header-block">
        <div className="section-tag-pill">CAREER LAUNCHPAD</div>
        <h2 className="section-main-heading">
          Placements, Internships &amp; <span className="text-gradient">Industry Partners</span>
        </h2>
        <p className="section-lead-text">
          Structured training in algorithmic problem-solving, systems engineering, and soft skills prepares CSE students for high-impact software careers.
        </p>
      </div>

      {/* Highlights Ribbon with Audit Notice */}
      <div className="placement-metrics-grid">
        <div className="placement-stat-card">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span className="stat-value text-gradient">{placementStats.highestPackage}</span>
          </div>
          <span className="stat-label">Highest Package Offered *</span>
        </div>

        <div className="placement-stat-card">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span className="stat-value">{placementStats.averagePackage}</span>
          </div>
          <span className="stat-label">Average Department Package *</span>
        </div>

        <div className="placement-stat-card">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="stat-value">{placementStats.placementRate}</span>
          </div>
          <span className="stat-label">Placement Track Record *</span>
        </div>

        <div className="placement-stat-card">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Briefcase className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="stat-value">{placementStats.totalOffers}</span>
          </div>
          <span className="stat-label">Total Offers Received *</span>
        </div>
      </div>

      {/* Audit Footnote */}
      <div className="text-xs text-slate-600 -mt-3 flex items-center gap-1.5 px-2">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
        <span>
          * Departmental recruitment highlights reflect provisional placement cell milestones. Official data verified annually by GIST Training &amp; Placement Cell.
        </span>
      </div>

      {/* Interactive Tabs for Section Navigation */}
      <div className="filter-tabs-bar" role="tablist" aria-label="Placement View Selection">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recruiters'}
          className={cn('filter-tab-btn', activeTab === 'recruiters' && 'active-tab')}
          onClick={() => setActiveTab('recruiters')}
        >
          <Briefcase className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Major Recruiting Partners</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'prep'}
          className={cn('filter-tab-btn', activeTab === 'prep' && 'active-tab')}
          onClick={() => setActiveTab('prep')}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Interview Preparation Modules</span>
        </button>
      </div>

      {/* Conditional Content: Recruiters vs Prep */}
      {activeTab === 'recruiters' ? (
        <div className="recruiters-panel space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="recruiters-panel-title mb-0!">Top Recruiting Organizations</h3>
              <span className="text-xs text-slate-600">Click any partner card to view drive eligibility and hiring rounds</span>
            </div>

            {/* Recruiter Tier Sub-filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tierFilters.map((tf) => (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => setSelectedTier(tf.key)}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-lg transition font-medium',
                    selectedTier === tf.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="recruiters-grid">
            {filteredRecruiters.map((recruiter, idx) => {
              const isSelected = selectedRecruiter?.name === recruiter.name
              return (
                <button
                  key={idx}
                  type="button"
                  className={cn(
                    'recruiter-badge-card text-left cursor-pointer transition-all hover:border-blue-500/50 hover:-translate-y-0.5',
                    isSelected && 'border-blue-600 bg-blue-50/50'
                  )}
                  onClick={() => handleRecruiterClick(recruiter)}
                  aria-label={`View drive specifications for ${recruiter.name}`}
                >
                  <div className="recruiter-top">
                    <span className="recruiter-name">{recruiter.name}</span>
                    <span className="recruiter-tier">{recruiter.tier}</span>
                  </div>
                  <div className="recruiter-details">
                    <span className="recruiter-pkg">{recruiter.packageOffered}</span>
                    <span className="recruiter-role">{recruiter.role}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="recruiters-panel space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="recruiters-panel-title mb-0!">Technical Interview &amp; Career Preparation</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Track your syllabus mastery across core algorithms, database systems, and resume standards.
              </p>
            </div>

            {/* Live Progress Bar */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
              <div className="w-28 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-blue-600 to-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="font-semibold text-slate-800">
                {completedCount}/{totalTopicsCount} Mastered ({progressPercent}%)
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  title="Reset checklist"
                  className="text-slate-500 hover:text-rose-600 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {interviewPrepTopics.map((topic, idx) => (
              <div key={idx} className="recruiter-badge-card p-5! flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {topic.category}
                  </span>
                  <Code2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{topic.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{topic.description}</p>
                <div className="mt-auto pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Interactive Checklist:
                  </span>
                  <div className="space-y-1.5">
                    {topic.topics.map((item, i) => {
                      const isDone = Boolean(completedTopics[item])
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleTopic(item)}
                          className={cn(
                            'w-full flex items-center justify-between p-2 rounded-lg text-xs transition text-left',
                            isDone
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          )}
                        >
                          <span className={cn(isDone && 'line-through text-emerald-800')}>{item}</span>
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recruiter Details Modal */}
      <AnimatePresence>
        {isDriveModalOpen && selectedRecruiter && (
          <div className="login-modal-overlay" onClick={() => setIsDriveModalOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="recruiter-modal-title"
              className="login-modal-card max-w-xl! max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal Header */}
              <div className="login-modal-header border-b border-slate-200 pb-3">
                <div className="login-modal-title-group">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedRecruiter.tier}
                    </span>
                    <span className="text-xs text-slate-600">&bull; {selectedRecruiter.role}</span>
                  </div>
                  <h3 id="recruiter-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                    {selectedRecruiter.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700">
                    Package Offered: {selectedRecruiter.packageOffered}
                  </p>
                </div>
                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setIsDriveModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Eligibility Section */}
              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <strong className="text-blue-900 flex items-center gap-1.5 font-semibold">
                    <Target className="w-3.5 h-3.5 text-blue-700" />
                    <span>Academic Eligibility Criteria:</span>
                  </strong>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedRecruiter.eligibility || 'B.Tech CSE with minimum 60% aggregate. No active standing backlogs.'}
                  </p>
                </div>

                {/* Selection Process Workflow */}
                <div>
                  <strong className="text-slate-900 block mb-2 font-semibold">Campus Recruitment Process:</strong>
                  <div className="space-y-1.5">
                    {(selectedRecruiter.rounds || [
                      'Online Aptitude & Programming Assessment',
                      'Technical Interview I (Data Structures & Core CS)',
                      'HR & Behavioral Interview'
                    ]).map((round, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                      >
                        <span className="font-mono text-blue-700 text-[11px] font-bold mt-0.5 shrink-0">
                          0{rIdx + 1}
                        </span>
                        <span className="text-slate-800 font-medium">{round}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Focus Areas */}
                {selectedRecruiter.focusAreas && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">Recommended Preparation Focus Areas:</strong>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedRecruiter.focusAreas.map((area, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-600 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    Official campus drive dates, registration links, and slot allocations are published via the GIST Training &amp; Placement Cell portal.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200 transition"
                >
                  Close Specifications
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Training Roadmap */}
      <div className="crt-roadmap-card">
        <div className="crt-header">
          <span className="crt-pill">TRAINING ECOSYSTEM</span>
          <h4 className="crt-title">Campus Recruitment Training (CRT) Framework</h4>
        </div>
        <div className="crt-steps-grid">
          <div className="crt-step">
            <span className="step-num">01</span>
            <strong>Foundation Phase</strong>
            <p>Quantitative aptitude, logical reasoning, and verbal communication mastery.</p>
          </div>
          <div className="crt-step">
            <span className="step-num">02</span>
            <strong>Technical DSA Phase</strong>
            <p>Hands-on Data Structures in C++ / Java / Python, SQL querying, and system design.</p>
          </div>
          <div className="crt-step">
            <span className="step-num">03</span>
            <strong>Company-Specific Sprints</strong>
            <p>Coding test simulations, technical assessment patterns, and alumni mock interviews.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlacementsSection
