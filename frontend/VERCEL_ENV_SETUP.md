# Vercel Environment Variables Setup

## Critical Environment Variables (Required for Basic Functionality)

### Database Connection
```bash
# PostgreSQL Database (Neon or other provider)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require&pgbouncer=true&connect_timeout=15"
```

### Amadeus Flight API
```bash
# Required for flight search functionality
AMADEUS_CLIENT_ID="your_amadeus_client_id"
AMADEUS_CLIENT_SECRET="your_amadeus_client_secret"
AMADEUS_ENVIRONMENT="test"  # or "production"
```

### Authentication Secrets
```bash
# Generate secure random strings (64+ characters)
# Use: openssl rand -base64 64
JWT_SECRET="your_secure_jwt_secret_here"
USER_AUTH_JWT_SECRET="your_secure_user_auth_secret_here"
ADMIN_JWT_SECRET="your_secure_admin_jwt_secret_here"
ENCRYPTION_KEY="your_secure_encryption_key_here"
```

## Optional Environment Variables (Recommended)

### Caching (Vercel KV)
```bash
# For better performance
KV_URL="redis://username:password@host:port"
KV_REST_API_URL="https://host/redis-rest-api"
KV_REST_API_TOKEN="your_kv_token"
KV_REST_API_READ_ONLY_TOKEN="your_readonly_token"
```

### Email Service (Resend)
```bash
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

### Application URLs
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_API_BASE_URL="https://your-app.vercel.app"
```

## Setting Up in Vercel Dashboard

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add each variable one by one:**
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environment: Production, Preview, Development (check all)

## Quick Setup Commands

### Generate Secure Secrets
```bash
# Generate JWT secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For USER_AUTH_JWT_SECRET
openssl rand -base64 64  # For ADMIN_JWT_SECRET
openssl rand -base64 64  # For ENCRYPTION_KEY
```

### Test Environment Variables
After setting up, you can test by checking the Vercel function logs:
1. Deploy your application
2. Visit the app URL
3. Check Vercel Functions logs for any missing environment variable errors

## Common Issues & Solutions

### ❌ "Amadeus API credentials not configured"
**Solution:** Set `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`

### ❌ Database connection errors
**Solution:** Verify `DATABASE_URL` is correct and database is accessible

### ❌ JWT token validation failures
**Solution:** Ensure `JWT_SECRET` is set and matches across all environments

### ❌ Admin panel not accessible
**Solution:** Create an admin user after setting up `ADMIN_JWT_SECRET`

## Environment-Specific Notes

### Development
- Can use test Amadeus credentials
- Local PostgreSQL or Neon development database
- Simpler JWT secrets for testing

### Production
- Must use production Amadeus credentials
- Production-grade database with backups
- Strong, unique JWT secrets
- Enable all monitoring and logging

## Security Best Practices

1. **Never commit secrets to git**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use Vercel's encrypted environment variables**
5. **Limit access to production environment variables**

## Vercel KV Setup (Optional but Recommended)

1. **Enable Vercel KV in your project**
2. **Vercel will automatically provide KV environment variables**
3. **No manual setup required - variables are injected automatically**

## Testing Your Setup

After configuring environment variables:

1. **Deploy to Vercel**
2. **Check application loads without immediate errors**
3. **Test flight search functionality**
4. **Verify admin panel access (after creating admin user)**
5. **Monitor Vercel function logs for any remaining issues**

## Creating First Admin User

Once environment variables are set, you'll need to create an admin user:

```sql
-- Connect to your database and run:
INSERT INTO "User" (id, email, "passwordHash", role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  '$2b$10$hashedpasswordhere',  -- Use bcrypt to hash your password
  'admin',
  true,
  NOW(),
  NOW()
);
```

Or use the admin creation script if available in your deployment.