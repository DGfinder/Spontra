import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a default admin user for testing
  const adminEmail = 'admin@spontra.com'
  const adminPassword = await hashPassword('Admin123!')

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      isActive: true,
      isEmailVerified: true,
      preferences: JSON.stringify({
        preferredCabinClass: 'BUSINESS',
        currency: 'USD',
        language: 'en',
        newsletter: false
      })
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create a test user
  const testEmail = 'test@spontra.com'
  const testPassword = await hashPassword('Test123!')

  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      passwordHash: testPassword,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      isActive: true,
      isEmailVerified: true,
      preferences: JSON.stringify({
        preferredCabinClass: 'ECONOMY',
        currency: 'USD',
        language: 'en',
        newsletter: true
      })
    }
  })

  console.log('✅ Created test user:', testUser.email)

  // Clean up expired sessions
  const deletedSessions = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })

  console.log(`🧹 Cleaned up ${deletedSessions.count} expired sessions`)

  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })