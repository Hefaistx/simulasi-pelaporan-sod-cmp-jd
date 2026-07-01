import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const createdById = searchParams.get('createdById')

  const where: Record<string, unknown> = {}
  if (session.role === 'STAFF' && session.propertyId) {
    where.propertyId = session.propertyId
  }
  if (propertyId) where.propertyId = propertyId
  if (createdById) where.createdById = createdById

  if (startDate || endDate) {
    const dateFilter: { gte?: Date; lt?: Date } = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      dateFilter.lt = end
    }
    where.createdAt = dateFilter
  }

  const [total, menunggu, selesai] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: 'MENUNGGU' } }),
    prisma.report.count({ where: { ...where, status: 'SELESAI' } }),
  ])

  return NextResponse.json({ total, menunggu, selesai })
}
