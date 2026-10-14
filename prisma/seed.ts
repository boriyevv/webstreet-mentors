import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const login = process.env.ADMIN_LOGIN || '904435567';
  const password = process.env.ADMIN_PASSWORD || '904435567';
  const exists = await prisma.user.findUnique({ where: { login } });
  if (!exists) {
    await prisma.user.create({
      data: { role: 'ADMIN', login, phone: login, fullName: 'Administrator', passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log('Admin yaratildi:', login);
  } else {
    console.log('Admin mavjud:', login);
  }
  const defaults: Record<string, string> = {
    centerLat: '38.871090',
    centerLng: '65.800123',
    radius: '300',
    centerName: 'Web Street IT Academy',
    address: 'Qizil Masjid Street, 2/6, Chaqar Mahallah, Karshi, Kashkadarya Region',
    graceMin: '5',
    earlyWindowMin: '30',
    earlyLeaveMin: '10',
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}
main().finally(() => prisma.$disconnect());
