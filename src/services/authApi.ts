import { apiRequest, performTokenRefresh } from './api'
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponseData,
  RefreshResponseData,
  MeResponseData
} from '../types/auth'

export const authApi = {
  /**
   * Authenticates a user with identifier and password.
   * On success, server responds with an access token and sets an HttpOnly refresh cookie.
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    return apiRequest<ApiResponse<LoginResponseData>>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true
    })
  },

  /**
   * Refreshes the session using the HttpOnly cookie.
   * Leverages the centralized single-flight queue to eliminate rotation collisions.
   */
  async refresh(): Promise<ApiResponse<RefreshResponseData>> {
    const token = await performTokenRefresh()
    if (!token) {
      throw new Error('No active session.')
    }
    return {
      status: 'success',
      data: {
        accessToken: token,
        user: { id: '', email: '', role: 'STUDENT' }
      }
    }
  },

  /**
   * Revokes the active session on the backend and clears the refresh cookie.
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<ApiResponse<{ message: string }>>('/api/v1/auth/logout', {
      method: 'POST',
      skipAuth: false
    })
  },

  /**
   * Retrieves the current user profile using the Bearer access token.
   */
  async getMe(): Promise<ApiResponse<MeResponseData>> {
    return apiRequest<ApiResponse<MeResponseData>>('/api/v1/auth/me', {
      method: 'GET',
      skipAuth: false
    })
  }
}
