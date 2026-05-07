# Troubleshooting Guide - v9planes on Render.com

Common issues and solutions when deploying v9planes on Render.com.

---

## 🔴 Critical Issues

### "Cannot find module '/app/.output/server/index.mjs'"

**Cause**: `.output/` directory is not included in the deployment slug.

**Solution** (already fixed in `refractor` branch):
```bash
# Ensure .slugignore does NOT exclude .output/
# Check .slugignore:
grep -v "^#" .slugignore | grep -E "^\." | head -5

# Should NOT show: .output
```

If `.output` is in `.slugignore`, remove it:
```bash
# .slugignore
# Keep .output for deployment (contains built app)
# .output is needed at runtime - DO NOT exclude
```

---

### "Slug size is too large" (>2GB)

**Diagnose**:
```bash
# Check sizes locally
npm run test:render

# Check specific directories
du -sh node_modules/* | sort -rh | head -10
du -sh .output/* | sort -rh | head -10
```

**Solutions**:

1. **Remove devDependencies** (already in `render.yaml`):
   ```yaml
   buildCommand: |
     npm ci --prefer-offline --no-audit
     npm run build
     npm prune --production  # <-- This line
   ```

2. **Remove unused dependencies**:
   ```bash
   # Check what packages are actually imported
   npm ls --prod
   
   # Remove if not used:
   npm uninstall three better-sqlite3
   ```

3. **Use .slugignore** to exclude unnecessary files:
   ```
   .git
   .vscode
   debug/
   *.test.ts
   docs/
   ```

4. **As last resort**: Pre-build strategy (see DEPLOY-RENDER.md)

---

### Build fails with "JavaScript heap out of memory"

**Cause**: Node.js default memory limit (512MB or 1GB) exceeded during build.

**Solution** (already in `render.yaml`):
```yaml
buildCommand: |
  NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

If still failing, increase to 6GB:
```yaml
NODE_OPTIONS=--max-old-space-size=6144 npm run build
```

---

## 🟡 Common Issues

### Health check fails

**Check**:
```bash
curl https://your-app.onrender.com/api/health
```

**Possible responses**:

| Status | Meaning | Fix |
|--------|---------|-----|
| `healthy` | ✅ All good | - |
| `degraded` | ⚠️ App works but has issues | Check database/memory |
| `unhealthy` | ❌ Critical issues | Check logs immediately |
| `404` | Health endpoint not found | Check deployment succeeded |
| timeout | App not responding | Check if server crashed |

**Database connection issues**:
```bash
# Health check will show:
"database": { "status": "disconnected" }

# Check MongoDB connection string
# Verify IP allowlist in MongoDB Atlas
```

---

### Static assets not loading (CSS/JS/images)

**Check**:
1. Build completed successfully
2. `.output/public/` contains assets
3. No 404 errors in browser console

**Fix**:
```bash
# Rebuild with fresh cache
rm -rf .nuxt .output node_modules/.cache
npm ci
npm run build
```

---

### Sharp/image processing errors

**Symptoms**: Image uploads fail, "Cannot find module 'sharp'"

**Solution** (already configured in `nuxt.config.ts`):
```typescript
nitro: {
  externals: {
    external: ['sharp'] // Keep sharp external
  }
}
```

If still failing:
```yaml
# Add to render.yaml envVars:
- key: SHARP_IGNORE_GLOBAL_LIBVIPS
  value: "1"
```

---

### Environment variables not working

**Check**:
```bash
# In Render Dashboard, verify:
# 1. Variables are set (not empty)
# 2. No typos in names
# 3. Restart after changing variables
```

**Debug** (add temporarily):
```typescript
// server/api/debug-env.get.ts
export default defineEventHandler(() => {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.ME_CONFIG_MONGODB_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
    // Don't expose actual values!
  }
})
```

---

## 🟢 Performance Issues

### Slow cold starts

**Causes**:
1. Large slug size
2. No connection pooling
3. Heavy initialization

**Solutions**:
1. Reduce slug size (see above)
2. Use connection pooling for MongoDB:
   ```typescript
   // server/utils/db.ts
   mongoose.connect(uri, {
     maxPoolSize: 10,
     minPoolSize: 2
   })
   ```
3. Lazy load heavy components (already done in `refractor`)

---

### High memory usage

**Monitor**:
```bash
# Check health endpoint for memory stats
curl /api/health | jq '.resources.memory'
```

**Solutions**:
1. Upgrade to Pro plan (2GB RAM)
2. Add caching to reduce database queries
3. Implement request rate limiting
4. Check for memory leaks:
   ```bash
   # Look for increasing memory in logs
   grep "memory" /var/log/render/*.log
   ```

---

## 🔧 Debugging Tools

### Check Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Filter by:
   - `error` - For errors
   - `build` - For build issues
   - `deploy` - For deployment issues

### Local Testing

```bash
# Simulate Render build exactly
npm run test:render

# Start built app
node .output/server/index.mjs

# Test health
curl http://localhost:3000/api/health | jq

# Test API
curl http://localhost:3000/api/planes
```

### Analyze Bundle

```bash
# Visualize bundle size
npm run analyze

# Check largest packages
npm ls --prod --json | jq '.dependencies | to_entries | sort_by(.value.size) | reverse | .[0:10]'
```

---

## 📞 Getting Help

1. **Check logs first** - Render Dashboard → Logs
2. **Test locally** - `npm run test:render`
3. **Health endpoint** - `/api/health`
4. **Compare branches** - `main` vs `refractor`

---

Last updated: 2026-02-24
