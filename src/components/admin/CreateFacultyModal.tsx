import React, { useState } from 'react'
import { X, Eye, EyeOff, Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import type { CreateFacultyPayload, AdminUserItem } from '../../types/admin'

interface CreateFacultyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newUser: AdminUserItem) => void
}

export const CreateFacultyModal: React.FC<CreateFacultyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [facultyId, setFacultyId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science and Engineering')
  const [designation, setDesignation] = useState('Assistant Professor')
  const [specialization, setSpecialization] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedId = facultyId.trim().toUpperCase()
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()

    if (!trimmedId) {
      setErrorMessage('Faculty ID (facultyId) is required.')
      return
    }
    if (!trimmedFirst) {
      setErrorMessage('First Name is required.')
      return
    }
    if (!trimmedLast) {
      setErrorMessage('Last Name is required.')
      return
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    const payload: CreateFacultyPayload = {
      facultyId: trimmedId,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: email.trim() || undefined,
      department: department.trim(),
      designation: designation.trim(),
      specialization: specialization.trim() || undefined,
      password
    }

    setIsLoading(true)
    try {
      const res = await adminApi.createFaculty(payload)
      if (res.data?.user) {
        onSuccess(res.data.user)
        onClose()
      } else {
        setErrorMessage(res.message || 'Failed to create faculty account.')
      }
    } catch (err: any) {
      setErrorMessage(err?.responseData?.message || err?.message || 'Network error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-faculty-title"
    >
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8 text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-faculty-title" className="text-xl font-bold tracking-tight text-slate-900">
                Provision Faculty Account
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Register academic faculty or instructional staff credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faculty ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Faculty ID <span className="text-indigo-600">*</span>
              </label>
              <input
                type="text"
                required
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                placeholder="e.g., FAC-012"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation <span className="text-indigo-600">*</span>
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 outline-none transition shadow-2xs"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name <span className="text-indigo-600">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g., Suresh"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name <span className="text-indigo-600">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g., Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department <span className="text-indigo-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 outline-none transition shadow-2xs"
              >
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="CSE (Artificial Intelligence)">CSE (Artificial Intelligence)</option>
                <option value="CSE (Data Science)">CSE (Data Science)</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Specialization / Domain
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Cloud & Distributed Systems"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Institutional Email <span className="text-slate-500 font-normal lowercase">(optional: defaults to &lt;facultyId&gt;@gist.edu.in)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={facultyId ? `${facultyId.toLowerCase()}@gist.edu.in` : 'faculty@gist.edu.in'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
            />
          </div>

          {/* Initial Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Password <span className="text-indigo-600">*</span> <span className="text-slate-500 font-normal">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure initial password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-500 outline-none transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-xs transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Faculty Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFacultyModal
