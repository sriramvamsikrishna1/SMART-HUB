import type { ApiResponse, RefreshResponseData } from '../types/auth'

/**
 * In-memory storage for the short-lived access token.
 * SECURITY: Never written to localStorage or sessionStorage.
 */
let inMemoryAccessToken: string | null = null

/**
 * Single in-flight refresh promise to prevent concurrent refresh storms.
 */
let refreshPromise: Promise<string | null> | null = null

/**
 * Optional listener triggered when an automatic session refresh fails.
 */
type AuthFailureListener = () => void
let authFailureListener: AuthFailureListener | null = null

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListener = listener
  return () => {
    if (authFailureListener === listener) {
      authFailureListener = null
    }
  }
}

export class ApiError extends Error {
  public status: number
  public responseData?: any

  constructor(message: string, status: number, responseData?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.responseData = responseData
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
  _retryCount?: number
}

/**
 * Resolves an API endpoint against the configurable VITE_API_URL environment variable.
 * If VITE_API_URL is unset or empty, preserves relative URLs (e.g. '/api/v1/...'),
 * maintaining seamless local Vite dev proxying and same-domain reverse-proxy deployments.
 * Normalizes trailing and leading slashes and prevents duplicate '/api/v1' path segments.
 */
export function resolveApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  const rawBase = import.meta.env?.VITE_API_URL
  if (!rawBase || typeof rawBase !== 'string' || rawBase.trim() === '') {
    return endpoint
  }

  const cleanBase = rawBase.trim().replace(/\/+$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (cleanBase.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1')) {
    return `${cleanBase}${cleanEndpoint.slice(7)}`
  }

  return `${cleanBase}${cleanEndpoint}`
}

/**
 * Performs token refresh using the HttpOnly cookie.
 * Ensures only one refresh request runs at any time.
 */
export async function performTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        // Refresh failed (e.g. 401 Session expired or revoked)
        setAccessToken(null)
        if (authFailureListener) {
          authFailureListener()
        }
        return null
      }

      const result: ApiResponse<RefreshResponseData> = await response.json()
      const newAccessToken = result.data?.accessToken || null
      setAccessToken(newAccessToken)
      return newAccessToken
    } catch {
      setAccessToken(null)
      if (authFailureListener) {
        authFailureListener()
      }
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Centralized API request wrapper.
 * Automatically injects the in-memory access token, includes credentials,
 * handles JSON parsing, and performs a single automatic retry with token refresh on 401.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, _retryCount = 0, headers = {}, ...restOptions } = options

  // Normalize request headers
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>)
  }

  // Inject Bearer token if available and authentication is not skipped
  if (!skipAuth && inMemoryAccessToken) {
    reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`
  }

  const targetUrl = resolveApiUrl(endpoint)
  const response = await fetch(targetUrl, {
    ...restOptions,
    headers: reqHeaders,
    credentials: 'include' // Always include cookies for HttpOnly refresh tokens and sessions
  })

  // Handle successful responses
  if (response.ok) {
    const data = await response.json().catch(() => ({}))
    return data as T
  }

  // Check if eligible for automatic token refresh and single retry:
  // 1. Must be a 401 Unauthorized status
  // 2. Must not be a skipAuth request
  // 3. Must not be an auth endpoint (/auth/login or /auth/refresh)
  // 4. Must not have already retried (_retryCount < 1)
  const isAuthEndpoint =
    endpoint.includes('/api/v1/auth/login') ||
    endpoint.includes('/api/v1/auth/refresh') ||
    endpoint.includes('/api/v1/auth/logout')

  if (response.status === 401 && !skipAuth && !isAuthEndpoint && _retryCount < 1) {
    const newAccessToken = await performTokenRefresh()
    if (newAccessToken) {
      // Retry the failed request once with the new access token
      return apiRequest<T>(endpoint, {
        ...options,
        _retryCount: _retryCount + 1
      })
    }
  }

  // Parse error payload
  let errorPayload: any = null
  try {
    errorPayload = await response.json()
  } catch {
    errorPayload = null
  }

  const errorMessage =
    errorPayload?.message ||
    (response.status === 502
      ? 'HTTP 502 Bad Gateway: The backend server (port 5000) is unreachable. Please run "npm run dev:all" from the project root.'
      : `HTTP Error ${response.status}: ${response.statusText || 'Request failed'}`)

  throw new ApiError(errorMessage, response.status, errorPayload)
}
