import { SignJWT, jwtVerify } from 'jose';

let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (_secret) return _secret;
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET must be >=16 chars');
  _secret = new TextEncoder().encode(s);
  return _secret;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ email: payload.email, username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setSubject(payload.sub)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      email: payload['email'] as string,
      username: payload['username'] as string,
    };
  } catch {
    return null;
  }
}

// PBKDF2 SHA-256 edge-compatible (no bcryptjs which needs crypto.randomBytes node-specific).
const PBKDF2_ITERS = 120000;
const PBKDF2_KEYLEN = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    key, PBKDF2_KEYLEN * 8,
  );
  return new Uint8Array(bits);
}

/**
 * Returns hash string formatted as `pbkdf2$iters$saltHex$keyHex`.
 */
export async function hashPassword(pw: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const derived = await pbkdf2(pw, salt);
  return `pbkdf2$${PBKDF2_ITERS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iters = parseInt(parts[1], 10);
  if (!Number.isFinite(iters)) return false;
  const salt = hexToBytes(parts[2]);
  const expected = hexToBytes(parts[3]);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-256' },
    key, expected.length * 8,
  );
  const got = new Uint8Array(bits);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}
