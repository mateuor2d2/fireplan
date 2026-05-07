# Render Deployment Guide - v9planes

## ✅ Fixes Applied

### 1. Memory Optimization (Critical)
- **Disabled Nuxt Content** - Was triggering memory-intensive prerenderer
- **Disabled nuxt-og-image** - Was triggering memory-intensive prerenderer  
- **Using `vercel` preset** - Better memory-efficient chunking than `node-server`
- **Externalized heavy modules** - sharp, pdfmake, jspdf, html2canvas, qrcode

### 2. Path Resolution Fix
- Fixed import in `server/api/invoices/[id]/download.get.ts`
- Changed from `~/server/utils/stripe` to relative `../../../utils/stripe`
- Nuxt 4's `~` alias points to `app/` directory, not project root

### 3. Nuxt UI v4 Color Variants
- Fixed color prop values across 30+ components
- `red` → `error`
- `green` → `success`  
- `blue` → `info`
- `gray` → `neutral`
- `yellow` → `warning`

### 4. Render Configuration
- Updated `render.yaml` with all required environment variables
- Added Mailgun, Twilio, OAuth configs
- Build command uses memory optimization flags

## 🚀 Deploy to Render

### Option 1: Using Blueprint (Recommended)
1. Push these changes to the `refractor-v2` branch
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and configure everything

### Option 2: Manual Web Service
1. Create new Web Service
2. Connect to `refractor-v2` branch
3. Settings:
   - **Build Command**: `npm ci && NODE_OPTIONS="--max-old-space-size=4096" npm run build:render`
   - **Start Command**: `node .vercel/output/functions/__fallback.func/index.mjs`
   - **Health Check**: `/api/health`

### Required Environment Variables
Go to Render Dashboard → Environment and add:

```bash
# Database
ME_CONFIG_MONGODB_URL=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key

# AWS S3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Mailgun
API_KEY_MAILGUN=...
MG_DOMAIN=...

# Twilio (optional)
TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_WHATSAPP_FROM=...

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Site URL (auto-set by Render)
NUXT_PUBLIC_SITE_URL=https://v9planes-app.onrender.com
```

## ⚠️ Important Notes

1. **Nuxt Content Disabled**: The blog/content features won't work. To re-enable, you'll need a larger Render plan (2GB+ RAM).

2. **OG Images Disabled**: Social sharing images won't auto-generate.

3. **Build Time**: ~30-60 seconds on Render standard plan

4. **Memory Usage**: Build stays under 4GB with current optimizations

## 🔧 To Re-enable Nuxt Content (Future)

If you upgrade to a larger Render plan:

1. Uncomment in `nuxt.config.ts`:
   ```typescript
   '@nuxt/content',
   'nuxt-og-image',
   ```

2. Increase memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192"
   ```

3. Switch back to node-server preset:
   ```typescript
   preset: 'node-server'
   ```
   
   And update start command to:
   ```bash
   node .output/server/index.mjs
   ```

## 📝 Files Changed

- `nuxt.config.ts` - Memory optimization, disabled modules
- `render.yaml` - Updated build/start commands, added env vars
- `server/api/invoices/[id]/download.get.ts` - Fixed import path
- `app/components/**/*.vue` - Fixed color variants
- `package.json` - Already had build:render script

## ✅ Verification

Test the build locally:
```bash
bun run build
```

Should output: `✨ Build complete!`
