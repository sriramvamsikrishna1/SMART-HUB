export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN'

export interface StudentProfile {
  id: string
  studentId: string
  fullName?: string
  firstName?: string
  lastName?: string
  department: string
  semester?: number | null
  section?: string | null
  batchYear?: string
  admissionYear?: number
  avatarUrl?: string | null
}

export interface FacultyProfile {
  id: string
  facultyId: string
  fullName?: string
  firstName?: string
  lastName?: string
  department: string
  designation: string
  specialization?: string | null
  avatarUrl?: string | null
}

export interface AdminProfile {
  id: string
  adminCode: string
  fullName?: string
  firstName?: string
  lastName?: string
  department?: string
  designation?: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  displayName: string
  identifier: string
  department?: string
  studentProfile?: StudentProfile | null
  facultyProfile?: FacultyProfile | null
  adminProfile?: AdminProfile | null
}

export interface LoginCredentials {
  identifier: string
  password: string
  role?: UserRole
}

export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error'
  data?: T
  message?: string
  timestamp?: string
}

export interface LoginResponseData {
  accessToken: string
  user: {
    id: string
    email: string
    role: UserRole
    identifier: string
    profile?: StudentProfile | FacultyProfile | AdminProfile | null
  }
}

export interface RefreshResponseData {
  accessToken: string
  user: {
    id: string
    email: string
    role: UserRole
  }
}

export interface MeResponseData {
  user: {
    id: string
    email: string
    role: UserRole
    isActive: boolean
    createdAt: string
    updatedAt: string
    studentProfile?: StudentProfile | null
    facultyProfile?: FacultyProfile | null
    adminProfile?: AdminProfile | null
  }
}

/**
 * Normalizes backend user objects from /login or /me into a consistent AuthUser.
 */
export function normalizeUser(rawUser: any): AuthUser {
  if (!rawUser) {
    throw new Error('Cannot normalize null or undefined user')
  }

  const role: UserRole = rawUser.role

  // Check for nested profile relations from /me or /login
  const studentProfile = rawUser.studentProfile || (role === 'STUDENT' ? rawUser.profile : null)
  const facultyProfile = rawUser.facultyProfile || (role === 'FACULTY' ? rawUser.profile : null)
  const adminProfile = rawUser.adminProfile || (role === 'ADMIN' ? rawUser.profile : null)

  const studentFullName =
    studentProfile?.fullName ||
    (studentProfile?.firstName ? `${studentProfile.firstName} ${studentProfile.lastName || ''}`.trim() : null)

  const facultyFullName =
    facultyProfile?.fullName ||
    (facultyProfile?.firstName ? `${facultyProfile.firstName} ${facultyProfile.lastName || ''}`.trim() : null)

  const adminFullName =
    adminProfile?.fullName ||
    (adminProfile?.firstName ? `${adminProfile.firstName} ${adminProfile.lastName || ''}`.trim() : null)

  const displayName =
    studentFullName ||
    facultyFullName ||
    adminFullName ||
    rawUser.displayName ||
    rawUser.email?.split('@')[0] ||
    'User'

  const identifier =
    studentProfile?.studentId ||
    facultyProfile?.facultyId ||
    adminProfile?.adminCode ||
    rawUser.identifier ||
    rawUser.email

  const department =
    studentProfile?.department ||
    facultyProfile?.department ||
    adminProfile?.department ||
    ''

  return {
    id: rawUser.id,
    email: rawUser.email,
    role,
    displayName,
    identifier,
    department,
    studentProfile: studentProfile || null,
    facultyProfile: facultyProfile || null,
    adminProfile: adminProfile || null
  }
}
