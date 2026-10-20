import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment configuration from server directory .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminFirstName = process.env.INITIAL_ADMIN_FIRST_NAME?.trim() || 'System';
  const adminLastName = process.env.INITIAL_ADMIN_LAST_NAME?.trim() || 'Administrator';
  const adminCode = process.env.INITIAL_ADMIN_CODE?.trim() || 'ADM-001';

  if (!adminEmail || !adminPassword) {
    console.error(
      '[SEED ERROR] INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be configured in server/.env before running the seed script.'
    );
    process.exit(1);
  }

  console.log('[SEED] Checking database for existing administrator record...');

  // Safe idempotent check 1: Check if user exists by email
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingUserByEmail) {
    console.log(`[SEED INFO] An administrator with email "${adminEmail}" already exists. Skipping creation.`);
    return;
  }

  // Safe idempotent check 2: Check if admin profile exists by adminCode
  const existingAdminByCode = await prisma.adminProfile.findUnique({
    where: { adminCode }
  });

  if (existingAdminByCode) {
    console.log(`[SEED INFO] An administrator with code "${adminCode}" already exists. Skipping creation.`);
    return;
  }

  // Hash the initial administrator password using bcrypt with 12 salt rounds
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      adminProfile: {
        create: {
          adminCode,
          firstName: adminFirstName,
          lastName: adminLastName,
          department: 'Administration'
        }
      }
    },
    include: {
      adminProfile: true
    }
  });

  // Safe sanitized success log (never prints password or sensitive tokens)
  console.log(`[SEED SUCCESS] Initial administrator provisioned successfully.`);
  console.log(`[SEED SUCCESS] Account ID : ${admin.id}`);
  console.log(`[SEED SUCCESS] Admin Code : ${admin.adminProfile?.adminCode}`);
  console.log(`[SEED SUCCESS] Email      : ${admin.email}`);
  console.log(`[SEED SUCCESS] Role       : ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('[SEED ERROR] Seed execution failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
