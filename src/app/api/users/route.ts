import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where: Record<string, unknown> = { role: 'STAFF' }
  if (session.role === 'STAFF' && session.propertyId) {
    where.propertyId = session.propertyId
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}
