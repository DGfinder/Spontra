# Airport Autosearch Debug Guide

## Quick Diagnosis

### Step 1: Check Debug Endpoint
Visit: `/api/debug/airport-search` to get diagnostic information including:
- Database connection status
- Environment configuration
- pg module loading status
- Airport count in database

### Step 2: Check Browser Network Tab
1. Open browser dev tools (F12)
2. Go to Network tab
3. Type in airport search field
4. Look for requests to `/api/airports/search`
5. Check response status and content

### Step 3: Check Server Logs
Look for these log patterns:
- ✅ Successfully loaded real pg module
- ⚠️ Failed to load pg module, using mock client
- 🔌 Attempting database connection...
- ✅ Database connected successfully
- ❌ Airport search error

## Common Issues & Solutions

### Issue 1: "No results" for all searches
**Symptoms:** Autosearch returns empty dropdown for any input
**Cause:** Database connection issues or empty database
**Debug:**
1. Check `/api/debug/airport-search` - look for `databaseTest` status
2. Verify `isPgMocked` is false
3. Check `airportsCount` is > 0

**Solutions:**
- Verify DATABASE_URL environment variable is set
- Check database connectivity from deployment environment
- Ensure airports table is populated

### Issue 2: "Airport search temporarily unavailable"
**Symptoms:** Error message in autosearch
**Cause:** pg module failed to load or database connection failed
**Debug:**
1. Check if `isPgMocked` is true in debug endpoint
2. Look for "Failed to load pg module" in logs
3. Check database connection errors

**Solutions:**
- Verify pg dependency is properly installed
- Check webpack configuration for pg module handling
- Verify database credentials and network access

### Issue 3: Slow or hanging autosearch
**Symptoms:** Long delays before results appear
**Cause:** Database performance or connection issues
**Debug:**
1. Check `performance.queryTimeMs` in API responses
2. Look for database timeout errors
3. Check database connection pool settings

**Solutions:**
- Optimize database queries
- Add connection pooling
- Check database server performance

### Issue 4: Build/deployment errors
**Symptoms:** App fails to build or deploy
**Cause:** pg module bundling issues
**Debug:**
1. Check Next.js build logs
2. Look for webpack errors related to pg
3. Verify next.config.js webpack configuration

**Solutions:**
- Update next.config.js webpack externals
- Use dynamic imports for database modules
- Configure serverComponentsExternalPackages

## Environment Variables Required

```bash
# Database connection (one of these required)
DATABASE_URL=postgresql://user:password@host:port/database
SEARCH_DATABASE_URL=postgresql://user:password@host:port/database

# For debugging
NODE_ENV=development|production
```

## Testing Locally

1. Start the development server: `npm run dev`
2. Visit `/api/debug/airport-search` to verify setup
3. Test autosearch on search form
4. Check browser console for errors
5. Check server console for diagnostic logs

## Production Deployment Checklist

- [ ] DATABASE_URL environment variable configured
- [ ] pg dependency installed in production
- [ ] Airport data populated in database
- [ ] Network access to database from deployment platform
- [ ] Proper Next.js configuration for external packages