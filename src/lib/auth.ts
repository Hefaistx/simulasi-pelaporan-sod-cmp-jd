import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret-32-chars-minimum!!')

export type JWTPayload = {
  sub: string       // user id
  name: string
  email: string
  role: 'STAFF' | 'HEAD_OUTLET'
  propertyId: string | null
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = cookies().get('sod_token')?.value
  if (!token) return null
  return verifyToken(token)
}
