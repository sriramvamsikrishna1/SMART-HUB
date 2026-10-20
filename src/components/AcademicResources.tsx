import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  BookOpen,
  FlaskConical,
  FolderArchive,
  FileText,
  Calendar,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  Search,
  X,
  BookMarked,
  FileDown
} from 'lucide-react'
import { academicResourcesData, type AcademicResource } from '../data/departmentData'
import { cn } from '../lib/utils'

interface CategoryMeta {
  icon: typeof BookOpen
  tagLabel: string
  featured: boolean
}

const getCategoryMeta = (category: AcademicResource['category']): CategoryMeta => {
  switch (category) {
    case 'syllabus':
      return {
        icon: BookOpen,
        tagLabel: 'Official Curriculum',
        featured: true,
      }
    case 'labs':
      return {
        icon: FlaskConical,
        tagLabel: 'Lab Manual',
        featured: false,
      }
    case 'papers':
      return {
        icon: FolderArchive,
        tagLabel: 'Exam Archive',
        featured: false,
      }
    case 'notes':
      return {
        icon: FileText,
        tagLabel: 'Lecture Notes',
        featured: false,
      }
  }
}

interface BentoCardProps {
  resource: AcademicResource
  spanClass: string
  downloadCountDisplay: string
  shouldReduceMotion: boolean | null
  onOpenViewer: (item: AcademicResource) => void
}

const BentoCard: React.FC<BentoCardProps> = ({
  resource,
  spanClass,
  downloadCountDisplay,
  shouldReduceMotion,
  onOpenViewer,
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

  const meta = getCategoryMeta(resource.category)
  const CategoryIcon = meta.icon

  return (
    <motion.div
      layout={shouldReduceMotion ? false : 'position'}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('bento-card cursor-pointer group', spanClass)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={() => onOpenViewer(resource)}
    >
      {/* Pointer-Following Light */}
      <div
        className="bento-card-spotlight"
        style={{
          opacity: isHovered ? 1 : 0,
          background: isHovered
            ? `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.08), rgba(59, 130, 246, 0.03), transparent 70%)`
            : 'none',
        }}
        aria-hidden="true"
      />

      {/* Hairline Top Light */}
      <div className="bento-card-light" aria-hidden="true" />

      {/* Card Header: Category Badge + Course Code */}
      <div className="bento-card-top">
        <div className="bento-icon-badge">
          <CategoryIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span>{resource.badge || meta.tagLabel}</span>
        </div>
        <span className="bento-code-tag">{resource.code}</span>
      </div>

      {/* Card Body: Title, Description, Semester & Downloads Metadata */}
      <div className="bento-card-body">
        <h3 className="bento-card-title group-hover:text-blue-600 transition-colors">{resource.title}</h3>
        <p className="bento-card-desc">{resource.description}</p>

        <div className="bento-meta-pills">
          <span className="bento-pill">
            <Calendar className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{resource.semester}</span>
          </span>
          <span className="bento-pill">
            <ArrowDownToLine className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{downloadCountDisplay}</span>
          </span>
        </div>
      </div>

      {/* Card Footer: Archive Status + Action Button */}
      <div className="bento-card-footer">
        <span className="bento-download-count">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>Curriculum Archive</span>
        </span>

        <button
          type="button"
          className={cn(
            'btn-bento-action',
            meta.featured ? 'btn-bento-featured' : 'btn-bento-standard'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onOpenViewer(resource)
          }}
          aria-label={`Open syllabus viewer for ${resource.title}`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>View Curriculum &amp; Download</span>
        </button>
      </div>
    </motion.div>
  )
}

export const AcademicResources: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'syllabus' | 'labs' | 'papers' | 'notes'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeResource, setActiveResource] = useState<AcademicResource | null>(null)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)
  const [extraDownloads, setExtraDownloads] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('gist_academic_download_counts')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })
  const shouldReduceMotion = useReducedMotion()

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveResource(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filterTabs = [
    { key: 'all', label: 'All Resources', icon: Layers },
    { key: 'syllabus', label: 'Syllabus & Regulations', icon: BookOpen },
    { key: 'labs', label: 'Lab Manuals', icon: FlaskConical },
    { key: 'papers', label: 'Question Papers', icon: FolderArchive },
    { key: 'notes', label: 'Lecture Notes', icon: FileText }
  ] as const

  const filteredResources = academicResourcesData.filter((item) => {
    const matchesCategory = selectedFilter === 'all' || item.category === selectedFilter
    const q = searchQuery.toLowerCase().trim()
    if (!q) return matchesCategory

    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.semester.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)

    return matchesCategory && matchesSearch
  })

  const handleDownloadFile = (resource: AcademicResource) => {
    // Generate formatted syllabus text file
    const unitsText = (resource.syllabusOutline || [
      'Unit I: Fundamental Concepts and Mathematical Foundations',
      'Unit II: Core Architectural Principles and System Formulations',
      'Unit III: Implementation Methods and Advanced Operations',
      'Unit IV: Engineering Applications and Performance Evaluation',
      'Unit V: Contemporary Topics and Industry Case Studies'
    ])
      .map((u, i) => `  [${i + 1}] ${u}`)
      .join('\n\n')

    const textbooksText = (resource.prescribedTextbooks || [
      'Prescribed Course Textbook, Department of Computer Science & Engineering, GIST',
      'AICTE Model Curriculum & JNTUA Reference Guidelines'
    ])
      .map((b, i) => `  (${i + 1}) ${b}`)
      .join('\n')

    const fileContent = `================================================================================
GEETHANJALI INSTITUTE OF SCIENCE AND TECHNOLOGY (GIST)
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
OFFICIAL ACADEMIC CURRICULUM ARCHIVE & SYLLABUS SPECIFICATION
================================================================================

COURSE CODE      : ${resource.code}
COURSE TITLE     : ${resource.title}
ACADEMIC CATEGORY: ${resource.badge}
SEMESTER / YEAR  : ${resource.semester}
CREDIT RATING    : ${resource.credits ?? 3} Credits
REGULATION       : ${resource.regulations ?? 'JNTUA Autonomous Academic Framework'}
VERIFIED STATUS  : Approved by Department Academic Council & Board of Studies

--------------------------------------------------------------------------------
1. COURSE OVERVIEW & SCOPE
--------------------------------------------------------------------------------
${resource.description}

--------------------------------------------------------------------------------
2. DETAILED SYLLABUS BREAKDOWN / LABORATORY EXPERIMENT INDEX
--------------------------------------------------------------------------------
${unitsText}

--------------------------------------------------------------------------------
3. PRESCRIBED TEXTBOOKS & ACADEMIC REFERENCES
--------------------------------------------------------------------------------
${textbooksText}

================================================================================
Document generated from GIST SMART CSE HUB on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}.
This electronic syllabus summary is maintained by the Department of CSE.
================================================================================`

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${resource.code}_${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Syllabus.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Update download counter
    setExtraDownloads((prev) => {
      const updated = {
        ...prev,
        [resource.id]: (prev[resource.id] || 0) + 1
      }
      try {
        localStorage.setItem('gist_academic_download_counts', JSON.stringify(updated))
      } catch {
        // Fallback
      }
      return updated
    })

    setDownloadNotice(
      `Curriculum Archive Downloaded: "${resource.code} - ${resource.title}" syllabus specification saved to your device.`
    )
    setTimeout(() => setDownloadNotice(null), 6000)
  }

  const getCardSpanClass = (index: number) => {
    if (selectedFilter !== 'all' || searchQuery.trim() !== '') {
      return filteredResources.length === 1 ? 'bento-span-2' : 'bento-span-1'
    }
    return index === 0 || index === 3 ? 'bento-span-2' : 'bento-span-1'
  }

  const getDownloadCountDisplay = (resource: AcademicResource) => {
    const extra = extraDownloads[resource.id] || 0
    if (extra === 0) return resource.downloadCount
    return `${resource.downloadCount} (+${extra} new)`
  }

  return (
    <section className="department-section" id="academics">
      {/* Header Block */}
      <div className="section-header-block">
        <div className="section-tag-pill">ACADEMIC EXCELLENCE</div>
        <h2 className="section-main-heading">
          Department Academic <span className="text-gradient">Resources</span>
        </h2>
        <p className="section-lead-text">
          Access syllabi, laboratory manuals, question banks, and lecture presentations curated for GIST CSE students.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
        {/* Segmented Filter Tabs Bar */}
        <div className="filter-tabs-bar mb-0! w-full md:w-auto" role="tablist" aria-label="Resource categories">
          {filterTabs.map((tab) => {
            const TabIcon = tab.icon
            const isActive = selectedFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn('filter-tab-btn', isActive && 'active-tab')}
                onClick={() => setSelectedFilter(tab.key)}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            id="academic-resources-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, title, semester..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Download Status Notification Banner */}
      <AnimatePresence>
        {downloadNotice && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="portal-notice-banner"
            role="status"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{downloadNotice}</span>
            </div>
            <button
              type="button"
              className="portal-notice-close"
              onClick={() => setDownloadNotice(null)}
              aria-label="Dismiss notice"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Result Feedback if empty */}
      {filteredResources.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-600 my-4 shadow-sm">
          <BookMarked className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No academic resources match your search.</p>
          <p className="text-xs text-slate-600 mt-1">Try searching for &quot;DBMS&quot;, &quot;CS301PC&quot;, &quot;Lab&quot;, or &quot;Syllabus&quot;.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedFilter('all')
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs text-blue-700 font-semibold border border-blue-200 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Responsive Bento Grid */}
      <div className="bento-resources-grid">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource, idx) => (
            <BentoCard
              key={resource.id}
              resource={resource}
              spanClass={getCardSpanClass(idx)}
              downloadCountDisplay={getDownloadCountDisplay(resource)}
              shouldReduceMotion={shouldReduceMotion}
              onOpenViewer={(item) => setActiveResource(item)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Digital Curriculum & Syllabus Viewer Modal */}
      <AnimatePresence>
        {activeResource && (
          <div className="login-modal-overlay" onClick={() => setActiveResource(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="syllabus-modal-title"
              className="login-modal-card max-w-2xl! max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal Header */}
              <div className="login-modal-header border-b border-slate-200 pb-4">
                <div className="login-modal-title-group">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {activeResource.code}
                    </span>
                    <span className="text-xs text-slate-600">&bull; {activeResource.semester}</span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {activeResource.credits ? `${activeResource.credits} Credits` : 'Credit Course'}
                    </span>
                  </div>
                  <h2 id="syllabus-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                    {activeResource.title}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Regulation: {activeResource.regulations || 'JNTUA Autonomous Academic Framework'}
                  </p>
                </div>

                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setActiveResource(null)}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Course Overview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 block mb-1">Course Description:</strong>
                {activeResource.description}
              </div>

              {/* Syllabus Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {activeResource.category === 'labs' ? 'Laboratory Experiment Index' : 'Curriculum Units & Topics'}
                  </span>
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(activeResource.syllabusOutline || []).map((unit, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5"
                    >
                      <span className="font-mono text-blue-700 text-[11px] font-bold mt-0.5 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="leading-relaxed">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Textbooks & References */}
              {activeResource.prescribedTextbooks && activeResource.prescribedTextbooks.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-800">Prescribed Academic Textbooks &amp; References:</h4>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc pl-5">
                    {activeResource.prescribedTextbooks.map((book, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {book}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 mt-2">
                <span className="text-[11px] text-slate-600">
                  Digital Document: <strong className="text-slate-900 font-mono">{activeResource.code}.txt</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveResource(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(activeResource)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98]"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download Syllabus Archive (.txt)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default AcademicResources
