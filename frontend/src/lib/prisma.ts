// Re-export optimized Vercel database configuration
export { prisma, checkDatabaseConnection as testDatabaseConnection, disconnectDatabase as disconnectPrisma } from './db'

// Legacy compatibility
export default prisma