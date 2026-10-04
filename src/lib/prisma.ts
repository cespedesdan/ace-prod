import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const testDatabaseUrl = process.env.ACE_ISOLATED_TESTS === 'true' ? process.env.ACE_TEST_DATABASE_URL : undefined
if (process.env.ACE_ISOLATED_TESTS === 'true' && !testDatabaseUrl) {
  throw new Error('Os testes exigem um banco temporário explícito.')
}
export const prisma = globalForPrisma.prisma ?? new PrismaClient(
  testDatabaseUrl ? { datasourceUrl: testDatabaseUrl } : undefined,
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
