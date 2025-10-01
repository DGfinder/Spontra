# Runtime Error Troubleshooting Guide

## Most Common Errors & Quick Fixes

### 🔴 Immediate Page Crashes

#### ✅ FIXED: ErrorBoundary Export Errors
**Error**: `SearchFormErrorBoundary is not exported`
**Status**: ✅ Fixed in latest commit
**Solution**: Specialized error boundaries are now properly exported

### 🔴 Environment Variable Issues

#### DATABASE_URL Missing
**Error**: `Database connection failed` or `Prisma client initialization failed`
**Quick Fix**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `DATABASE_URL=postgresql://...` (get from Neon or your DB provider)
3. Redeploy

#### Amadeus API Credentials Missing
**Error**: `Amadeus API credentials not configured`
**Impact**: Flight search functionality completely broken
**Quick Fix**:
1. Add `AMADEUS_CLIENT_ID=your_client_id`
2. Add `AMADEUS_CLIENT_SECRET=your_client_secret`
3. Add `AMADEUS_ENVIRONMENT=test` (or production)

#### JWT Secrets Missing
**Error**: Authentication failures, admin panel inaccessible
**Quick Fix**:
```bash
# Generate with: openssl rand -base64 64
JWT_SECRET=long_random_string_here
ADMIN_JWT_SECRET=another_long_random_string
USER_AUTH_JWT_SECRET=third_long_random_string
```

### 🟡 API & Database Issues

#### Flight Search Not Working
**Possible Causes**:
1. Amadeus API rate limiting (2 requests/second)
2. Invalid API credentials
3. Network connectivity issues

**Debug Steps**:
1. Check Vercel function logs for API errors
2. Verify Amadeus credentials in environment variables
3. Test with simple airport codes (LAX, JFK, LHR)

#### Admin Panel Inaccessible
**Symptoms**: 401/403 errors, login fails
**Solutions**:
1. Ensure `ADMIN_JWT_SECRET` is set
2. Create first admin user via database:
```sql
INSERT INTO "User" (id, email, "passwordHash", role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  '$2b$10$example_hashed_password',
  'admin',
  true,
  NOW(),
  NOW()
);
```

#### Database Connection Timeouts
**Symptoms**: Slow page loads, timeout errors
**Solutions**:
1. Verify database is active and accessible
2. Check connection string format
3. Ensure serverless database can handle connections

### 🟡 Performance Issues

#### Slow Cache Performance
**Issue**: Missing `KV_URL` causes fallback to memory cache
**Impact**: Cache lost on each serverless cold start
**Solution**: Enable Vercel KV in project settings (automatic setup)

#### Memory Usage Warnings
**Cause**: Large in-memory cache when KV unavailable
**Solution**: Set up Vercel KV or increase function memory limit

### 🟢 Minor UI Issues

#### Theme Switching Problems
**Symptoms**: Colors/styling inconsistent
**Debug**: Check browser console for CSS loading errors

#### Mobile Layout Issues
**Symptoms**: Poor mobile responsiveness
**Debug**: Test on actual devices, check Tailwind CSS compilation

## Debugging Tools & Techniques

### 1. Vercel Function Logs
- Go to Vercel Dashboard → Functions tab
- Click on any function to see real-time logs
- Look for `console.error` outputs from our error handling

### 2. Browser Console
- Open DevTools → Console tab
- Look for JavaScript errors, network failures
- Check Network tab for failed API requests

### 3. Environment Variable Verification
```javascript
// Add to any page temporarily to debug
console.log('Environment check:', {
  hasDatabase: !!process.env.DATABASE_URL,
  hasAmadeus: !!process.env.AMADEUS_CLIENT_ID,
  hasJWT: !!process.env.JWT_SECRET
});
```

### 4. Health Check Endpoints
Test these URLs to verify functionality:
- `/api/health` - Basic app health (if implemented)
- `/api/admin/auth/login` - Admin authentication
- Any flight search API endpoint

## Emergency Rollback Plan

If the MVP has critical issues:

1. **Revert to Previous Working State**:
   ```bash
   git checkout main
   git push origin main --force
   ```

2. **Quick Environment Setup**:
   - Copy all environment variables from working deployment
   - Focus on critical ones first: DATABASE_URL, AMADEUS_*, JWT_SECRET

3. **Minimal Feature Set**:
   - Disable problematic features temporarily
   - Focus on core: home page, basic search, admin login

## Monitoring Without Full Telemetry

Since we removed Sentry/monitoring for MVP:

### Console-Based Monitoring
```javascript
// Monitor key metrics in console
console.log('Search performed:', { origin, destination, timestamp: Date.now() });
console.error('Error caught:', error.message, { context: 'flight-search' });
```

### Vercel Analytics (Built-in)
- Enable Web Analytics in Vercel dashboard
- Provides basic page views, performance metrics
- No code changes required

### Manual Error Tracking
- Monitor Vercel function logs regularly
- Set up simple alerting via Vercel notifications
- Create a simple error dashboard if needed

## Success Indicators

✅ **App Loads Successfully**
- Home page renders without crashes
- No immediate console errors
- Error boundaries working properly

✅ **Core Functionality Working**
- Flight search returns results (even if limited)
- Admin panel accessible (after user creation)
- Navigation between pages works

✅ **Graceful Error Handling**
- API failures show user-friendly messages
- Network issues don't crash the app
- Error boundaries catch and display errors properly

## Next Steps After Stable MVP

1. **Gradually Re-enable Monitoring**:
   - Add Sentry back with minimal configuration
   - Enable performance tracking
   - Set up error alerting

2. **Optimize Performance**:
   - Implement proper caching strategy
   - Add database query optimization
   - Enable CDN for static assets

3. **Enhance Error Handling**:
   - Add retry mechanisms for API calls
   - Implement offline functionality
   - Add more granular error boundaries

4. **Scale Infrastructure**:
   - Database connection pooling
   - API rate limiting
   - Load balancing if needed