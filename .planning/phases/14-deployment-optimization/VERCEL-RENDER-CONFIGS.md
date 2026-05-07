# Deployment Configurations for Vercel and Render

## Vercel Configuration

### vercel.json (Root Directory)
```json
{
  "version": 2,
  "buildCommand": "bun run build:render",
  "outputDirectory": ".output/public",
  "installCommand": "bun install",
  "framework": "nuxtjs",
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=2048",
    "NITRO_PRESET": "vercel"
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### Environment Variables (Vercel Dashboard)
Set these in Vercel dashboard → Settings → Environment Variables:

```
ME_CONFIG_MONGODB_URL=mongodb+srv://...
API_KEY_MAILGUN=...
MG_DOMAIN=...
TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_WHATSAPP_FROM=...
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLISHABLE_KEY=...
NUXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## Render Configuration

### render.yaml (Root Directory)
```yaml
services:
  # Web Service
  - type: web
    name: prevenius-app
    env: node
    region: oregon
    plan: free
    branch: main
    buildCommand: |
      curl -fsSL https://bun.sh/install | bash
      export BUN_INSTALL="$HOME/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
      bun install
      bun run build:render
    startCommand: |
      export BUN_INSTALL="$HOME/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
      bun run preview
    envVars:
      - key: NODE_OPTIONS
        value: --max-old-space-size=2048
      - key: NITRO_PRESET
        value: node-server
      - key: NODE_ENV
        value: production
      - key: ME_CONFIG_MONGODB_URL
        sync: false
      - key: API_KEY_MAILGUN
        sync: false
      - key: MG_DOMAIN
        sync: false
      - key: TWILIO_SID
        sync: false
      - key: TWILIO_TOKEN
        sync: false
      - key: TWILIO_WHATSAPP_FROM
        sync: false
      - key: AWS_REGION
        value: eu-west-1
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_BUCKET_NAME
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GITHUB_CLIENT_ID
        sync: false
      - key: GITHUB_CLIENT_SECRET
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: NUXT_PUBLIC_SITE_URL
        value: https://your-app.onrender.com
    healthCheckPath: /api/health

  # Redis (optional, for caching)
  - type: redis
    name: prevenius-redis
    region: oregon
    plan: free
    maxmemoryPolicy: allkeys-lru
```

### Render Dashboard Setup
1. Go to https://dashboard.render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`
5. Review and apply

### Manual Environment Variables
If not using render.yaml, set these manually:

```
NODE_OPTIONS=--max-old-space-size=2048
NITRO_PRESET=node-server
NODE_ENV=production
ME_CONFIG_MONGODB_URL=mongodb+srv://...
... (same as Vercel)
```

---

## Alternative: Docker Deployment

### Dockerfile (Root Directory)
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build
FROM base AS builder
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build:render

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NUXT_HOST 0.0.0.0
ENV NUXT_PORT 3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/prevenius
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

---

## Health Check Endpoint

Add this to verify deployment:

```typescript
// server/api/health.get.ts
export default defineEventHandler(() => {
  const memory = process.memoryUsage()
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memory.rss / 1024 / 1024) + 'MB'
    },
    nodeVersion: process.version,
    platform: process.platform
  }
})
```

---

## Deployment Checklist

### Before Deploy
- [ ] Run `bun run clean`
- [ ] Run `bun install`
- [ ] Run `bun run build:render` successfully
- [ ] Check `.output/server` size < 50MB
- [ ] All environment variables ready
- [ ] Health endpoint added

### Vercel Deploy
```bash
# Install Vercel CLI
bun add -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Check logs
vercel logs --follow
```

### Render Deploy
```bash
# Option 1: Using render.yaml
git add render.yaml
git commit -m "Add Render configuration"
git push

# Option 2: Manual
# Go to Render dashboard and create new Web Service
# Connect GitHub repo
# Set build/start commands from render.yaml
```

### Post-Deploy Verification
```bash
# Check health
curl https://your-app.vercel.app/api/health
curl https://your-app.onrender.com/api/health

# Test PDF generation
curl -I https://your-app.vercel.app/api/planes/[PLAN_ID]/generate-pdf?template=[TEMPLATE]

# Check memory usage in dashboard
# Vercel: Dashboard → Project → Analytics
# Render: Dashboard → Service → Metrics
```

---

## Troubleshooting

### Build Fails on Vercel
```bash
# Increase memory in vercel.json
"build": {
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=6144"  # Try 6GB
  }
}
```

### Build Fails on Render
1. Check build logs
2. Verify Bun is installed correctly
3. Increase plan to Starter ($7/mo) if needed
4. Check memory usage during build

### Runtime Errors
```bash
# Check logs
# Vercel: vercel logs
# Render: Dashboard → Logs

# Common issues:
# - Missing env vars
# - Database connection timeout
# - Memory limit exceeded
```

### Memory Limit Exceeded
```bash
# Reduce memory usage:
# 1. Lazy load pdfmake
# 2. Stream large responses
# 3. Use pagination for lists
# 4. Add caching
```

---

## Cost Comparison

### Free Tier Limits
| Platform | Memory | Build Time | Bandwidth | Cost |
|----------|--------|-----------|-----------|------|
| Vercel   | 1GB    | 45 min    | 100GB     | Free |
| Render   | 512MB  | Unlimited | 100GB     | Free |
| Railway  | 512MB  | Unlimited | 100GB     | Free |

### Recommended for This Project
- **Vercel**: Better for Nuxt, easier setup
- **Render**: Better build time, more generous
- **Railway**: Alternative if both fail

### Paid Options (if free tier insufficient)
- **Vercel Pro**: $20/mo - 8GB memory
- **Render Starter**: $7/mo - 512MB more RAM
- **Railway**: Pay-as-you-go
