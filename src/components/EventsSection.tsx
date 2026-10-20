import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  MapPin,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
  X,
  Calendar,
  FileDown,
  CalendarPlus,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react'
import { departmentEventsData, type DepartmentEvent } from '../data/departmentData'
import { useAuth } from '../context/useAuth'
import { cn } from '../lib/utils'

export const EventsSection: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<DepartmentEvent | null>(null)
  const [eventNotice, setEventNotice] = useState<string | null>(null)

  // Custom events issued by Faculty / Admin (persisted in localStorage)
  const [customEvents, setCustomEvents] = useState<DepartmentEvent[]>(() => {
    try {
      const stored = localStorage.getItem('gist_custom_events')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)

  // Form State for Issuing Circular
  const [formData, setFormData] = useState({
    title: '',
    type: 'notice' as DepartmentEvent['type'],
    day: '20',
    month: 'OCT',
    category: 'Department Circular',
    description: '',
    venue: 'CSE Department Seminar Hall',
    isUrgent: false,
    actionItems: ''
  })
  const [formError, setFormError] = useState<string | null>(null)

  const isFacultyOrAdmin = isAuthenticated && (user?.role === 'FACULTY' || user?.role === 'ADMIN')

  // Close modals on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEvent(null)
        setIsPublishModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAction = (event: DepartmentEvent) => {
    setSelectedEvent(event)
  }

  const handleDownloadCircular = (event: DepartmentEvent) => {
    const content = `================================================================================
GEETHANJALI INSTITUTE OF SCIENCE AND TECHNOLOGY (GIST)
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
OFFICIAL NOTIFICATION & CIRCULAR BULLETIN
================================================================================

CIRCULAR NO   : ${event.circularNo || `GIST/CSE/CIR/2026/${event.id}`}
DATE OF ISSUE : ${event.date.day} ${event.date.month} 2026
ISSUING DESK  : ${event.issuedBy || 'Office of the Head of Department, CSE'}
CATEGORY      : ${event.category}
TARGET AUDIENCE: B.Tech CSE Scholars & Faculty Members
VENUE / VENUE : ${event.venue}
URGENCY LEVEL : ${event.isUrgent ? 'URGENT CIRCULAR' : 'Standard Department Notice'}

--------------------------------------------------------------------------------
SUBJECT & SUMMARY
--------------------------------------------------------------------------------
${event.title}

${event.description}

--------------------------------------------------------------------------------
ACTIONABLE GUIDELINES & DIRECTIVES
--------------------------------------------------------------------------------
${(event.actionItems || [
  'All concerned scholars must note the dates and comply with the instructions.',
  'Further inquiries should be addressed to the Department Office or Class Advisors.'
])
  .map((item, idx) => `  [${idx + 1}] ${item}`)
  .join('\n\n')}

================================================================================
Issued under the authority of Department of Computer Science & Engineering, GIST.
================================================================================`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Circular_${event.id}_${event.date.month}${event.date.day}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setEventNotice(`Circular file downloaded: "Circular_${event.id}.txt" saved to your computer.`)
    setTimeout(() => setEventNotice(null), 5000)
  }

  const handleAddToCalendar = (event: DepartmentEvent) => {
    // Generate .ics calendar file
    const icsDate = `202610${event.date.day.padStart(2, '0')}T090000Z`
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GIST CSE SMART HUB//EN
BEGIN:VEVENT
UID:${event.id}-gist-cse@hub.edu.in
DTSTAMP:${icsDate}
DTSTART:${icsDate}
DTEND:${icsDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, ' ')}
LOCATION:${event.venue}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_Event.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setEventNotice(`Calendar Event Exported: Imported "${event.title}" to standard iCalendar (.ics) format.`)
    setTimeout(() => setEventNotice(null), 5000)
  }

  const handlePublishCircular = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError('Please enter a circular title.')
      return
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setFormError('Please provide circular details of at least 20 characters.')
      return
    }

    const actionItemsList = formData.actionItems
      ? formData.actionItems.split('\n').map((i) => i.trim()).filter(Boolean)
      : ['Please check department notice board for follow-up notifications.']

    const newEvent: DepartmentEvent = {
      id: `custom-event-${Date.now()}`,
      title: formData.title.trim(),
      type: formData.type,
      date: { day: formData.day.trim() || '20', month: formData.month.trim().toUpperCase() || 'OCT' },
      category: formData.category,
      description: formData.description.trim(),
      isUrgent: formData.isUrgent,
      venue: formData.venue.trim() || 'CSE Department',
      circularNo: `GIST/CSE/${formData.type.toUpperCase()}/2026/${Math.floor(100 + Math.random() * 900)}`,
      issuedBy: `${user?.displayName || 'Faculty Member'} (${user?.role})`,
      actionItems: actionItemsList
    }

    const updated = [newEvent, ...customEvents]
    setCustomEvents(updated)
    try {
      localStorage.setItem('gist_custom_events', JSON.stringify(updated))
    } catch {
      // Fallback
    }

    setIsPublishModalOpen(false)
    setFormData({
      title: '',
      type: 'notice',
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      category: 'Department Circular',
      description: '',
      venue: 'CSE Department Seminar Hall',
      isUrgent: false,
      actionItems: ''
    })

    setEventNotice(`Official Circular Published: "${newEvent.title}" is now active on the bulletins board.`)
    setTimeout(() => setEventNotice(null), 7000)
  }

  const filterTabs = [
    { key: 'all', label: 'All Bulletins', icon: Layers },
    { key: 'notice', label: 'Academic Notices', icon: Bell },
    { key: 'workshop', label: 'Workshops', icon: FileText },
    { key: 'fest', label: 'Symposiums & Fests', icon: Sparkles }
  ]

  const allEvents = [...customEvents, ...departmentEventsData]

  const filteredEvents = allEvents.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    if (!q) return matchesCategory

    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.venue.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.circularNo && item.circularNo.toLowerCase().includes(q))

    return matchesCategory && matchesSearch
  })

  return (
    <section className="department-section" id="events">
      <div className="section-header-block">
        <div className="flex items-center justify-between flex-wrap gap-3 w-full">
          <div>
            <div className="section-tag-pill">NOTICES &amp; HAPPENINGS</div>
            <h2 className="section-main-heading">
              Department Events &amp; <span className="text-gradient">Announcements</span>
            </h2>
            <p className="section-lead-text">
              Stay informed with academic circulars, hands-on faculty workshops, student symposiums, and university exam schedules.
            </p>
          </div>

          {/* Protected Action: Issue Circular for Faculty & Admin */}
          {isFacultyOrAdmin && (
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Official Circular</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
        <div className="filter-tabs-bar mb-0! w-full md:w-auto" role="tablist" aria-label="Event Categories">
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

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            id="events-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bulletins, circulars, venue..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600 transition shadow-2xs"
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

      {/* Feedback Banner */}
      {eventNotice && (
        <div className="portal-notice-banner" role="status">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{eventNotice}</span>
          </div>
          <button
            type="button"
            className="portal-notice-close"
            onClick={() => setEventNotice(null)}
            aria-label="Dismiss notice"
          >
            &times;
          </button>
        </div>
      )}

      {/* Events List */}
      <div className="events-list">
        {filteredEvents.map((event) => {
          const isSelected = selectedEvent?.id === event.id
          return (
            <div
              key={event.id}
              className={cn(
                'event-card cursor-pointer group transition-all',
                event.isUrgent && 'urgent-card',
                isSelected && 'border-blue-500/50 bg-slate-900/60'
              )}
              onClick={() => handleAction(event)}
            >
              {/* Calendar Date Badge */}
              <div className="event-date-badge" aria-label={`Date: ${event.date.day} ${event.date.month}`}>
                <span className="event-month">{event.date.month}</span>
                <span className="event-day">{event.date.day}</span>
              </div>

              {/* Event Details */}
              <div className="event-info">
                <div className="event-top-tags">
                  <span className="event-category-tag">{event.category}</span>
                  {event.circularNo && (
                    <span className="text-[10px] font-mono text-slate-600 font-medium hidden sm:inline-block">
                      {event.circularNo}
                    </span>
                  )}
                  {event.isUrgent && (
                    <span className="event-urgent-tag flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>URGENT CIRCULAR</span>
                    </span>
                  )}
                  <span className="event-venue-tag flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>{event.venue}</span>
                  </span>
                </div>

                <h3 className="event-title group-hover:text-amber-300 transition-colors">{event.title}</h3>
                <p className="event-desc">{event.description}</p>
              </div>

              {/* Event Action Button */}
              <div className="event-action-col">
                <button
                  type="button"
                  className="btn-event-action"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAction(event)
                  }}
                  aria-label={`View bulletin details for ${event.title}`}
                >
                  <span>{event.type === 'notice' ? 'Circular Details' : 'Event Information'}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal 1: Official Department Circular & Bulletin Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="login-modal-overlay" onClick={() => setSelectedEvent(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="circular-modal-title"
              className="login-modal-card max-w-2xl! max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal Header */}
              <div className="login-modal-header border-b border-slate-200 pb-3">
                <div className="login-modal-title-group">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedEvent.circularNo || `REF-${selectedEvent.id}`}
                    </span>
                    <span className="text-xs text-slate-600">
                      &bull; {selectedEvent.date.day} {selectedEvent.date.month} 2026
                    </span>
                    {selectedEvent.isUrgent && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Urgent Directive
                      </span>
                    )}
                  </div>
                  <h3 id="circular-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Issued By: {selectedEvent.issuedBy || 'CSE Department Academic Council'}
                  </p>
                </div>
                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 block mb-1 font-semibold">Official Circular Statement:</strong>
                {selectedEvent.description}
              </div>

              {/* Venue & Location Info */}
              <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Official Venue / Point of Contact: <strong className="text-slate-900 font-semibold">{selectedEvent.venue}</strong>
                </span>
              </div>

              {/* Actionable Guidelines */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Key Action Items &amp; Instructions</span>
                </h4>
                <div className="space-y-2">
                  {(selectedEvent.actionItems || [
                    'All concerned students must review and comply with the stated dates.',
                    'Direct questions or fee verification receipts to the CSE Department Office.'
                  ]).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="font-mono text-blue-700 text-[11px] font-bold mt-0.5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="leading-relaxed font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200"
                >
                  Dismiss
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddToCalendar(selectedEvent)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-blue-700" />
                    <span>Add to Calendar (.ics)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadCircular(selectedEvent)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Official Notice (.txt)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Protected Issue Department Circular Modal (FACULTY / ADMIN) */}
      <AnimatePresence>
        {isPublishModalOpen && isFacultyOrAdmin && (
          <div className="login-modal-overlay" onClick={() => setIsPublishModalOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="issue-circular-modal-title"
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
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Authorized Faculty Desk
                    </span>
                    <span className="text-xs text-slate-600">
                      {user?.displayName} ({user?.role})
                    </span>
                  </div>
                  <h3 id="issue-circular-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                    Issue Department Circular / Notice
                  </h3>
                  <p className="text-xs text-slate-600">
                    Publish an official notification to the student body and faculty portal.
                  </p>
                </div>
                <button
                  type="button"
                  className="login-modal-close-btn"
                  onClick={() => setIsPublishModalOpen(false)}
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

              <form onSubmit={handlePublishCircular} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Circular Title / Subject <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Schedule for Mid-Term Examination Laboratory Vivas"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="notice">Academic Notice</option>
                      <option value="workshop">Workshop</option>
                      <option value="fest">Symposium / Fest</option>
                      <option value="seminar">Seminar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date (Day)</label>
                    <input
                      type="text"
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                      placeholder="e.g., 28"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date (Month)</label>
                    <input
                      type="text"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      placeholder="e.g., OCT"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category Tag</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Laboratory Evaluation"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Venue / Room</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g., CSE Lab 2 / Exam Cell"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Circular Description &amp; Directives <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide full official text, criteria, eligibility, and instructions..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Action Items (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.actionItems}
                    onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                    placeholder="Line 1: Bring printed laboratory record books.&#10;Line 2: Viva timings will be posted outside Lab 2."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="urgent-circular-checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                    className="rounded bg-white border-slate-300 text-rose-600 focus:ring-0"
                  />
                  <label htmlFor="urgent-circular-checkbox" className="text-slate-700 font-semibold cursor-pointer">
                    Mark as Urgent Circular (Highlights in red alert on bulletins board)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Issue Circular</span>
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

export default EventsSection
