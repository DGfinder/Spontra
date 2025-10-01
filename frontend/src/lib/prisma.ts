// Re-export optimized Vercel database configuration
import { prisma as dbPrisma, checkDatabaseConnection as testDatabaseConnection, disconnectDatabase as disconnectPrisma } from './db'

export { testDatabaseConnection, disconnectPrisma }
export const prisma = dbPrisma

// Legacy compatibility
export default prisma