import { prisma } from './prisma'
import { hashPassword, verifyPassword } from './password'
import type { User } from '@prisma/client'

export interface CreateUserData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
  preferences?: {
    preferredAirport?: string
    preferredCabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
    currency?: string
    language?: string
    newsletter?: boolean
  }
}

export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {}

export class UserRepository {
  async createUser(data: CreateUserData): Promise<UserWithoutPassword> {
    const hashedPassword = await hashPassword(data.password)
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        preferences: data.preferences ? JSON.stringify(data.preferences) : undefined,
      },
    })

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    })
  }

  async findUserById(id: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) return null

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
    })
  }

  async verifyUserPassword(email: string, password: string): Promise<{ user: UserWithoutPassword; isValid: boolean } | null> {
    const user = await this.findUserByEmail(email)
    
    if (!user) {
      return null
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user
    return { user: userWithoutPassword, isValid }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  }

  async updateUser(userId: string, data: Partial<CreateUserData>): Promise<UserWithoutPassword> {
    const updateData: any = {}

    if (data.email) updateData.email = data.email
    if (data.firstName) updateData.firstName = data.firstName
    if (data.lastName) updateData.lastName = data.lastName
    if (data.username) updateData.username = data.username
    if (data.preferences) updateData.preferences = JSON.stringify(data.preferences)
    if (data.password) updateData.passwordHash = await hashPassword(data.password)

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    return !!user
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    return !!user
  }

  // Session management
  async createSession(userId: string, sessionToken: string, expiresAt: Date, ipAddress?: string, userAgent?: string): Promise<void> {
    await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    })
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { sessionToken },
    })
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    })
  }

  async cleanupExpiredSessions(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  }

  // Convert database JSON to typed preferences
  parseUserPreferences(user: UserWithoutPassword): UserWithoutPassword & { 
    preferences?: {
      preferredAirport?: string
      preferredCabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
      currency?: string
      language?: string
      newsletter?: boolean
    }
  } {
    return {
      ...user,
      preferences: user.preferences ? JSON.parse(user.preferences as string) : undefined,
    }
  }
}

export const userRepository = new UserRepository()