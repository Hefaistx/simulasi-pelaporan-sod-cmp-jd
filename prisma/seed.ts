import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Properties
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

  const hash = (p: string) => bcrypt.hashSync(p, 10)

  // Staff Campagna
  await prisma.user.upsert({
    where: { email: 'staff.campagna@dparagon.com' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'staff.campagna@dparagon.com',
      password: hash('password123'),
      role: 'STAFF',
      propertyId: campagna.id,
    },
  })

  // Staff Jede
  await prisma.user.upsert({
    where: { email: 'staff.jede@dparagon.com' },
    update: {},
    create: {
      name: 'Dewi Anggraini',
      email: 'staff.jede@dparagon.com',
      password: hash('password123'),
      role: 'STAFF',
      propertyId: jede.id,
    },
  })

  // Head Outlet (akses ke semua properti)
  const head = await prisma.user.upsert({
    where: { email: 'head@dparagon.com' },
    update: {},
    create: {
      name: 'Rizal (Head Outlet)',
      email: 'head@dparagon.com',
      password: hash('password123'),
      role: 'HEAD_OUTLET',
    },
  })

  // Sample reports
  const staff = await prisma.user.findFirst({ where: { email: 'staff.campagna@dparagon.com' } })
  if (!staff) return

  const codeExists = await prisma.report.findUnique({ where: { code: 'CPG/SOD/26/06/003' } })
  if (!codeExists) {
    const r = await prisma.report.create({
      data: {
        code: 'CPG/SOD/26/06/003',
        propertyId: campagna.id,
        description: 'Lampu koridor lantai 2 mati total.',
        denahId: '492322',
        denahCellR: 8,
        denahCellC: 6,
        status: 'SELESAI',
        createdById: staff.id,
        history: {
          create: { action: 'Laporan dibuat', userId: staff.id },
        },
      },
    })
    await prisma.reportConfirmation.create({
      data: {
        reportId: r.id,
        description: 'Lampu sudah diganti dengan unit baru dari gudang.',
        confirmedById: head.id,
      },
    })
    await prisma.reportHistory.create({
      data: { reportId: r.id, action: 'Dikonfirmasi Selesai', userId: head.id },
    })
  }

  const code2Exists = await prisma.report.findUnique({ where: { code: 'CPG/SOD/27/06/001' } })
  if (!code2Exists) {
    await prisma.report.create({
      data: {
        code: 'CPG/SOD/27/06/001',
        propertyId: campagna.id,
        description: 'Cat dinding kamar 101 terkelupas di area dekat pintu masuk, sekitar 30cm x 20cm.',
        denahId: '492321',
        denahCellR: 3,
        denahCellC: 3,
        status: 'MENUNGGU',
        createdById: staff.id,
        history: {
          create: { action: 'Laporan dibuat', userId: staff.id },
        },
      },
    })
  }

  console.log('✅ Seed selesai')
}

main().catch(console.error).finally(() => prisma.$disconnect())
