#!/bin/bash
# Daily Ops CLI Helper Commands
# Copy-paste ready one-liners for morning triage

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🛠️  DAILY OPS CLI HELPERS"
echo "========================="
echo ""

# Check if API key is set
if [ -z "$ADMIN_API_KEY" ]; then
    echo -e "${RED}❌ ADMIN_API_KEY environment variable not set${NC}"
    echo "   export ADMIN_API_KEY=your_admin_api_key"
    echo ""
fi

echo "📊 Quick Health Check:"
echo "npm run ops:daily | jq '.summary'"
echo ""

echo "🚨 Critical Issues Only:"
echo "npm run ops:daily | jq '{critical: [.epcByProviderMarket[] | select(.status==\"CRITICAL\")], price: [.priceChangeRates[]|select(.status==\"CRITICAL\")], synth: [.syntheticFailures15m[]|select(.status==\"CRITICAL\")]}'"
echo ""

echo "📉 Top EPC Regressions:"
echo "npm run ops:daily | jq '.epcByProviderMarket | sort_by(.changePctVs7d) | .[0:5]'"
echo ""

echo "🎯 Revenue Top Performers:"
echo "npm run ops:daily | jq '.epcByProviderMarket | sort_by(-.revenue24h) | .[0:5] | .[] | \"\\(.providerId)/\\(.market): $\\(.revenue24h) (\\(.epc24h))\"'"
echo ""

echo "⚠️  Price Instability Leaders:"
echo "npm run ops:daily | jq '.priceChangeRates | sort_by(-.pctChanged) | .[0:5]'"
echo ""

echo "🔥 Synthetic Failure Hot Spots:"
echo "npm run ops:daily | jq '.syntheticFailures15m | sort_by(-.pctFail) | .[0:5]'"
echo ""

echo "📈 Health Score Trend (requires multiple calls):"
echo "for i in {1..5}; do npm run ops:daily | jq -r '.summary.overallHealth'; sleep 10; done"
echo ""

echo "🎯 Action Items Only:"
echo "npm run ops:daily | jq '[.epcByProviderMarket[] | select(.action != \"NONE\"), .priceChangeRates[] | select(.action != \"NONE\"), .syntheticFailures15m[] | select(.action != \"NONE\")]'"
echo ""

echo "📋 Triage Report (human readable):"
echo 'npm run ops:daily | jq -r "\"📊 DAILY OPS TRIAGE REPORT\", \"Generated: \" + .generatedAt, \"\", \"🎯 Overall Health: \" + (.summary.overallHealth|tostring) + \"%\", \"\", \"🚨 Critical Issues:\", (.summary.criticalIssues[] // \"None\"), \"\", \"💰 Top Revenue Providers:\", (.epcByProviderMarket[:3][] | \"  \" + .providerId + \"/\" + .market + \": $\" + (.revenue24h|tostring) + \" (\" + (.epc24h|tostring) + \" EPC)\"), \"\", \"⚠️  Providers Needing Attention:\", ([.epcByProviderMarket[], .priceChangeRates[], .syntheticFailures15m[]] | map(select(.status == \"WARNING\" or .status == \"CRITICAL\")) | .[] | \"  \" + .providerId + (if has(\"market\") then \"/\" + .market else \"\" end) + \": \" + .status + \" - \" + .action)"'
echo ""

echo "🔄 Watch Mode (refresh every 30s):"
echo "watch -n 30 'npm run ops:daily | jq \".summary\"'"
echo ""

echo "🎮 Interactive Picker:"
cat << 'EOF'
function ops_pick() {
    echo "Select view:"
    echo "1) Quick health"
    echo "2) Critical issues only" 
    echo "3) Top regressions"
    echo "4) Revenue leaders"
    echo "5) Full triage report"
    read -p "Choice (1-5): " choice
    
    case $choice in
        1) npm run ops:daily | jq '.summary' ;;
        2) npm run ops:daily | jq '{critical: [.epcByProviderMarket[] | select(.status=="CRITICAL")], price: [.priceChangeRates[]|select(.status=="CRITICAL")], synth: [.syntheticFailures15m[]|select(.status=="CRITICAL")]}' ;;
        3) npm run ops:daily | jq '.epcByProviderMarket | sort_by(.changePctVs7d) | .[0:5]' ;;
        4) npm run ops:daily | jq '.epcByProviderMarket | sort_by(-.revenue24h) | .[0:5]' ;;
        5) npm run ops:daily | jq -r '"📊 DAILY OPS TRIAGE REPORT", "Generated: " + .generatedAt, "", "🎯 Overall Health: " + (.summary.overallHealth|tostring) + "%", "", "🚨 Critical Issues:", (.summary.criticalIssues[] // "None"), "", "💰 Top Revenue Providers:", (.epcByProviderMarket[:3][] | "  " + .providerId + "/" + .market + ": $" + (.revenue24h|tostring) + " (" + (.epc24h|tostring) + " EPC)"), "", "⚠️  Providers Needing Attention:", ([.epcByProviderMarket[], .priceChangeRates[], .syntheticFailures15m[]] | map(select(.status == "WARNING" or .status == "CRITICAL")) | .[] | "  " + .providerId + (if has("market") then "/" + .market else "" end) + ": " + .status + " - " + .action)' ;;
        *) echo "Invalid choice" ;;
    esac
}
EOF

echo ""
echo "💡 Tips:"
echo "  - Add 'source scripts/ops-cli-helpers.sh' to your .bashrc"
echo "  - Use ops_pick() for interactive menu"
echo "  - Pipe to 'tee ops-$(date +%Y%m%d).log' to save reports"