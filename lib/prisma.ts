import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getConnectionString(): string {
  // Read from process.env at call time (not module load time)
  // to ensure Railway-injected env vars are available
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.RAILWAY_SERVICE_POSTGRES_URL;

  if (!url) {
    const available = Object.keys(process.env)
      .filter(
        (k) =>
          k.includes('DATABASE') ||
          k.includes('POSTGRES') ||
          k.includes('PG'),
      )
      .join(', ');
    throw new Error(
      `No database connection string found. Set DATABASE_URL env var. ` +
        `Available DB-related vars: ${available || '(none)'}`,
    );
  }
  return url;
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
