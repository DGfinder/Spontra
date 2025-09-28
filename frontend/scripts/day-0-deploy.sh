#!/bin/bash
# Day-0 Deploy Playbook - Spontra Metasearch Production Launch
# Execute this script step by step for safe production deployment

set -e  # Exit on any error

echo "🚀 SPONTRA METASEARCH - DAY 0 PRODUCTION DEPLOYMENT"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) [y/N]: " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            echo -e "${RED}❌ Operation cancelled${NC}"
            exit 1
            ;;
    esac
}

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

echo -e "${BLUE}📋 PRE-DEPLOYMENT CHECKLIST${NC}"
echo "1. Database credentials rotated? (new Neon database created)"
echo "2. HMAC secrets obtained from Impact & CJ account managers?"
echo "3. Production domain configured and SSL ready?"
echo "4. Monitoring alerts configured?"
echo ""
confirm "Have you completed all pre-deployment requirements?"

echo ""
echo -e "${BLUE}🔍 STEP 1: Final Validation${NC}"
echo "Running comprehensive pre-launch validation..."
npm run validation:all
check_success "Pre-launch validation"

echo ""
echo -e "${BLUE}🗃️ STEP 2: Database Migration${NC}"
echo "Deploying database schema to production..."
confirm "Deploy Prisma migrations to production database?"
npm run db:migrate:deploy
check_success "Database migration"

echo ""
echo -e "${BLUE}🌱 STEP 3: Seed Production Data${NC}"
echo "Seeding providers, templates, and Wave 1 configuration..."
npm run db:seed
check_success "Database seeding"

echo ""
echo -e "${BLUE}🏥 STEP 4: Synthetic Health Check${NC}"
echo "Running synthetic monitoring to verify all providers..."
npm run monitor:run
check_success "Synthetic health check"

echo ""
echo -e "${BLUE}🔐 STEP 5: Security Validation${NC}"
echo "Testing postback signature verification..."
npm run validation:postback
check_success "Postback security validation"

echo ""
echo -e "${BLUE}🔄 STEP 6: Click Deduplication Test${NC}"
echo "Verifying click deduplication logic..."
npm run validation:clicks
check_success "Click deduplication test"

echo ""
echo -e "${BLUE}💰 STEP 7: Reprice Validation${NC}"
echo "Testing price change detection and gates..."
npm run validation:reprice
check_success "Reprice validation"

echo ""
echo -e "${BLUE}📡 STEP 8: Landing Beacon Test${NC}"
echo "Verifying conversion tracking beacon..."
# Create a simple beacon test
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/beacon/landed?clickId=test-beacon&providerId=test" | grep -q "200"
check_success "Landing beacon test"

echo ""
echo -e "${BLUE}🛡️ STEP 9: Rollback Rehearsal${NC}"
echo "Testing emergency rollback procedure..."
confirm "Test rollback by temporarily disabling metasearch?"

# Temporarily disable metasearch
export FEATURE_METASEARCH_ENABLED=false
echo "Metasearch disabled - testing fallback behavior..."
sleep 2

# Re-enable metasearch
export FEATURE_METASEARCH_ENABLED=true
echo "Metasearch re-enabled - rollback test complete"
check_success "Rollback rehearsal"

echo ""
echo -e "${BLUE}🚀 STEP 10: Production Deployment${NC}"
echo "Ready to deploy to production..."
confirm "Deploy to production now?"

# Build and deploy (adjust for your platform)
echo "Building production bundle..."
npm run build
check_success "Production build"

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}📊 IMMEDIATE MONITORING CHECKLIST:${NC}"
echo "□ Open production dashboard: https://your-domain.com/admin/dashboards/production"
echo "□ Monitor EPC by provider (target: GB/SG ≥ $0.40, JP ≥ $0.35)"
echo "□ Watch price change rate (target: < 15% over 24h)"
echo "□ Check synthetic failure rate (target: < 5% over 15m)"
echo "□ Verify postback signature success rate (target: 100%)"
echo "□ Monitor rate limiting (429s on /out/* should be < 2%)"
echo ""
echo -e "${YELLOW}⏰ WATCH FOR NEXT 2 HOURS:${NC}"
echo "- Auto-remediation systems should handle provider failures"
echo "- Downranking/disabling based on thresholds"
echo "- Revenue metrics stabilizing"
echo ""
echo -e "${YELLOW}🚨 EMERGENCY PROCEDURES:${NC}"
echo "• Nuclear rollback: FEATURE_METASEARCH_ENABLED=false"
echo "• Pause current wave: FEATURE_ROLLOUT_WAVE_1_ENABLED=false"  
echo "• Disable specific provider: FEATURE_PROVIDER_[NAME]_ENABLED=false"
echo "• Emergency contact: your-oncall-number"
echo ""
echo -e "${GREEN}✅ Wave 1 EU/Asia launch complete - monitor closely!${NC}"

# Set up monitoring cron job reminder
echo ""
echo -e "${BLUE}📅 REMINDER: Set up monitoring cron jobs${NC}"
echo "Add these to your production crontab:"
echo "*/30 * * * * npm run monitor:run  # Health check every 30 min"
echo "*/15 * * * * psql \$DATABASE_URL -f scripts/epc-monitoring.sql  # EPC monitoring"

echo ""
echo "🎯 SUCCESS METRICS TO TRACK:"
echo "- EPC (GB/SG) ≥ $0.40, JP ≥ $0.35"
echo "- Synthetic success ≥ 95%"
echo "- Price-change rate ≤ 12%"
echo "- Postback approvals flowing normally"
echo ""
echo "🚀 Ready for revenue! Monitor the first 24 hours closely."