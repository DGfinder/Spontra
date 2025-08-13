# 🛡️ Git History Cleanup for Exposed Credentials

## ⚠️ CRITICAL: Amadeus API Credentials Exposed in Git History

**Affected Commit:** `f08734885419a1239ddcfd09ef1e44cc240242b4`  
**File:** `LIVE_RESULTS_DEMO.md`  
**Exposed Credentials:**
- Client ID: `hmbheJWBT4gAKNEDxVEC53MTavleW7M0`
- Client Secret: `yTGQ9nbTSbtByd5A`

## 🚨 Prerequisites (COMPLETE FIRST)

1. **✅ Revoke the exposed credentials** from Amadeus for Developers portal
2. **✅ Generate new credentials** and update `.env.local`
3. **✅ Backup your repository** before proceeding
4. **✅ Notify all team members** that they'll need to re-clone after cleanup

## 🛠️ Method 1: BFG Repo-Cleaner (Recommended)

### Step 1: Install BFG Repo-Cleaner
```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
# Or use homebrew on macOS
brew install bfg
```

### Step 2: Create a fresh clone
```bash
git clone --mirror https://github.com/yourusername/Spontra.git spontra-cleanup.git
cd spontra-cleanup.git
```

### Step 3: Create credentials file to remove
```bash
echo "hmbheJWBT4gAKNEDxVEC53MTavleW7M0" > credentials-to-remove.txt
echo "yTGQ9nbTSbtByd5A" >> credentials-to-remove.txt
```

### Step 4: Run BFG to remove credentials
```bash
java -jar bfg-1.14.0.jar --replace-text credentials-to-remove.txt
# Or if using homebrew: bfg --replace-text credentials-to-remove.txt
```

### Step 5: Clean up git references
```bash
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Step 6: Push cleaned history
```bash
git push --force
```

## 🛠️ Method 2: git filter-branch (Alternative)

### Step 1: Remove credentials from history
```bash
git filter-branch --tree-filter '
  if [ -f "LIVE_RESULTS_DEMO.md" ]; then
    sed -i "s/hmbheJWBT4gAKNEDxVEC53MTavleW7M0/your_amadeus_client_id_here/g" LIVE_RESULTS_DEMO.md
    sed -i "s/yTGQ9nbTSbtByd5A/your_amadeus_client_secret_here/g" LIVE_RESULTS_DEMO.md
  fi
' --all
```

### Step 2: Clean up references
```bash
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 3: Force push
```bash
git push --force --all
git push --force --tags
```

## 📝 Post-Cleanup Actions

### 1. Verify credentials are removed
```bash
git log --all --full-history -p | grep -i "hmbheJWBT4gAKNEDxVEC53MTavleW7M0"
# Should return no results
```

### 2. Notify team members
Send this message to all collaborators:
```
🚨 SECURITY: Git history has been rewritten to remove exposed API credentials.
Action required: Delete your local repo and re-clone immediately.

git clone https://github.com/yourusername/Spontra.git

Do NOT try to pull/merge - the history has been rewritten.
```

### 3. Update GitHub repository settings
- Go to GitHub repository settings
- Under "Danger Zone" → click "Change repository visibility" 
- Temporarily make private if it was public (optional but recommended)
- Enable "Automatically delete head branches" to prevent old branches

### 4. Monitor for unauthorized usage
- Check Amadeus API logs for suspicious activity
- Monitor quota usage for unexpected spikes
- Set up alerts for unusual API usage patterns

## ⚠️ Important Notes

1. **This operation rewrites git history** - all commit SHAs will change
2. **All team members must re-clone** the repository after cleanup
3. **Backup everything** before starting
4. **The old credentials are still compromised** - revocation is critical
5. **Consider making the repo private** temporarily during cleanup

## 🔍 Verification Commands

After cleanup, run these to verify credentials are gone:
```bash
# Search entire git history for the exposed credentials
git log --all --full-history -p | grep -E "(hmbheJWBT4gAKNEDxVEC53MTavleW7M0|yTGQ9nbTSbtByd5A)"

# Search all branches for the credentials
git grep -r "hmbheJWBT4gAKNEDxVEC53MTavleW7M0" $(git for-each-ref --format='%(refname)' refs/)
git grep -r "yTGQ9nbTSbtByd5A" $(git for-each-ref --format='%(refname)' refs/)
```

Both commands should return no results if cleanup was successful.

## 🆘 If Something Goes Wrong

If the cleanup fails or causes issues:
1. **Stop immediately** and don't push force
2. **Restore from backup** 
3. **Contact your git admin** or DevOps team
4. **Consider professional git recovery services** for critical repositories

Remember: **The most important step is revoking the exposed credentials immediately** - the git cleanup can wait if needed, but active credentials must be revoked ASAP.