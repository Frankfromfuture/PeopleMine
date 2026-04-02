import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

if (!globalForPrisma.prisma) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 3,
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  })
  pool.on('error', (err) => {
    console.error('[pg pool] connection error:', err.message)
  })
  const adapter = new PrismaPg(pool)
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma
