#!/bin/bash

# Deployment Optimization - Phase 1 Execution Script
# This script removes unused dependencies and optimizes the build

set -e  # Exit on error

echo "🚀 Starting Deployment Optimization - Phase 1"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Record initial metrics
echo "📊 Recording initial metrics..."
INITIAL_NODE_MODULES=$(du -sm node_modules 2>/dev/null | cut -f1 || echo "0")
print_status "Initial node_modules size: ${INITIAL_NODE_MODULES}MB"
echo ""

# Step 1: Remove unused dependencies
echo "🗑️  Step 1: Removing unused dependencies..."
echo ""

# Check if packages exist before removing
PACKAGES_TO_REMOVE="three playwright-core better-sqlite3"

for pkg in $PACKAGES_TO_REMOVE; do
    if grep -q "\"$pkg\"" package.json; then
        echo "Removing $pkg..."
        bun remove "$pkg" || print_warning "Could not remove $pkg (might not be installed)"
        print_status "Removed $pkg"
    else
        print_warning "$pkg not found in package.json, skipping"
    fi
done

echo ""

# Step 2: Clean install
echo "🧹 Step 2: Cleaning and reinstalling..."
echo ""

echo "Removing node_modules and cache..."
rm -rf node_modules bun.lockb .nuxt .output
print_status "Cleaned directories"

echo ""
echo "Installing dependencies..."
bun install
print_status "Dependencies installed"

echo ""

# Step 3: Record new metrics
echo "📊 Recording new metrics..."
FINAL_NODE_MODULES=$(du -sm node_modules 2>/dev/null | cut -f1 || echo "0")
print_status "Final node_modules size: ${FINAL_NODE_MODULES}MB"

SAVED=$((INITIAL_NODE_MODULES - FINAL_NODE_MODULES))
if [ $SAVED -gt 0 ]; then
    print_status "Saved ${SAVED}MB"
else
    print_warning "No space saved (or increased)"
fi

echo ""

# Step 4: Create .npmignore
echo "📝 Step 3: Creating .npmignore..."
cat > .npmignore << 'EOF'
tests/
**/*.test.ts
**/*.spec.ts
.editorconfig
.gitignore
.prettierrc
tsconfig.json
.eslintrc
.prettierrcignore
EOF
print_status ".npmignore created"
echo ""

# Step 5: Update package.json scripts
echo "📝 Step 4: Updating build scripts..."

# Backup package.json
cp package.json package.json.backup
print_status "Backed up package.json"

# Update scripts using node
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts.build = \"NODE_OPTIONS='--max-old-space-size=2048' nuxt build\";
pkg.scripts['build:render'] = \"NODE_OPTIONS='--max-old-space-size=4096' nuxt build\";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json scripts');
"

print_status "Build scripts updated"
echo ""

# Step 6: Test build
echo "🔨 Step 5: Testing build with reduced memory..."
echo ""

print_warning "This may take a few minutes..."
echo ""

if NODE_OPTIONS='--max-old-space-size=4096' bun run build; then
    print_status "Build successful!"
    
    # Record build output size
    if [ -d ".output/server" ]; then
        SERVER_SIZE=$(du -sm .output/server | cut -f1)
        PUBLIC_SIZE=$(du -sm .output/public | cut -f1)
        print_status "Server bundle size: ${SERVER_SIZE}MB"
        print_status "Public bundle size: ${PUBLIC_SIZE}MB"
    fi
else
    print_error "Build failed!"
    print_warning "Try increasing memory: NODE_OPTIONS='--max-old-space-size=6144' bun run build"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Phase 1 Complete!"
echo "=============================================="
echo ""
echo "Summary:"
echo "  - Removed: $PACKAGES_TO_REMOVE"
echo "  - node_modules: ${INITIAL_NODE_MODULES}MB → ${FINAL_NODE_MODULES}MB (saved ${SAVED}MB)"
echo "  - Build memory limit: 4GB"
echo ""

# Check if ready for Phase 2
if [ $FINAL_NODE_MODULES -gt 1000 ]; then
    print_warning "node_modules still > 1GB. Consider Phase 2 optimizations."
    echo ""
    echo "Next steps:"
    echo "  1. Commit changes: git add . && git commit -m 'Phase 1: Remove unused deps'"
    echo "  2. Try deployment: vercel --prod"
    echo "  3. If fails, continue to Phase 2"
else
    print_status "node_modules < 1GB. Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Commit changes: git add . && git commit -m 'Phase 1: Optimize for deployment'"
    echo "  2. Create vercel.json (see VERCEL-RENDER-CONFIGS.md)"
    echo "  3. Deploy: vercel --prod"
fi

echo ""
echo "Files modified:"
echo "  - package.json"
echo "  - .npmignore"
echo "  - bun.lockb"
echo ""
echo "Backup saved: package.json.backup"
