#!/bin/bash
# Test Render.com build locally
# Simulates exactly what Render does during deployment

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Testing Render.com Build Locally                         ║"
echo "║     Simulates Render's build environment                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo -e "${YELLOW}▶ Checking Node.js version...${NC}"
node --version
npm --version
echo ""

# Clean up previous builds
echo -e "${YELLOW}▶ Cleaning up previous builds...${NC}"
rm -rf .nuxt .output node_modules/.cache
echo "✓ Clean complete"
echo ""

# Check disk space before
echo -e "${YELLOW}▶ Disk space before build:${NC}"
df -h . | tail -1
echo ""

# Clean install (like Render)
echo -e "${YELLOW}▶ Running npm ci (clean install)...${NC}"
npm ci --prefer-offline --no-audit
echo "✓ Dependencies installed"
echo ""

# Check node_modules size
echo -e "${YELLOW}▶ node_modules size:${NC}"
du -sh node_modules
echo ""

# Build with memory optimization (like Render)
echo -e "${YELLOW}▶ Building with memory optimization...${NC}"
NODE_OPTIONS=--max-old-space-size=4096 npm run build
echo "✓ Build complete"
echo ""

# Check .output size
echo -e "${YELLOW}▶ .output size:${NC}"
du -sh .output
echo ""

# Aggressive cleanup (like Render)
echo -e "${YELLOW}▶ Running post-build cleanup...${NC}"
rm -rf node_modules/.cache
rm -rf .nuxt/cache
rm -rf .nuxt/analyze
echo "✓ Cleanup complete"
echo ""

# Remove devDependencies (like Render)
echo -e "${YELLOW}▶ Removing devDependencies (npm prune)...${NC}"
npm prune --production
echo "✓ DevDependencies removed"
echo ""

# Final sizes
echo -e "${YELLOW}▶ Final disk usage:${NC}"
echo "  node_modules: $(du -sh node_modules | cut -f1)"
echo "  .output:      $(du -sh .output 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""

# Check total slug size (approximate)
echo -e "${YELLOW}▶ Calculating total slug size...${NC}"
SLUG_SIZE=$(du -sb .output node_modules 2>/dev/null | awk '{sum+=$1} END {print sum}')
SLUG_MB=$((SLUG_SIZE / 1024 / 1024))
echo "  Estimated slug size: ${SLUG_MB}MB"
echo ""

# Check if within Render limits
if [ $SLUG_MB -gt 2048 ]; then
    echo -e "${RED}✗ WARNING: Slug size exceeds Render's 2GB limit!${NC}"
    echo "  Consider further optimization."
    exit 1
elif [ $SLUG_MB -gt 1536 ]; then
    echo -e "${YELLOW}⚠ WARNING: Slug size is close to Render's 2GB limit${NC}"
    echo "  Consider optimization if possible."
else
    echo -e "${GREEN}✓ Slug size is within Render's limits${NC}"
fi
echo ""

# Test health endpoint (if server is running)
echo -e "${YELLOW}▶ To test the built app locally:${NC}"
echo "  1. Start the server: node .output/server/index.mjs"
echo "  2. Check health: curl http://localhost:3000/api/health"
echo ""

echo -e "${GREEN}✓ Render build simulation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the build: node .output/server/index.mjs"
echo "  2. Push to Render: git push origin refractor"
echo "  3. Monitor deployment logs in Render dashboard"
