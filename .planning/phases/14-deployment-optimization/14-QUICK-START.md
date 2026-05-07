# Quick Start: Deployment Optimization

## Execute These Commands NOW (Phase 1 - 30 min)

### Step 1: Remove Unused Dependencies (5 min)
```bash
# Remove phantom dependencies
bun remove three playwright-core better-sqlite3

# Clean install
bun run clean
rm -rf node_modules bun.lockb
bun install
```

### Step 2: Update Build Scripts (2 min)
```bash
# Update package.json scripts
node -e "
const pkg = require('./package.json');
pkg.scripts.build = \"NODE_OPTIONS='--max-old-space-size=2048' nuxt build\";
pkg.scripts['build:render'] = \"NODE_OPTIONS='--max-old-space-size=4096' nuxt build\";
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
```

### Step 3: Create .npmignore (1 min)
```bash
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
```

### Step 4: Update nuxt.config.ts (5 min)
Add these optimizations:
```bash
# Backup current config
cp nuxt.config.ts nuxt.config.ts.backup

# Apply optimizations (see OPTIMIZED-NUXT-CONFIG.ts below)
```

### Step 5: Optimize AWS SDK (5 min)
```bash
# Keep only needed S3 client
# Update server/api/services/s3.service.ts to use singleton pattern
```

### Step 6: Optimize Lucide Icons (10 min)
```bash
# Option 1: Switch to Iconify
bun remove lucide-vue-next
# Already have @iconify-json/lucide

# Update components to use <Icon name="lucide:menu" />
```

### Step 7: Test Build (5 min)
```bash
# Clean build
bun run clean

# Install dependencies
bun install

# Check size
du -sh node_modules

# Build with 4GB limit
NODE_OPTIONS='--max-old-space-size=4096' bun run build

# Check output size
du -sh .output/server
```

---

## Validation Checklist

After completing steps above:

```bash
# 1. Check node_modules size (should be < 1GB)
du -sh node_modules

# 2. Check build output (should be < 50MB)
du -sh .output/server

# 3. Test build completes successfully
bun run build

# 4. Verify dependencies removed
bun pm ls | grep -i "three\|playwright\|sqlite"

# 5. Test the app
bun run dev
# Visit http://localhost:3000
```

---

## If Build Still Fails

### Increase Memory Incrementally
```bash
# Try 6GB first
NODE_OPTIONS='--max-old-space-size=6144' bun run build

# If still fails, use 8GB (last resort)
bun run build:render
```

### Check What's Consuming Memory
```bash
# Analyze bundle
bun run analyze

# Check largest files in node_modules
du -sh node_modules/* | sort -hr | head -20
```

---

## Quick Wins Expected Results

- node_modules: 1.6GB → ~1.0GB (saved 600MB)
- .output/server: 71MB → ~50MB (saved 21MB)
- Build time: faster
- Memory peak: lower

**After Phase 1, try deploying to Vercel:**
```bash
vercel --prod
```

---

## Next Steps After Quick Wins

1. **Phase 3**: PDF Generation refactor (biggest impact)
2. **Phase 7**: Sharp optimization
3. **Phase 2**: Advanced bundle optimization

See full plan: `14-DEPLOYMENT-OPTIMIZATION-PLAN.md`
