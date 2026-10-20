import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';

import * as crypto from 'crypto';

export type TokenType = 'ACCESS' | 'REFRESH';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
  profileId?: string;
  tokenType: 'ACCESS';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenType: 'REFRESH';
  jti?: string;
}

export interface UserTokenInput {
  id: string;
  role: Role;
  email: string;
  profileId?: string;
}

/**
 * Signs a short-lived access token using JWT_ACCESS_SECRET
 */
export function signAccessToken(user: UserTokenInput): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    profileId: user.profileId,
    tokenType: 'ACCESS'
  };

  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as unknown as number,
    algorithm: 'HS256'
  };

  return jwt.sign(payload, config.jwt.accessSecret, options);
}

/**
 * Signs a long-lived refresh token using JWT_REFRESH_SECRET with a unique jti
 */
export function signRefreshToken(user: { id: string }): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    tokenType: 'REFRESH'
  };

  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as unknown as number,
    algorithm: 'HS256',
    jwtid: crypto.randomUUID()
  };

  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

/**
 * Verifies an access token and confirms its tokenType is 'ACCESS'
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const verifyOptions: VerifyOptions = {
    algorithms: ['HS256']
  };

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, verifyOptions) as AccessTokenPayload;

    if (!decoded || decoded.tokenType !== 'ACCESS') {
      throw new Error('Invalid token type: expected an access token');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verifies a refresh token and confirms its tokenType is 'REFRESH'
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const verifyOptions: VerifyOptions = {
    algorithms: ['HS256']
  };

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, verifyOptions) as RefreshTokenPayload;

    if (!decoded || decoded.tokenType !== 'REFRESH') {
      throw new Error('Invalid token type: expected a refresh token');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}
