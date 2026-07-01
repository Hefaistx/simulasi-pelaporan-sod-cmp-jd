import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateReportCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const propertyId = searchParams.get('propertyId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const createdById = searchParams.get('createdById')

  const where: Record<string, unknown> = {}

  // Staff hanya lihat laporan properti mereka sendiri
  if (session.role === 'STAFF' && session.propertyId) {
    where.propertyId = session.propertyId
  }
  if (propertyId) where.propertyId = propertyId
  if (status && status !== 'semua') where.status = status.toUpperCase()
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

  const reports = await prisma.report.findMany({
    where,
    include: {
      property: true,
      createdBy: { select: { name: true } },
      confirmation: { include: { confirmedBy: { select: { name: true } } } },
      history: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'STAFF') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { propertyId, description, photoUrl, denahId, denahCellR, denahCellC } = body

  if (!propertyId || !description) {
    return NextResponse.json({ error: 'propertyId dan description wajib diisi' }, { status: 400 })
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })

  const count = await prisma.report.count({ where: { propertyId } })
  const code = generateReportCode(property.code, count)

  const report = await prisma.report.create({
    data: {
      code,
      propertyId,
      description,
      photoUrl: photoUrl ?? null,
      denahId: denahId || null,
      denahCellR: denahCellR ?? null,
      denahCellC: denahCellC ?? null,
      status: 'MENUNGGU',
      createdById: session.sub,
      history: {
        create: { action: 'Laporan dibuat', userId: session.sub },
      },
    },
    include: {
      property: true,
      createdBy: { select: { name: true } },
      history: { include: { user: { select: { name: true } } } },
    },
  })

  return NextResponse.json(report, { status: 201 })
}
