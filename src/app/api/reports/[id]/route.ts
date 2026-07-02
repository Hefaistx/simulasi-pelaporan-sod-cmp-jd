import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      createdBy: { select: { name: true } },
      confirmation: { include: { confirmedBy: { select: { name: true, role: true } } } },
      history: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!report) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  return NextResponse.json(report)
}
