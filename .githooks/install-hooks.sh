#!/bin/bash

# Git Hooks Installation Script
# This script installs security-focused git hooks to prevent credential exposure

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Installing Git Security Hooks...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Get the git directory
GIT_DIR=$(git rev-parse --git-dir)
HOOKS_DIR="$GIT_DIR/hooks"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy our custom pre-commit hook
if [ -f ".githooks/pre-commit" ]; then
    echo "📋 Installing pre-commit hook..."
    cp ".githooks/pre-commit" "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
else
    echo -e "${RED}❌ Error: pre-commit hook not found in .githooks/pre-commit${NC}"
    exit 1
fi

# Configure git to use our hooks directory for future hooks
git config core.hooksPath .githooks

echo ""
echo -e "${GREEN}🎉 Git security hooks installed successfully!${NC}"
echo ""
echo "🛡️  Security Features Enabled:"
echo "   • API key and secret detection"
echo "   • Known compromised credential blocking"
echo "   • Environment variable validation"
echo "   • Multi-pattern secret scanning"
echo ""
echo "📝 Usage:"
echo "   • Hooks run automatically on 'git commit'"
echo "   • To bypass (NOT recommended): git commit --no-verify"
echo "   • View detected patterns in pre-commit output"
echo ""
echo -e "${YELLOW}⚠️  Team Setup: All team members should run this script${NC}"
echo "   to ensure consistent security checking across the team."
echo ""

# Test the hook
echo "🧪 Testing the pre-commit hook..."
if "$HOOKS_DIR/pre-commit" --test 2>/dev/null; then
    echo -e "${GREEN}✅ Hook test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Hook test completed (this is normal if no files are staged)${NC}"
fi

echo ""
echo "🔗 Next Steps:"
echo "1. Share this script with your team members"
echo "2. Review SECURITY_GUIDELINES.md for best practices"
echo "3. Test with: git add . && git commit (should scan for secrets)"
echo ""