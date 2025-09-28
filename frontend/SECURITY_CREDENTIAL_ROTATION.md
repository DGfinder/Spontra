# 🔐 Security Credential Rotation Guide

## ⚠️ IMMEDIATE ACTION REQUIRED

**DATABASE_URL was exposed in application logs. This represents a critical security breach.**

## 1. Database Security (IMMEDIATE)

### Step 1: Rotate Neon Database Password
```bash
# 1. Login to Neon Console (neon.tech)
# 2. Navigate to your project: ep-frosty-cloud-a7tiov8j
# 3. Go to Settings > Security
# 4. Click "Reset Password" for neondb_owner user
# 5. Update all environment files with new credentials
```

### Step 2: Update Database URLs
Replace all instances in:
- `frontend/.env.local`
- `frontend/.env.production` (if exists)
- Vercel environment variables
- Any deployment scripts

**OLD (COMPROMISED):**
```
postgresql://neondb_owner:npg_bh12OmZINKPn@ep-frosty-cloud-a7tiov8j-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

**NEW (after rotation):**
```
postgresql://neondb_owner:[NEW_PASSWORD]@ep-frosty-cloud-a7tiov8j-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

## 2. Affiliate Network Security (IMMEDIATE)

### Impact Radius
```bash
# Contact your Impact account manager to rotate shared secrets
# Update IMPACT_SIGNATURE_SECRET in production environment
# Test postback verification after rotation
```

### Commission Junction  
```bash
# Login to CJ Publisher account
# Navigate to Account > API Settings
# Generate new webhook signature secret
# Update CJ_SIGNATURE_SECRET in production environment
```

## 3. Application Secrets Rotation

### Generate New Secrets
```bash
# Generate cryptographically secure secrets
openssl rand -base64 64  # For JWT secrets
openssl rand -base64 64  # For encryption keys
openssl rand -base64 64  # For affiliate secrets
```

### Update Production Environment Variables
```env
# JWT & Authentication
JWT_SECRET=[NEW_64_CHAR_SECRET]
USER_AUTH_JWT_SECRET=[NEW_64_CHAR_SECRET]
ADMIN_JWT_SECRET=[NEW_64_CHAR_SECRET]
ENCRYPTION_KEY=[NEW_64_CHAR_SECRET]

# Affiliate Security
IMPACT_SIGNATURE_SECRET=[NEW_64_CHAR_SECRET]
CJ_SIGNATURE_SECRET=[NEW_64_CHAR_SECRET]
```

## 4. API Keys Rotation

### Amadeus API
- **Status**: ✅ Test environment keys - safe for development
- **Action**: Generate production keys when deploying to live environment

### External Services
```bash
# Rotate if exposed:
RESEND_API_KEY=[NEW_KEY]
SENTRY_AUTH_TOKEN=[NEW_TOKEN]
YOUTUBE_API_KEY=[NEW_KEY]
```

## 5. Deployment Security Checklist

### Before Production Deployment
- [ ] All database credentials rotated
- [ ] All affiliate secrets rotated  
- [ ] New JWT secrets generated
- [ ] Production API keys configured
- [ ] IP allowlists configured for postback endpoints
- [ ] SSL certificates valid
- [ ] Environment variables secured in deployment platform

### Vercel Deployment Security
```bash
# Set environment variables in Vercel dashboard
vercel env add DATABASE_URL
vercel env add IMPACT_SIGNATURE_SECRET
vercel env add CJ_SIGNATURE_SECRET
vercel env add JWT_SECRET
# ... etc
```

## 6. Monitoring & Alerts

### Set up alerts for:
- Failed postback authentications
- Unusual database connection patterns
- High volume of failed JWT validations
- Unauthorized API access attempts

### Log Analysis
```bash
# Monitor for credential exposure in logs
grep -r "npg_bh12OmZINKPn" /var/log/
grep -r "DATABASE_URL" /var/log/
```

## 7. Security Best Practices Going Forward

### Never Log Sensitive Data
```typescript
// ❌ BAD - logs credentials
console.log("Database URL:", process.env.DATABASE_URL);

// ✅ GOOD - logs safely
console.log("Database connection:", process.env.DATABASE_URL ? "configured" : "missing");
```

### Environment Variable Management
```typescript
// ✅ Validate without exposing
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'IMPACT_SIGNATURE_SECRET'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}
```

### Regular Security Audits
- Monthly credential rotation
- Quarterly security reviews
- Monitor for exposed secrets in code repositories
- Review access logs and authentication patterns

## 8. Incident Response

### If credentials are compromised:
1. **Immediate**: Rotate affected credentials
2. **Analyze**: Review logs for unauthorized access
3. **Monitor**: Watch for unusual activity patterns
4. **Document**: Record incident and response actions
5. **Improve**: Update security procedures

---

## Emergency Contacts

- **Database**: Neon support (support@neon.tech)
- **Impact Radius**: Your account manager
- **Commission Junction**: CJ Publisher support
- **Vercel**: Vercel support for deployment issues

⚠️ **This document contains sensitive security information. Do not commit to version control.**