import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
  }

  const token = await signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    propertyId: user.propertyId,
  })

  const res = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } })
  res.cookies.set('sod_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
