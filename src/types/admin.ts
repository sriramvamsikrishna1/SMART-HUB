import type { UserRole } from './auth'

export interface StudentProfileData {
  id: string
  userId: string
  studentId: string
  firstName: string
  lastName: string
  department: string
  batchYear: string
  semester?: number | null
  section?: string | null
  createdAt: string
  updatedAt: string
}

export interface FacultyProfileData {
  id: string
  userId: string
  facultyId: string
  firstName: string
  lastName: string
  department: string
  designation: string
  specialization?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminProfileData {
  id: string
  userId: string
  adminCode: string
  firstName: string
  lastName: string
  department?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUserItem {
  id: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  studentProfile?: StudentProfileData | null
  facultyProfile?: FacultyProfileData | null
  adminProfile?: AdminProfileData | null
}

export interface AdminDashboardStats {
  totalUsers: number
  totalStudents: number
  totalFaculty: number
  totalAdmins: number
  activeUsers: number
  inactiveUsers: number
}

export interface CreateStudentPayload {
  studentId: string
  firstName: string
  lastName: string
  email?: string
  department: string
  batchYear: string
  semester?: number
  section?: string
  password: string
}

export interface CreateFacultyPayload {
  facultyId: string
  firstName: string
  lastName: string
  email?: string
  department: string
  designation: string
  specialization?: string
  password: string
}

export interface UsersListResponse {
  users: AdminUserItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
