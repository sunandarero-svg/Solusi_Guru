import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
    { level: 'query', emit: 'event' },
  ],
})

// Log slow queries (> 2000ms) which might happen during high concurrent load
if (!globalForPrisma.prisma) {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 2000) {
      console.warn(`[PRISMA SLOW QUERY] ${e.query} took ${e.duration}ms`)
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
