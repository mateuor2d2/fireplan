# Deploy v9planes on Render - Complete Guide

## Quick Start

```bash
# 1. Test build locally (simulates Render environment)
npm run test:render

# 2. Push to GitHub
git push origin refractor  # or main

# 3. Deploy on Render Dashboard
# Change branch to 'refractor' and click "Manual Deploy"
```

---

## What's New in This Version

### ✅ Optimizations Applied

| Optimization | Impact | Status |
|--------------|--------|--------|
| Fixed `.slugignore` | Includes `.output/` in slug | ✅ Critical fix |
| `npm prune --production` | Removes ~200MB devDependencies | ✅ Done |
| Removed unused deps (`three`, `better-sqlite3`) | Saves ~550KB | ✅ Done |
| Lazy loading for heavy components | Faster initial load | ✅ Done |
| Optimized Vite chunking | Better caching | ✅ Done |
| Brotli/Gzip compression | Faster transfers | ✅ Done |
| Graceful shutdown | Clean restarts | ✅ Done |
| Terser minification | Removes console logs in prod | ✅ Done |

### 📊 Expected Size Reduction

| Before | After | Reduction |
|--------|-------|-----------|
| ~2.0GB slug | ~1.2-1.5GB | ~25-40% |
| ~830MB node_modules | ~600MB | ~230MB |

---

## Deployment Options

### Option A: Blueprint Deploy (Recommended)

1. **Push to GitHub**:
   ```bash
   git push origin refractor
   ```

2. **In Render Dashboard**:
   - Go to your Web Service settings
   - Change **Branch** from `main` to `refractor`
   - Click "Manual Deploy" → "Deploy latest commit"

3. **Monitor the build**:
   - Build should complete in 5-10 minutes
   - Check logs for "✓ Build complete"
   - Health check should return 200 OK

### Option B: Manual Web Service

If creating new service:

| Setting | Value |
|---------|-------|
| Name | `v9planes-app` |
| Region | Frankfurt (EU) |
| Branch | `refractor` |
| Runtime | Node |
| Plan | Standard (1GB RAM minimum) |
| Build Command | See `render.yaml` |
| Start Command | `node .output/server/index.mjs` |

### Option C: Docker Deploy

```bash
# Build Docker image
docker build -t v9planes .

# Run locally
docker run -p 10000:10000 --env-file .env v9planes

# Push to Render (if using Docker on Render)
```

---

## Environment Variables

Configure these in Render Dashboard → Environment:

### Required

```env
# Database
ME_CONFIG_MONGODB_URL=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=preveniusimages
AWS_REGION=eu-west-1

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
API_KEY_MAILGUN=...
MG_DOMAIN=mg.prevenius.com

# Site
NUXT_PUBLIC_SITE_URL=https://your-app.onrender.com
```

### Optional

```env
# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Notifications
TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_WHATSAPP_FROM=...

# Documenso
DOCUMENSO_API_KEY=...
DOCUMENSO_BASE_URL=...
```

---

## Testing Before Deploy

### 1. Test Build Locally

```bash
# This simulates exactly what Render does
npm run test:render
```

Expected output:
```
✓ Dependencies installed
✓ Build complete
✓ DevDependencies removed
✓ Slug size: ~1200MB (within limits)
```

### 2. Start Built App Locally

```bash
# After test:render completes
node .output/server/index.mjs

# In another terminal
curl http://localhost:3000/api/health
```

Expected health response:
```json
{
  "status": "healthy",
  "checks": {
    "application": { "status": "ok" },
    "database": { "status": "connected" }
  }
}
```

### 3. Check Bundle Size

```bash
# Analyze bundle
npm run analyze
```

---

## Monitoring

### Health Endpoint

```bash
curl https://your-app.onrender.com/api/health
```

Returns:
- `200 OK` - App is healthy
- `503 Service Unavailable` - App has issues (check memory/database)

### Key Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Slug Size | <1.5GB | 1.5-2GB | >2GB |
| Memory Usage | <70% | 70-85% | >85% |
| Build Time | <10min | 10-15min | >15min |

---

## Troubleshooting

### "Slug size exceeds limit"

```bash
# Check what's taking space
du -sh node_modules/* | sort -rh | head -10

# If still too large, consider:
# 1. Remove more unused dependencies
# 2. Use Docker deployment
# 3. Pre-build strategy (see below)
```

### "Cannot find module" errors

This was fixed in `refractor` branch by keeping `.output/` in slug.
If you see this, ensure:
1. Using `refractor` branch (not `main`)
2. `.slugignore` does NOT exclude `.output/`
3. Build completed successfully

### Build times out

Increase memory in `render.yaml`:
```yaml
buildCommand: |
  NODE_OPTIONS=--max-old-space-size=6144 npm run build  # 6GB instead of 4GB
```

### Memory issues at runtime

Upgrade to Pro plan (2GB RAM) or optimize further:
- Check for memory leaks
- Add caching layer (Redis)
- Split heavy operations to background jobs

---

## Advanced: Pre-build Strategy

If slug size is still an issue, commit pre-built files:

```bash
# Build locally
npm ci
npm run build

# Commit build output
git add .output/
git commit -m "chore: add pre-built output"
git push

# Update render.yaml to skip build:
# buildCommand: echo "Using pre-built output"
```

⚠️ Only use if absolutely necessary - harder to maintain.

---

## Migration from Old Deploy

If you have an existing Render deployment:

1. **Backup first** - Export any important data
2. **Create new service** with `refractor` branch
3. **Copy environment variables** from old service
4. **Test thoroughly**
5. **Update DNS** if using custom domain
6. **Delete old service** after confirmation

---

## Support

- Render Docs: https://render.com/docs
- Nuxt Deployment: https://nuxt.com/deploy/render
- Health Check: `/api/health`

---

Last updated: 2026-02-24
Branch: `refractor`
