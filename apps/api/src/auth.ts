import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const secret = (() => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET must be >=16 chars');
  return new TextEncoder().encode(s);
})();

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setSubject(payload.sub)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload['email'] as string,
      username: payload['username'] as string,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(pw: string): Promise<string> {
  return await bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pw, hash);
}
