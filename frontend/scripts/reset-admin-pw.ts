import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const p = new PrismaClient()
const NEW_PASSWORD = 'Spontra2026!'
const EMAIL = 'hayden.george.hamilton@gmail.com'

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 12)
  await p.$executeRaw`UPDATE users SET password_hash = ${hash} WHERE email = ${EMAIL}`
  console.log(`✅ Password reset for ${EMAIL}`)
  console.log(`   New password: ${NEW_PASSWORD}`)
}
main().catch(console.error).finally(() => p.$disconnect())
