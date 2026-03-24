import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getConnectionString(): string {
  // TODO: Remove hardcoded URL once Railway env var injection is fixed
  return (
    process.env.DATABASE_URL ||
    'postgresql://postgres:lkPAjwJdYaNQciVyXnUmrJcFSfhASLgj@centerbeam.proxy.rlwy.net:14783/railway'
  );
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Keep backward-compatible export but lazy — client created on first property access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
