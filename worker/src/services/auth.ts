import { sign, verify } from 'hono/jwt';
import type { Context } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { JWTPayload } from '../types';

/**
 * Encodes an ArrayBuffer or Uint8Array to standard Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Constant-time comparison between two strings
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates a random alphanumeric salt string
 */
function generateSalt(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars[array[i] % chars.length];
  }
  return salt;
}

/**
 * Derives PBKDF2-SHA256 bits using Web Crypto API
 */
async function derivePbkdf2Sha256(password: string, salt: string, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: iterations,
      hash: 'SHA-256',
    },
    passKey,
    256 // 32 bytes = 256 bits
  );

  return bufferToBase64(derivedBits);
}

/**
 * Creates a Django-compatible PBKDF2-SHA256 password hash:
 * pbkdf2_sha256$<iterations>$<salt>$<hash>
 */
export async function hashPassword(password: string): Promise<string> {
  const iterations = 600000;
  const salt = generateSalt(12);
  const hash = await derivePbkdf2Sha256(password, salt, iterations);
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

/**
 * Verifies a password against a Django-compatible password hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
    // Unsupported or malformed hash format
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHash = parts[3];

  // Reject malformed or unexpectedly expensive hashes before deriving bits.
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 2000000 || !salt || !expectedHash) {
    return false;
  }

  const computedHash = await derivePbkdf2Sha256(password, salt, iterations);
  return timingSafeEqual(computedHash, expectedHash);
}

/**
 * Secrets must be supplied by the runtime. Never fall back to a public value.
 */
export function getJwtSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return secret;
}

export function getCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setRefreshCookie(c: Context, token: string | null): void {
  const value = token ? `refresh_token=${encodeURIComponent(token)}; ` : 'refresh_token=; ';
  const expiry = token ? '' : 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ';
  const hostname = new URL(c.req.url).hostname;
  const secure = hostname === 'localhost' || hostname === '127.0.0.1' ? '' : 'Secure; ';
  c.header(
    'Set-Cookie',
    `${value}${expiry}HttpOnly; ${secure}SameSite=Lax; Path=/api/token`
  );
}

/**
 * Validates an access token and confirms that its account still exists and is active.
 */
export async function authenticateAccessToken(
  authHeader: string | undefined,
  secret: string,
  supabase: SupabaseClient
): Promise<number | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const payload = await verifyToken(token, secret);
  if (
    !payload ||
    payload.token_type !== 'access' ||
    !Number.isInteger(payload.user_id) ||
    payload.user_id <= 0 ||
    typeof payload.username !== 'string' ||
    !payload.username
  ) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('auth_user')
    .select('id, username, is_active')
    .eq('id', payload.user_id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !user || user.username !== payload.username) {
    return null;
  }

  return user.id;
}

/**
 * Generates JWT Access and Refresh tokens compatible with Django SimpleJWT
 */
export async function generateTokens(
  userId: number,
  username: string,
  secret: string
): Promise<{ access: string; refresh: string }> {
  const now = Math.floor(Date.now() / 1000);
  const accessExp = now + 60 * 60 * 24;      // 1 day
  const refreshExp = now + 60 * 60 * 24 * 7;  // 7 days

  const accessPayload: JWTPayload = {
    user_id: userId,
    username: username,
    token_type: 'access',
    exp: accessExp,
    iat: now,
    jti: crypto.randomUUID().replace(/-/g, ''),
  };

  const refreshPayload: JWTPayload = {
    user_id: userId,
    username: username,
    token_type: 'refresh',
    exp: refreshExp,
    iat: now,
    jti: crypto.randomUUID().replace(/-/g, ''),
  };

  const access = await sign(accessPayload, secret, 'HS256');
  const refresh = await sign(refreshPayload, secret, 'HS256');

  return { access, refresh };
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as JWTPayload;
    if (
      !payload ||
      !Number.isInteger(payload.user_id) ||
      payload.user_id <= 0 ||
      typeof payload.username !== 'string' ||
      !payload.username ||
      (payload.token_type !== 'access' && payload.token_type !== 'refresh') ||
      !Number.isInteger(payload.exp) ||
      !Number.isInteger(payload.iat) ||
      typeof payload.jti !== 'string' ||
      !payload.jti
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
