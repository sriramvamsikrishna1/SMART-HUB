import { apiRequest } from './api'
import type { ApiResponse } from '../types/auth'

export interface FacultyProfileResponse {
  profile: {
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
  user: {
    id: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }
}

export interface FacultyDepartmentOverviewResponse {
  department: string
  enrolledStudents: number
  departmentFaculty: number
}

export const facultyApi = {
  /**
   * Retrieves the authenticated faculty member's profile
   */
  async getProfile(): Promise<ApiResponse<FacultyProfileResponse>> {
    return apiRequest<ApiResponse<FacultyProfileResponse>>('/api/v1/faculty/profile', {
      method: 'GET'
    })
  },

  /**
   * Retrieves department overview metrics for instructional staff
   */
  async getDepartmentOverview(): Promise<ApiResponse<FacultyDepartmentOverviewResponse>> {
    return apiRequest<ApiResponse<FacultyDepartmentOverviewResponse>>('/api/v1/faculty/overview', {
      method: 'GET'
    })
  }
}
