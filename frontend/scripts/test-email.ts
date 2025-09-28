#!/usr/bin/env tsx

import { emailService } from '../src/lib/resendService'

async function testEmailService() {
  console.log('🧪 Testing Resend Email Service...\n')

  // Health check
  console.log('1. Checking email service health...')
  const healthCheck = await emailService.healthCheck()
  console.log(`   Status: ${healthCheck.success ? '✅ Healthy' : '❌ Unhealthy'}`)
  console.log(`   Message: ${healthCheck.message}\n`)

  if (!healthCheck.success) {
    console.log('❌ Email service is not properly configured. Please check your environment variables:')
    console.log('   - RESEND_API_KEY')
    console.log('   - RESEND_FROM_EMAIL (optional, defaults to noreply@spontra.com)')
    process.exit(1)
  }

  // Test email addresses - change these for actual testing
  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  
  if (testEmail === 'test@example.com') {
    console.log('⚠️  Using default test email. Set TEST_EMAIL environment variable for actual testing.')
  }

  console.log(`📧 Testing with email: ${testEmail}\n`)

  // Test password reset email
  console.log('2. Testing password reset email...')
  const resetResult = await emailService.sendPasswordResetEmail(testEmail, 'test-reset-token-123')
  console.log(`   Status: ${resetResult.success ? '✅ Sent' : '❌ Failed'}`)
  if (resetResult.error) {
    console.log(`   Error: ${resetResult.error}`)
  }
  if (resetResult.messageId) {
    console.log(`   Message ID: ${resetResult.messageId}`)
  }
  console.log()

  // Test welcome email
  console.log('3. Testing welcome email...')
  const welcomeResult = await emailService.sendWelcomeEmail(testEmail, 'Test User')
  console.log(`   Status: ${welcomeResult.success ? '✅ Sent' : '❌ Failed'}`)
  if (welcomeResult.error) {
    console.log(`   Error: ${welcomeResult.error}`)
  }
  if (welcomeResult.messageId) {
    console.log(`   Message ID: ${welcomeResult.messageId}`)
  }
  console.log()

  // Test password change notification
  console.log('4. Testing password change notification...')
  const changeResult = await emailService.sendPasswordChangeNotification(testEmail, 'Test User')
  console.log(`   Status: ${changeResult.success ? '✅ Sent' : '❌ Failed'}`)
  if (changeResult.error) {
    console.log(`   Error: ${changeResult.error}`)
  }
  if (changeResult.messageId) {
    console.log(`   Message ID: ${changeResult.messageId}`)
  }
  console.log()

  console.log('🎉 Email service testing completed!')
  
  // Summary
  const results = [resetResult, welcomeResult, changeResult]
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log(`\n📊 Summary: ${successCount}/${totalCount} emails sent successfully`)
  
  if (successCount === totalCount) {
    console.log('✅ All email tests passed!')
  } else {
    console.log('⚠️  Some email tests failed. Check your Resend configuration.')
  }
}

// Run the test
testEmailService().catch((error) => {
  console.error('❌ Email service test failed:', error)
  process.exit(1)
})