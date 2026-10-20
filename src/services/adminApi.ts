import { apiRequest } from './api'
import type { ApiResponse, UserRole } from '../types/auth'
import type {
  AdminDashboardStats,
  AdminUserItem,
  CreateStudentPayload,
  CreateFacultyPayload,
  UsersListResponse
} from '../types/admin'

export const adminApi = {
  /**
   * Retrieves high-level user and account metrics for the dashboard
   */
  async getStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return apiRequest<ApiResponse<AdminDashboardStats>>('/api/v1/admin/stats', {
      method: 'GET'
    })
  },

  /**
   * Lists users with optional role filtering, search query, and pagination
   */
  async listUsers(params?: {
    role?: UserRole
    search?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<UsersListResponse>> {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))

    const queryString = query.toString()
    const endpoint = `/api/v1/admin/users${queryString ? `?${queryString}` : ''}`

    return apiRequest<ApiResponse<UsersListResponse>>(endpoint, {
      method: 'GET'
    })
  },

  /**
   * Provisions a new student account and linked StudentProfile
   */
  async createStudent(payload: CreateStudentPayload): Promise<ApiResponse<{ user: AdminUserItem }>> {
    return apiRequest<ApiResponse<{ user: AdminUserItem }>>('/api/v1/admin/students', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  /**
   * Provisions a new faculty account and linked FacultyProfile
   */
  async createFaculty(payload: CreateFacultyPayload): Promise<ApiResponse<{ user: AdminUserItem }>> {
    return apiRequest<ApiResponse<{ user: AdminUserItem }>>('/api/v1/admin/faculty', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  /**
   * Activates or deactivates a user account
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<{ user: any }>> {
    return apiRequest<ApiResponse<{ user: any }>>(`/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    })
  }
}
