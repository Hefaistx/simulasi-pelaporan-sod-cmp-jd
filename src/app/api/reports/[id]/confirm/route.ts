import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'HEAD_OUTLET') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { description, photoUrl } = await req.json()
  if (!description) return NextResponse.json({ error: 'Deskripsi wajib diisi' }, { status: 400 })

  const report = await prisma.report.findUnique({ where: { id: params.id } })
  if (!report) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (report.status !== 'MENUNGGU') {
    return NextResponse.json({ error: 'Laporan sudah selesai' }, { status: 409 })
  }

  try {
    const [updated] = await prisma.$transaction([
      prisma.report.update({
        where: { id: params.id },
        data: { status: 'SELESAI' },
      }),
      prisma.reportConfirmation.create({
        data: { reportId: params.id, description, photoUrl: photoUrl ?? null, confirmedById: session.sub },
      }),
      prisma.reportHistory.create({
        data: { reportId: params.id, action: 'Dikonfirmasi Selesai', userId: session.sub },
      }),
    ])
    return NextResponse.json(updated)
  } catch (e) {
    console.error('[confirm error]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
