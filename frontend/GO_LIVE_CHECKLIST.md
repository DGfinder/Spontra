# 🚀 Go-Live Checklist & Rollback Plan

## ⚡ Quick Pre-Launch Validation (15-30 min)

### 1. Run the Full Validation Suite
```bash
npm run validation:all
```

**Expected Output:** `✅ CLEARED FOR PRODUCTION DEPLOYMENT`

If any critical failures occur, **DO NOT DEPLOY** until fixed.

### 2. Manual Postback Testing
```bash
# Test Impact signature verification
QS="subId=TESTCLICK123&status=approved&amount=12.34&currency=AUD&advId=KAYAK"
SIG=$(printf "%s" "$QS" | openssl dgst -sha256 -hmac "$IMPACT_SIGNATURE_SECRET" -binary | base64)
curl -G "https://yourdomain.com/api/aff/postback/impact" --data "$QS" -H "X-Impact-Signature: sha256=$SIG"

# Expected: {"ok":true,"clickId":"TESTCLICK123","conversionId":"..."}
```

### 3. Verify Environment Variables
```bash
# Critical production variables that MUST be set:
echo $DATABASE_URL              # New rotated Neon password
echo $IMPACT_SIGNATURE_SECRET   # Production Impact secret
echo $CJ_SIGNATURE_SECRET       # Production CJ secret
echo $CJ_ADVERTISER_IDS         # Your CJ advertiser IDs
```

---

## 🎯 Deployment Strategy (Conservative → Progressive)

### Phase 1: CONSERVATIVE (Day 1)
```env
# Conservative feature flags for initial launch
FEATURE_METASEARCH_ENABLED=true
FEATURE_METASEARCH_PROVIDERS_ENABLED=true
FEATURE_CLICK_TRACKING_ENABLED=true
FEATURE_REPRICE_ON_SELECT_ENABLED=false

# Start with ONE reliable provider
FEATURE_PROVIDER_KAYAK_ENABLED=true
FEATURE_PROVIDER_SKYSCANNER_ENABLED=false
FEATURE_PROVIDER_JETSTAR_ENABLED=false
FEATURE_PROVIDER_VIRGIN_ENABLED=false

# Single market
FEATURE_MARKET_AU_ENABLED=true
FEATURE_MARKET_NZ_ENABLED=false

# Security ALWAYS enforced in production
FEATURE_POSTBACK_ENFORCE_SIGNATURE=true
FEATURE_RATE_LIMITING_ENABLED=true
FEATURE_IP_ALLOWLIST_ENFORCEMENT=true
```

### Phase 2: PROGRESSIVE (Day 2-3, if Phase 1 stable)
```env
# Add second provider
FEATURE_PROVIDER_SKYSCANNER_ENABLED=true

# Enable price validation
FEATURE_REPRICE_ON_SELECT_ENABLED=true
```

### Phase 3: FULL PRODUCTION (Week 2, if metrics good)
```env
# All providers
FEATURE_PROVIDER_JETSTAR_ENABLED=true
FEATURE_PROVIDER_VIRGIN_ENABLED=true

# Both markets
FEATURE_MARKET_NZ_ENABLED=true
```

---

## 🚨 Emergency Rollback Plan (2-minute recovery)

### Instant Rollback (Nuclear Option)
```env
# Disable all metasearch functionality immediately
FEATURE_METASEARCH_ENABLED=false
FEATURE_METASEARCH_PROVIDERS_ENABLED=false

# Keep postbacks running (don't lose attributed sales!)
FEATURE_POSTBACK_IMPACT_ENABLED=true
FEATURE_POSTBACK_CJ_ENABLED=true
```

### Selective Rollback (Surgical)
```env
# Disable specific problematic provider
FEATURE_PROVIDER_KAYAK_ENABLED=false

# Disable repricing if causing issues
FEATURE_REPRICE_ON_SELECT_ENABLED=false

# Disable specific market
FEATURE_MARKET_NZ_ENABLED=false
```

### Database Rollback (If needed)
```sql
-- Disable provider in database (keeps data)
UPDATE providers SET "isActive" = false WHERE "providerId" = 'problematic-provider';

-- Check recent problematic conversions
SELECT * FROM conversions 
WHERE "createdAt" >= NOW() - INTERVAL '1 hour' 
AND status = 'APPROVED'
ORDER BY "createdAt" DESC;
```

---

## 📊 Production Monitoring Dashboard

### Critical Metrics to Watch (First 24h)

**Revenue Metrics (Check every 15 min):**
```sql
-- EPC by provider (today vs yesterday)
SELECT providerId, 
       COUNT(*) as clicks_today,
       ROUND((SUM(c.commission) / COUNT(*))::numeric, 4) as epc_today
FROM clicks k 
LEFT JOIN conversions c ON c.clickId = k.clickId 
WHERE k.createdAt >= CURRENT_DATE 
GROUP BY providerId;
```

**Health Metrics (Check every 5 min):**
```sql
-- Provider uptime (last hour)
SELECT providerId, 
       COUNT(*) as checks,
       COUNT(*) FILTER (WHERE isHealthy = false) as failures,
       ROUND(100.0 * COUNT(*) FILTER (WHERE isHealthy = false) / COUNT(*), 1) as failure_rate
FROM synthetic_checks 
WHERE checkedAt >= NOW() - INTERVAL '1 hour'
GROUP BY providerId;
```

---

## 🚨 Alert Thresholds (Set these up immediately)

### CRITICAL (Page On-Call Team)
- EPC drops >30% day-over-day for any top-3 provider
- Provider failure rate >10% in last 4 hours
- Any postback authentication failures
- Conversion rate drops >50% from 7-day average
- Any IP with >500 clicks in 24h

### WARNING (Slack/Email)
- EPC drops 15-30% for any provider  
- Provider failure rate 5-10%
- Price change rate >15% for any provider
- Click volume spikes >2x hourly average

---

## 🔧 Common Issues & Quick Fixes

### Issue: EPC Drop Detected
```bash
# 1. Check provider health
npm run monitor:synthetic

# 2. Disable problematic provider
# Set FEATURE_PROVIDER_[NAME]_ENABLED=false

# 3. Monitor for 30 minutes, re-enable if needed
```

### Issue: High Price Change Rate
```bash
# 1. Check price accuracy
SELECT * FROM price_accuracy 
WHERE checkedAt >= NOW() - INTERVAL '2 hours'
AND priceChanged = true
ORDER BY percentageChange DESC;

# 2. Temporarily disable repricing
# Set FEATURE_REPRICE_ON_SELECT_ENABLED=false
```

### Issue: Postback Authentication Failures
```bash
# 1. Check logs for signature failures
grep "INVALID_SIGNATURE" /var/log/app.log

# 2. Verify secrets match partner configuration
echo $IMPACT_SIGNATURE_SECRET

# 3. Rotate secrets if compromised
```

---

## 📋 Go-Live Command Sequence

### Pre-Deployment
```bash
# 1. Run full validation
npm run validation:all

# 2. Seed metasearch data (if not already done)
npm run metasearch:seed

# 3. Test synthetic monitoring
npm run monitor:synthetic
```

### Deployment
```bash
# 4. Deploy with conservative flags
vercel --prod
# OR your deployment command

# 5. Verify deployment health
curl https://yoursite.com/api/health

# 6. Start monitoring dashboard
```

### Post-Deployment (First Hour)
```bash
# 7. Test one full click-to-conversion flow manually
# 8. Monitor EPC metrics
# 9. Check synthetic monitor results
# 10. Verify affiliate disclosures are showing
```

---

## ✅ Success Criteria (24h mark)

- [ ] **Revenue**: EPC within 10% of expected values
- [ ] **Uptime**: <5% provider failure rate  
- [ ] **Security**: Zero authentication failures
- [ ] **Performance**: <3s average click-to-redirect time
- [ ] **Accuracy**: <15% price change rate across providers
- [ ] **Volume**: Conversion rate matches historical patterns

---

## 📞 Emergency Contacts

- **Platform Owner**: [Your contact]
- **DevOps/Infrastructure**: [Contact]
- **Affiliate Network Contacts**:
  - Impact Radius: [Account manager]
  - Commission Junction: [Account manager]
- **Database (Neon)**: support@neon.tech

---

🎉 **Ready to launch! The metasearch platform is production-ready with comprehensive monitoring, security, and rollback capabilities.**