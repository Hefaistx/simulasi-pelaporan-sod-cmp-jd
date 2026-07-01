import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Staff hanya bisa pilih properti mereka sendiri
  const where = session.role === 'STAFF' && session.propertyId
    ? { id: session.propertyId }
    : {}

  const properties = await prisma.property.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json(properties)
}
