import React, { useState, useEffect, useCallback } from 'react'
import {
  type AuthUser,
  type LoginCredentials,
  normalizeUser
} from '../types/auth'
import { authApi } from '../services/authApi'
import { setAccessToken, onAuthFailure } from '../services/api'
import { AuthContext, type AuthContextType } from './authContextDef'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * Restores an existing session on page refresh via the HttpOnly cookie.
   * If valid, retrieves a new access token and then fetches the full user profile.
   */
  const restoreSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      // 1. Attempt token refresh using the HttpOnly cookie
      const refreshRes = await authApi.refresh()
      const newAccessToken = refreshRes.data?.accessToken

      if (!newAccessToken) {
        setUser(prev => (prev ? prev : null))
        return null
      }

      // Store access token in memory
      setAccessToken(newAccessToken)

      // 2. Refresh endpoint only returns basic user info; fetch full profile from /me
      const meRes = await authApi.getMe()
      if (meRes.data?.user) {
        const fullUser = normalizeUser(meRes.data.user)
        setUser(fullUser)
        return fullUser
      }

      setUser(prev => (prev ? prev : null))
      return null
    } catch {
      // No active session or session expired - unauthenticated state is normal
      setUser(prev => (prev ? prev : null))
      return null
    }
  }, [])

  /**
   * Logs in a user, stores the access token in memory, and sets the user state.
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const res = await authApi.login(credentials)
    if (!res.data?.accessToken || !res.data?.user) {
      throw new Error(res.message || 'Authentication failed: No access token received.')
    }

    // Store access token in memory only
    setAccessToken(res.data.accessToken)

    // Normalize user with profile
    const normalized = normalizeUser(res.data.user)
    setUser(normalized)
    return normalized
  }, [])

  /**
   * Logs out the user by revoking the refresh session on the backend and clearing in-memory state.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch {
      // Ignore network errors on logout so local state is always cleared
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  // Listen for automatic token refresh failures from background API calls
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      setUser(null)
    })
    return unsubscribe
  }, [])

  // Check and restore session once on mount
  useEffect(() => {
    let isMounted = true

    async function initSession() {
      try {
        const refreshRes = await authApi.refresh()
        const newAccessToken = refreshRes.data?.accessToken
        if (newAccessToken && isMounted) {
          setAccessToken(newAccessToken)
          const meRes = await authApi.getMe()
          if (meRes.data?.user && isMounted) {
            setUser(normalizeUser(meRes.data.user))
          }
        }
      } catch {
        // Unauthenticated is expected when not logged in
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initSession()

    return () => {
      isMounted = false
    }
  }, [])

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    restoreSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
