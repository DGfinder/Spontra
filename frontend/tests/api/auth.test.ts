/**
 * Authentication API Integration Tests
 * Tests the complete auth flow with real Neon database integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as signupPOST } from '@/app/api/auth/signup/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { GET as mePOST } from '@/app/api/auth/me/route'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

describe('Authentication API Integration Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@spontra.com`,
    password: 'testPassword123!',
    firstName: 'Test',
    lastName: 'User',
    username: `testuser${Date.now()}`
  }

  let sessionCookie: string | undefined
  let userId: string | undefined

  // Cleanup function to remove test data
  afterAll(async () => {
    if (userId) {
      // Clean up test user and sessions
      await prisma.userSession.deleteMany({
        where: { userId }
      })
      await prisma.user.delete({
        where: { id: userId }
      })
    }
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testUser),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testUser.email)
      expect(data.user.firstName).toBe(testUser.firstName)
      expect(data.user.lastName).toBe(testUser.lastName)
      expect(data.user.username).toBe(testUser.username)
      expect(data.token).toBeDefined()
      expect(data.expiresAt).toBeDefined()

      // Store for later tests
      userId = data.user.id
      sessionCookie = response.headers.get('Set-Cookie')
      
      console.log('✅ User registered successfully:', {
        userId: data.user.id,
        email: data.user.email,
        hasSessionCookie: !!sessionCookie
      })
    })

    it('should reject duplicate email registration', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testUser),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.ok).toBe(false)
      expect(data.error).toContain('already exists')
      
      console.log('✅ Duplicate email properly rejected')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123' // Too short
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
      expect(Array.isArray(data.details)).toBe(true)
      
      console.log('✅ Input validation working correctly')
    })
  })

  describe('Database Persistence', () => {
    it('should verify user is stored in Neon database', async () => {
      if (!userId) {
        throw new Error('User ID not available from registration test')
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      expect(dbUser).toBeDefined()
      expect(dbUser?.email).toBe(testUser.email)
      expect(dbUser?.firstName).toBe(testUser.firstName)
      expect(dbUser?.lastName).toBe(testUser.lastName)
      expect(dbUser?.username).toBe(testUser.username)
      expect(dbUser?.passwordHash).toBeDefined()
      expect(dbUser?.isEmailVerified).toBe(false) // Default value
      expect(dbUser?.createdAt).toBeDefined()
      
      console.log('✅ User data properly stored in Neon database')
    })

    it('should verify password is properly hashed', async () => {
      if (!userId) {
        throw new Error('User ID not available')
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      expect(dbUser?.passwordHash).toBeDefined()
      expect(dbUser?.passwordHash).not.toBe(testUser.password) // Should be hashed, not plain text
      
      // Verify password can be verified with bcrypt
      const isValidPassword = await verifyPassword(testUser.password, dbUser!.passwordHash)
      expect(isValidPassword).toBe(true)
      
      console.log('✅ Password properly hashed with bcrypt')
    })

    it('should verify session is stored in database', async () => {
      if (!userId) {
        throw new Error('User ID not available')
      }

      const sessions = await prisma.userSession.findMany({
        where: { userId }
      })

      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions[0].sessionToken).toBeDefined()
      expect(sessions[0].expiresAt).toBeDefined()
      expect(sessions[0].createdAt).toBeDefined()
      
      console.log('✅ Session properly stored in database')
    })
  })

  describe('User Login', () => {
    it('should successfully login with correct credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testUser.email)
      expect(data.token).toBeDefined()
      expect(data.expiresAt).toBeDefined()

      // Update session cookie for logout test
      sessionCookie = response.headers.get('Set-Cookie')
      
      console.log('✅ Login successful with correct credentials')
    })

    it('should reject login with incorrect password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongPassword123!',
          rememberMe: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.ok).toBe(false)
      expect(data.error).toContain('Invalid email or password')
      
      console.log('✅ Incorrect password properly rejected')
    })

    it('should reject login with non-existent email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@spontra.com',
          password: 'anyPassword123!',
          rememberMe: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.ok).toBe(false)
      expect(data.error).toContain('Invalid email or password')
      
      console.log('✅ Non-existent email properly rejected')
    })

    it('should update lastLoginAt timestamp', async () => {
      if (!userId) {
        throw new Error('User ID not available')
      }

      const userBefore = await prisma.user.findUnique({
        where: { id: userId }
      })

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await loginPOST(request)

      const userAfter = await prisma.user.findUnique({
        where: { id: userId }
      })

      expect(userAfter?.lastLoginAt).toBeDefined()
      expect(userAfter?.lastLoginAt?.getTime()).toBeGreaterThan(
        userBefore?.lastLoginAt?.getTime() || 0
      )
      
      console.log('✅ Last login timestamp properly updated')
    })
  })

  describe('User Logout', () => {
    it('should successfully logout and clear session', async () => {
      if (!sessionCookie) {
        throw new Error('Session cookie not available from login test')
      }

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie
        }
      })

      const response = await logoutPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Logged out successfully')

      // Verify session cookie is cleared
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeDefined()
      expect(setCookieHeader).toContain('Max-Age=0')
      
      console.log('✅ Logout successful, session cleared')
    })

    it('should remove session from database', async () => {
      if (!userId) {
        throw new Error('User ID not available')
      }

      // Check that sessions have been cleaned up
      const remainingSessions = await prisma.userSession.findMany({
        where: { userId }
      })

      // Note: Sessions should be deleted from database after logout
      expect(remainingSessions.length).toBe(0)
      
      console.log('✅ Database sessions properly cleaned up')
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete full signup -> login -> logout cycle', async () => {
      const cycleUser = {
        email: `cycle-test-${Date.now()}@spontra.com`,
        password: 'cycleTest123!',
        firstName: 'Cycle',
        lastName: 'Test'
      }

      // 1. Register
      const signupRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(cycleUser),
        headers: { 'Content-Type': 'application/json' }
      })

      const signupResponse = await signupPOST(signupRequest)
      const signupData = await signupResponse.json()
      
      expect(signupResponse.status).toBe(200)
      expect(signupData.ok).toBe(true)

      const cycleUserId = signupData.user.id
      const signupCookie = signupResponse.headers.get('Set-Cookie')

      // 2. Login
      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cycleUser.email,
          password: cycleUser.password,
          rememberMe: false
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const loginResponse = await loginPOST(loginRequest)
      const loginData = await loginResponse.json()
      
      expect(loginResponse.status).toBe(200)
      expect(loginData.ok).toBe(true)

      const loginCookie = loginResponse.headers.get('Set-Cookie')

      // 3. Logout
      const logoutRequest = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Cookie': loginCookie || '' }
      })

      const logoutResponse = await logoutPOST(logoutRequest)
      const logoutData = await logoutResponse.json()
      
      expect(logoutResponse.status).toBe(200)
      expect(logoutData.ok).toBe(true)

      // Cleanup test user
      await prisma.userSession.deleteMany({ where: { userId: cycleUserId } })
      await prisma.user.delete({ where: { id: cycleUserId } })
      
      console.log('✅ Complete authentication cycle successful')
    })
  })
})