#!/bin/bash

# =============================================================================
# Test Runner Script for n8n-nodes-tether
# 
# Author: Velocity BPA
# Website: https://velobpa.com
# =============================================================================

echo ""
echo "=========================================="
echo "  n8n-nodes-tether Test Suite"
echo "  Velocity BPA - https://velobpa.com"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if built
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Project not built. Building now...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
fi

# Run Jest unit tests
echo "Running Jest Unit Tests..."
echo "-------------------------------------------"
npm test
JEST_EXIT=$?

if [ $JEST_EXIT -ne 0 ]; then
    echo -e "${RED}❌ Jest tests failed!${NC}"
else
    echo -e "${GREEN}✅ Jest tests passed!${NC}"
fi

echo ""
echo "Running Integration Tests..."
echo "-------------------------------------------"

# Test utilities (doesn't require network)
echo ""
echo "📦 Testing Utilities..."
node scripts/test-utils.js
UTILS_EXIT=$?

# Test market data (requires network but public API)
echo ""
echo "📊 Testing Market Data..."
node scripts/test-market.js price
MARKET_EXIT=$?

# Test balance check with Tether Treasury (public read)
echo ""
echo "💰 Testing Balance Check (Ethereum)..."
node scripts/test-balance.js ethereum 0xdAC17F958D2ee523a2206206994597C13D831ec7
BALANCE_EXIT=$?

echo ""
echo "=========================================="
echo "  Test Results Summary"
echo "=========================================="

# Summary
if [ $JEST_EXIT -eq 0 ]; then
    echo -e "  Jest Unit Tests:    ${GREEN}✅ PASSED${NC}"
else
    echo -e "  Jest Unit Tests:    ${RED}❌ FAILED${NC}"
fi

if [ $UTILS_EXIT -eq 0 ]; then
    echo -e "  Utility Tests:      ${GREEN}✅ PASSED${NC}"
else
    echo -e "  Utility Tests:      ${RED}❌ FAILED${NC}"
fi

if [ $MARKET_EXIT -eq 0 ]; then
    echo -e "  Market Data Tests:  ${GREEN}✅ PASSED${NC}"
else
    echo -e "  Market Data Tests:  ${RED}❌ FAILED${NC}"
fi

if [ $BALANCE_EXIT -eq 0 ]; then
    echo -e "  Balance Tests:      ${GREEN}✅ PASSED${NC}"
else
    echo -e "  Balance Tests:      ${RED}❌ FAILED${NC}"
fi

echo "=========================================="
echo ""

# Exit with failure if any test failed
if [ $JEST_EXIT -ne 0 ] || [ $UTILS_EXIT -ne 0 ] || [ $MARKET_EXIT -ne 0 ] || [ $BALANCE_EXIT -ne 0 ]; then
    exit 1
fi

echo -e "${GREEN}All tests completed successfully!${NC}"
exit 0
