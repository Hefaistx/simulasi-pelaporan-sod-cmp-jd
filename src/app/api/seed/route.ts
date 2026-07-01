import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/seed — jalankan sekali untuk isi data awal
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Tidak tersedia di production' }, { status: 403 })
  }

  const hash = (p: string) => bcrypt.hashSync(p, 10)

  const campagna = await prisma.property.upsert({
    where: { code: 'CPG' },
    update: {},
    create: { name: "D'PARAGON CAMPAGNA", code: 'CPG' },
  })
  const jede = await prisma.property.upsert({
    where: { code: 'JDE' },
    update: {},
    create: { name: "D'PARAGON JEDE", code: 'JDE' },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff.campagna@dparagon.com' },
    update: {},
    create: {
      name: 'Budi Santoso', email: 'staff.campagna@dparagon.com',
      password: hash('password123'), role: 'STAFF', propertyId: campagna.id,
    },
  })
  await prisma.user.upsert({
    where: { email: 'staff.jede@dparagon.com' },
    update: {},
    create: {
      name: 'Dewi Anggraini', email: 'staff.jede@dparagon.com',
      password: hash('password123'), role: 'STAFF', propertyId: jede.id,
    },
  })
  const head = await prisma.user.upsert({
    where: { email: 'head@dparagon.com' },
    update: {},
    create: {
      name: 'Rizal (Head Outlet)', email: 'head@dparagon.com',
      password: hash('password123'), role: 'HEAD_OUTLET',
    },
  })

  const exists = await prisma.report.findUnique({ where: { code: 'CPG/SOD/26/06/003' } })
  if (!exists) {
    const r = await prisma.report.create({
      data: {
        code: 'CPG/SOD/26/06/003', propertyId: campagna.id,
        description: 'Lampu koridor lantai 2 mati total.',
        denahId: '492322', denahCellR: 8, denahCellC: 6,
        status: 'SELESAI', createdById: staff.id,
        history: { create: { action: 'Laporan dibuat', userId: staff.id } },
      },
    })
    await prisma.reportConfirmation.create({
      data: { reportId: r.id, description: 'Lampu sudah diganti dari gudang.', confirmedById: head.id },
    })
    await prisma.reportHistory.create({
      data: { reportId: r.id, action: 'Dikonfirmasi Selesai', userId: head.id },
    })
  }

  const exists2 = await prisma.report.findUnique({ where: { code: 'CPG/SOD/27/06/001' } })
  if (!exists2) {
    await prisma.report.create({
      data: {
        code: 'CPG/SOD/27/06/001', propertyId: campagna.id,
        description: 'Cat dinding kamar 101 terkelupas di area dekat pintu masuk.',
        denahId: '492321', denahCellR: 3, denahCellC: 3,
        status: 'MENUNGGU', createdById: staff.id,
        history: { create: { action: 'Laporan dibuat', userId: staff.id } },
      },
    })
  }

  return NextResponse.json({
    ok: true,
    accounts: [
      { role: 'STAFF (Campagna)', email: 'staff.campagna@dparagon.com', password: 'password123' },
      { role: 'STAFF (Jede)',     email: 'staff.jede@dparagon.com',     password: 'password123' },
      { role: 'HEAD OUTLET',      email: 'head@dparagon.com',           password: 'password123' },
    ],
  })
}
