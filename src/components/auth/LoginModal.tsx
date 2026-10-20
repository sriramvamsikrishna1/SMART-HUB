import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Lock,
  User,
  GraduationCap,
  School,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import type { UserRole, AuthUser } from '../../types/auth'
import { useAuth } from '../../context/useAuth'

interface LoginModalProps {
  isOpen: boolean
  initialRole?: UserRole
  onClose: () => void
  onSuccess?: (user: AuthUser) => void
}

interface RoleConfig {
  label: string
  identifierLabel: string
  identifierPlaceholder: string
  helperText: string
  icon: React.ReactNode
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  STUDENT: {
    label: 'Student',
    identifierLabel: 'College Roll Number',
    identifierPlaceholder: 'e.g., 21CSE101',
    helperText: 'Sign in with your registered college roll number or university email.',
    icon: <GraduationCap className="w-4 h-4" />
  },
  FACULTY: {
    label: 'Faculty',
    identifierLabel: 'Faculty ID or Email',
    identifierPlaceholder: 'e.g., FAC-01 or prof@institution.edu',
    helperText: 'Sign in with your departmental faculty identifier or assigned email.',
    icon: <School className="w-4 h-4" />
  },
  ADMIN: {
    label: 'Admin',
    identifierLabel: 'Admin Code or Email',
    identifierPlaceholder: 'e.g., ADM-001 or admin@institution.edu',
    helperText: 'Sign in with your administrative security code or authorized email.',
    icon: <ShieldCheck className="w-4 h-4" />
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialRole = 'STUDENT',
  onClose,
  onSuccess
}) => {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole)
  const [identifier, setIdentifier] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false)
  const [prevInitialRole, setPrevInitialRole] = useState<UserRole>(initialRole)
  if (isOpen !== prevIsOpen || (isOpen && initialRole !== prevInitialRole)) {
    setPrevIsOpen(isOpen)
    setPrevInitialRole(initialRole)
    if (isOpen) {
      setSelectedRole(initialRole)
      setErrorMessage(null)
      setIdentifier('')
      setPassword('')
      setShowPassword(false)
    }
  }

  const modalRef = useRef<HTMLDivElement>(null)
  const identifierInputRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Accessibility: Focus management, background scroll lock, and Escape listener
  useEffect(() => {
    if (!isOpen) return

    // Save current active element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus initial input
    const focusTimer = setTimeout(() => {
      identifierInputRef.current?.focus()
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
        return
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, isSubmitting, onClose])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    setErrorMessage(null)
    identifierInputRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setErrorMessage(`Please enter your ${roleConfigs[selectedRole].identifierLabel.toLowerCase()}.`)
      identifierInputRef.current?.focus()
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const user = await login({
        identifier: trimmedIdentifier,
        password,
        role: selectedRole
      })

      setIsSubmitting(false)
      onSuccess?.(user)
      onClose()
    } catch (err: any) {
      setIsSubmitting(false)
      const message =
        err?.responseData?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials and try again.'
      setErrorMessage(message)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="login-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              onClose()
            }
          }}
          aria-hidden={!isOpen}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            aria-describedby="login-modal-description"
            className="login-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header with Title and Close Button */}
            <div className="login-modal-header">
              <div className="login-modal-title-group">
                <span className="login-modal-badge">{roleConfigs[selectedRole].label} Portal</span>
                <h2 id="login-modal-title" className="login-modal-heading">
                  Sign in to Smart Hub
                </h2>
                <p id="login-modal-description" className="login-modal-subtext">
                  {roleConfigs[selectedRole].helperText}
                </p>
              </div>

              <button
                type="button"
                id="login-modal-close-btn"
                className="login-modal-close-btn"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div className="login-role-tabs" role="tablist" aria-label="Portal Role Selection">
              {(['STUDENT', 'FACULTY', 'ADMIN'] as UserRole[]).map((role) => {
                const config = roleConfigs[role]
                const isActive = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    role="tab"
                    id={`login-role-tab-${role.toLowerCase()}`}
                    aria-selected={isActive}
                    aria-controls="login-form"
                    className={`login-role-tab ${isActive ? 'active' : ''}`}
                    onClick={() => handleRoleChange(role)}
                    disabled={isSubmitting}
                  >
                    <span className="tab-icon">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <motion.div
                id="login-error-alert"
                className="login-error-alert"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form id="login-form" onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Identifier Input */}
              <div className="login-input-group">
                <label htmlFor="login-identifier-input" className="login-input-label">
                  {roleConfigs[selectedRole].identifierLabel}
                  <span className="required-star" aria-hidden="true">*</span>
                </label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon" aria-hidden="true">
                    <User className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    ref={identifierInputRef}
                    id="login-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    placeholder={roleConfigs[selectedRole].identifierPlaceholder}
                    className="login-text-input"
                    disabled={isSubmitting}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-input-group">
                <div className="login-password-header">
                  <label htmlFor="login-password-input" className="login-input-label">
                    Password
                    <span className="required-star" aria-hidden="true">*</span>
                  </label>
                </div>
                <div className="login-input-wrapper">
                  <span className="login-input-icon" aria-hidden="true">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    placeholder="Enter your account password"
                    className="login-text-input pr-10"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    id="login-toggle-password-btn"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                className="login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {roleConfigs[selectedRole].label} Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="login-security-notice">
                <span>🛡️ Institutional single sign-on &amp; secure session protection.</span>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
