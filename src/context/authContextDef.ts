import { createContext } from 'react'
import type { AuthUser, UserRole, LoginCredentials } from '../types/auth'

export interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  restoreSession: () => Promise<AuthUser | null>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
