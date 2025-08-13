# 🛡️ Security Guidelines for Spontra Project

## 🚨 **Incident Summary**
On August 3, 2025, Amadeus API credentials were accidentally committed to the public repository in `LIVE_RESULTS_DEMO.md`. This document outlines security best practices to prevent future incidents.

## 🔐 **Credential Management Best Practices**

### ✅ **DO: Secure Credential Handling**

#### 1. **Use Environment Variables**
```bash
# ✅ CORRECT: Store in .env.local (gitignored)
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here
YOUTUBE_API_KEY=your_youtube_key_here
```

#### 2. **Proper File Structure**
```
project/
├── .env.example          # ✅ Template with placeholder values
├── .env.local            # ✅ Real credentials (GITIGNORED)
├── frontend/
│   ├── .env.example      # ✅ Frontend template
│   └── .env.local        # ✅ Frontend credentials (GITIGNORED)
└── docs/
    └── setup.md          # ✅ Use placeholders in documentation
```

#### 3. **Environment Variable Naming**
```bash
# ✅ Clear, descriptive names
AMADEUS_CLIENT_ID=your_id
AMADEUS_CLIENT_SECRET=your_secret
AMADEUS_ENVIRONMENT=test

# ❌ Avoid generic names
API_KEY=your_key
SECRET=your_secret
```

#### 4. **Code Usage**
```typescript
// ✅ CORRECT: Read from environment
const clientId = process.env.AMADEUS_CLIENT_ID
const clientSecret = process.env.AMADEUS_CLIENT_SECRET

// ❌ NEVER: Hardcode credentials
const clientId = "hmbheJWBT4gAKNEDxVEC53MTavleW7M0"
```

### ❌ **DON'T: Security Anti-Patterns**

#### 1. **Never Commit Credentials**
```bash
# ❌ NEVER do this in any file committed to git:
const API_KEY = "sk-1234567890abcdef"
const SECRET = "abc123xyz789"
AMADEUS_CLIENT_ID=hmbheJWBT4gAKNEDxVEC53MTavleW7M0

# ❌ Don't put credentials in:
- Documentation files (.md)
- Configuration files (.json, .yaml)
- Source code (.js, .ts, .go, .py)
- Comments or examples
- Commit messages
```

#### 2. **Avoid Insecure Storage**
```bash
# ❌ Don't store credentials in:
- Unencrypted files
- Shared drives
- Email or chat messages
- Screenshots or images
- Plain text notes
```

## 🔧 **Development Workflow**

### **Before You Start**
1. **Install security hooks**:
   ```bash
   cd .githooks && ./install-hooks.sh
   ```

2. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   cp frontend/.env.example frontend/.env.local
   ```

3. **Fill in real credentials** in `.env.local` files

### **During Development**
1. **Always use environment variables** for any sensitive data
2. **Test with real credentials locally** using `.env.local`
3. **Use placeholder values** in documentation and examples
4. **Run security checks** before committing:
   ```bash
   git add .
   git commit  # Pre-commit hook will scan for secrets
   ```

### **Before Committing**
1. **Review your changes**:
   ```bash
   git diff --cached  # Check what you're committing
   ```

2. **Look for credentials** in:
   - New files
   - Modified files
   - Documentation
   - Configuration files

3. **Run manual security check**:
   ```bash
   grep -r "api.*key\|secret\|token" --include="*.md" --include="*.json" .
   ```

## 🚨 **Incident Response Procedure**

### **If You Accidentally Commit Credentials:**

#### **IMMEDIATE ACTIONS (< 5 minutes)**
1. **STOP** - Don't push to remote if you haven't already
2. **Revoke credentials immediately** from the service provider
3. **Generate new credentials** 
4. **Notify the team** via secure channel

#### **CLEANUP ACTIONS (< 30 minutes)**
1. **Remove from current commit**:
   ```bash
   git reset --soft HEAD~1  # If not pushed yet
   # Edit files to remove credentials
   git add .
   git commit
   ```

2. **Clean git history** (if already pushed):
   - Follow instructions in `SECURITY_GIT_CLEANUP.md`
   - Use BFG Repo-Cleaner or git filter-branch

3. **Update security measures**:
   - Enhance .gitignore patterns
   - Review pre-commit hooks
   - Update team documentation

## 🔍 **Security Monitoring**

### **Regular Security Checks**
```bash
# Weekly security audit
./scripts/security-audit.sh

# Check for patterns of leaked secrets
git log --all -p | grep -E "(api[_-]?key|secret|token)" -i

# Scan current repository
./githooks/pre-commit --scan-all
```

### **API Usage Monitoring**
1. **Set up alerts** for unusual API usage
2. **Review API logs** monthly for unauthorized access
3. **Monitor quota usage** for unexpected spikes
4. **Rotate credentials** every 90 days

## 🏢 **Service-Specific Guidelines**

### **Amadeus API**
- **Client ID**: Store in `AMADEUS_CLIENT_ID`
- **Client Secret**: Store in `AMADEUS_CLIENT_SECRET`
- **Environment**: Use `test` for development, `production` for live
- **Rotation**: Every 90 days or after any suspected compromise
- **Monitoring**: Check usage at [Amadeus for Developers](https://developers.amadeus.com/)

### **YouTube API**
- **API Key**: Store in `YOUTUBE_API_KEY`
- **Restrictions**: Configure domain/IP restrictions in Google Console
- **Quotas**: Monitor usage at [Google Cloud Console](https://console.cloud.google.com/)

### **Database Credentials**
- **Connection Strings**: Never commit full connection strings
- **Split components**: Store host, user, password separately
- **Use connection pooling**: With encrypted connections

## 🎯 **Quick Reference Checklist**

### **Before Every Commit**
- [ ] No API keys in files being committed
- [ ] No passwords or secrets in code
- [ ] No hardcoded connection strings
- [ ] Documentation uses placeholder values
- [ ] Pre-commit hook passed
- [ ] Diff reviewed for sensitive data

### **Weekly Security Review**
- [ ] Check API usage logs
- [ ] Review new team member access
- [ ] Update credentials if needed
- [ ] Run security audit scripts
- [ ] Review and update .gitignore

### **Monthly Security Tasks**
- [ ] Rotate API credentials
- [ ] Review access permissions
- [ ] Update security documentation
- [ ] Team security training refresher
- [ ] Audit git history for leaks

## 🆘 **Emergency Contacts**

| Type | Contact | Action |
|------|---------|--------|
| **Amadeus API Breach** | [Amadeus Support](https://developers.amadeus.com/support) | Revoke credentials |
| **YouTube API Breach** | [Google Cloud Support](https://cloud.google.com/support) | Disable API key |
| **General Security** | Security Team | security@company.com |
| **DevOps/Git Issues** | DevOps Team | devops@company.com |

## 📚 **Additional Resources**

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)
- [12-Factor App Config](https://12factor.net/config)

---

## 🔄 **Document Updates**

| Date | Version | Changes |
|------|---------|---------|
| 2025-08-13 | 1.0 | Initial version after Amadeus credential incident |

**Last Updated**: August 13, 2025  
**Next Review**: September 13, 2025  
**Owner**: Security Team

---

> ⚠️ **Remember**: Security is everyone's responsibility. When in doubt, ask for help rather than risk exposing credentials.