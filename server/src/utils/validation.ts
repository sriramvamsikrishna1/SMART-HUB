import { Role } from '@prisma/client';

export interface LoginInput {
  identifier: string;
  password: string;
  role?: Role;
}

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validates and sanitizes the login request body
 */
export function validateLoginInput(body: any): ValidationResult<LoginInput> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  const { identifier, password, role } = body;

  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    return {
      isValid: false,
      error: 'Identifier (roll number, username, or email) is required.'
    };
  }

  const trimmedIdentifier = identifier.trim();
  if (trimmedIdentifier.length > 100) {
    return {
      isValid: false,
      error: 'Identifier cannot exceed 100 characters.'
    };
  }

  if (typeof password !== 'string' || password.length === 0) {
    return {
      isValid: false,
      error: 'Password is required.'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password cannot exceed 128 characters.'
    };
  }

  let validatedRole: Role | undefined;
  if (role !== undefined && role !== null) {
    if (typeof role !== 'string' || !['STUDENT', 'FACULTY', 'ADMIN'].includes(role)) {
      return {
        isValid: false,
        error: 'Invalid role specified. Permitted roles: STUDENT, FACULTY, ADMIN.'
      };
    }
    validatedRole = role as Role;
  }

  return {
    isValid: true,
    data: {
      identifier: trimmedIdentifier,
      password,
      role: validatedRole
    }
  };
}
