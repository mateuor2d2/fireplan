# GSD Plan: Deployment Optimization for Render/Vercel

## Executive Summary
**Problem**: Project requires 8GB memory to build and fails to deploy on Render/Vercel
**Root Cause**: Excessive dependencies (1.6GB node_modules), heavy PDF generation (pdfmake 71MB server bundle), unused libraries (three.js 32MB)
**Goal**: Reduce build memory to <2GB and deploy successfully on free tiers

---

## Current State Analysis

### Build Metrics (Current)
```
node_modules:      1.6GB  ❌ UNACCEPTABLE
.output/server:    71MB   ❌ TOO LARGE
.output/public:    4.9MB  ✓ OK
server node_modules: 56MB ❌ SHOULD BE <20MB
```

### Top Heavy Dependencies
```
three:              32MB  ❌ NOT USED - REMOVE
lucide-vue-next:    29MB  ⚠️  CONSIDER TREE-SHAKING
@nuxt:             28MB  ✓  REQUIRED
ipx:               18MB  ⚠️  IMAGE PROCESSING
@img:              17MB  ⚠️  SHARP DEPS
core-js:           16MB  ⚠️  CHECK IF NEEDED
@aws-sdk:          8.4MB ⚠️  S3 ONLY
pdfmake:           ~5MB  ❌ HEAVY - REPLACE
```

### Critical Issues
1. **PDF Generation**: 1400+ lines using pdfmake + custom fonts (server/utils/vfs_fonts.js)
2. **Image Processing**: Sharp + ipx for image manipulation
3. **Three.js**: 32MB phantom dependency (unused)
4. **AWS SDK**: Full SDK for S3 uploads only
5. **Lucide Icons**: Full package not tree-shaken

---

## GSD Implementation Plan

### Phase 1: Quick Wins (30 min) - EST. SAVINGS: 300MB
**Priority: CRITICAL - Do First**

#### 1.1 Remove Unused Dependencies
```bash
# Check for unused packages
bun remove three  # 32MB SAVED
bun remove playwright-core  # 9.8MB (if not used for testing)
bun remove better-sqlite3  # 12MB (using MongoDB)
```

#### 1.2 Update package.json Scripts
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=2048' nuxt build",
    "build:render": "NODE_OPTIONS='--max-old-space-size=4096' nuxt build",
    "postinstall": "nuxt prepare && npm prune --production"
  }
}
```

#### 1.3 Add .npmignore
```
tests/
**/*.test.ts
**/*.spec.ts
.editorconfig
.gitignore
.prettierrc
tsconfig.json
```

**Deliverable**: node_modules reduced to ~1.3GB

---

### Phase 2: Bundle Optimization (1 hour) - EST. SAVINGS: 40MB

#### 2.1 Optimize nuxt.config.ts
```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',
    externals: {
      external: [
        'sharp',
        'pdfmake',
        'jspdf',
        'html2canvas',
        'qrcode',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner'
      ]
    },
    rollupConfig: {
      external: [
        'sharp',
        'pdfmake',
        'jspdf',
        'html2canvas',
        'qrcode',
        '@aws-sdk/client-s3'
      ]
    },
    // Add experimental features
    experimental: {
      wasm: false
    }
  },
  
  vite: {
    build: {
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'ui': ['@nuxt/ui', 'reka-ui']
          }
        }
      }
    }
  },
  
  // Tree-shake lucide icons
  components: [
    {
      path: '~/components',
      extensions: ['.vue']
    }
  ]
})
```

#### 2.2 Add Build Optimizations
Create `nuxt.build.config.ts`:
```typescript
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  hooks: {
    'build:manifest': (manifest) => {
      // Remove unused CSS
      const unusedStyles = ['ModalTemplateCreate']
      unusedStyles.forEach(name => {
        if (manifest[name]?.css) {
          delete manifest[name].css
        }
      })
    }
  }
})
```

**Deliverable**: .output/server reduced to ~50MB

---

### Phase 3: PDF Generation Refactor (2-3 hours) - EST. SAVINGS: 30MB+

**CRITICAL DECISION**: Choose ONE approach

#### Option A: External PDF Service (RECOMMENDED)
- Use external API (Browserless, Puppeteer Cloud, PDFShift)
- Move PDF generation to edge function
- **Pros**: Zero server bundle impact, scalable
- **Cons**: External dependency, cost

#### Option B: Replace pdfmake with lighter alternative
- Use `@aspect-ratio/core` + `puppeteer-core` (lazy loaded)
- Or use client-side PDF generation with `jspdf-autotable`
- **Pros**: Smaller bundle, more control
- **Cons**: Still heavy, requires refactoring

#### Option C: Lazy Load pdfmake (CURRENT APPROACH - IMPROVE)
```typescript
// server/api/planes/[id]/generate-pdf.get.ts
export default defineEventHandler(async (event) => {
  // Lazy import ONLY when needed
  const { generatePdf } = await import(
    /* webpackChunkName: "pdf-generator" */
    '../../../utils/pdf-generator'
  )
  
  return await generatePdf(planData)
})
```

Create separate chunk configuration:
```typescript
// nuxt.config.ts
nitro: {
  rollupConfig: {
    output: {
      manualChunks(id) {
        if (id.includes('pdfmake') || id.includes('vfs_fonts')) {
          return 'pdf-worker'
        }
      }
    }
  }
}
```

**Implementation Steps (Option C - Recommended for now)**:
1. Extract PDF logic to `server/utils/pdf-generator.ts`
2. Implement lazy loading with dynamic import
3. Add error handling for memory limits
4. Configure separate chunking
5. Add streaming response for large PDFs

**Deliverable**: pdfmake only loaded on-demand, 15MB initial bundle reduction

---

### Phase 4: AWS SDK Optimization (30 min) - EST. SAVINGS: 6MB

#### 4.1 Replace Full AWS SDK with Modular
```bash
bun remove @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
bun add @aws-sdk/lib-storage
```

#### 4.2 Update S3 Service
```typescript
// server/api/services/s3.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Create singleton client
let s3Client: S3Client | null = null

export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
  }
  return s3Client
}
```

**Deliverable**: AWS SDK reduced from 8.4MB to ~2MB

---

### Phase 5: Lucide Icons Optimization (30 min) - EST. SAVINGS: 25MB

#### 5.1 Implement Tree Shaking
```typescript
// plugins/lucide-icons.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only import used icons
  const icons = await import('lucide-vue-next')
  
  return {
    provide: {
      icons: {
        Menu: icons.Menu,
        User: icons.User,
        // ... only used icons
      }
    }
  }
})
```

#### 5.2 Or Use Iconify
```bash
bun remove lucide-vue-next
bun add @iconify-json/lucide
```

Then use with Nuxt Icon:
```vue
<Icon name="lucide:menu" />
```

**Deliverable**: Icons reduced from 29MB to ~2MB

---

### Phase 6: Deployment Configuration (30 min)

#### 6.1 Create `vercel.json`
```json
{
  "buildCommand": "bun run build:render",
  "outputDirectory": ".output/public",
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

#### 6.2 Create `render.yaml`
```yaml
services:
  - type: web
    name: prevenius-app
    env: node
    buildCommand: bun run build:render
    startCommand: bun run preview
    envVars:
      - key: NODE_OPTIONS
        value: --max-old-space-size=2048
      - key: NITRO_PRESET
        value: node-server
    plan: free
    branch: main
```

#### 6.3 Add Health Check
```typescript
// server/api/health.get.ts
export default defineEventHandler(() => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  memory: process.memoryUsage()
}))
```

**Deliverable**: Ready for deployment on both platforms

---

### Phase 7: Sharp/Image Optimization (1 hour) - EST. SAVINGS: 15MB

#### 7.1 Move Sharp to Optional Dependency
```json
{
  "optionalDependencies": {
    "sharp": "^0.34.5"
  }
}
```

#### 7.2 Implement Fallback
```typescript
// server/utils/imageCompression.ts
let sharp: any = null

try {
  sharp = await import('sharp')
} catch (e) {
  console.warn('Sharp not available, using fallback')
}

export async function compressImage(buffer: Buffer) {
  if (sharp) {
    return sharp(buffer).resize(800).jpeg({ quality: 80 }).toBuffer()
  }
  // Fallback: return original
  return buffer
}
```

**Deliverable**: Sharp becomes optional, reduces bundle by 17MB

---

## Success Metrics

### Target Metrics
- [ ] node_modules: < 800MB (currently 1.6GB)
- [ ] .output/server: < 30MB (currently 71MB)
- [ ] Build memory: < 4GB (currently 8GB)
- [ ] Deploy time: < 5 min (currently times out)
- [ ] Runtime memory: < 512MB

### Validation Steps
1. Run `bun run clean && bun install`
2. Run `du -sh node_modules` → Should be < 800MB
3. Run `bun run build:render` → Should complete with 4GB limit
4. Run `du -sh .output/server` → Should be < 30MB
5. Deploy to Render free tier → Should succeed
6. Test PDF generation → Should work (may be slower)

---

## Implementation Order (Priority)

### Week 1: Critical Fixes
1. ✅ Phase 1: Quick Wins (30 min)
2. ✅ Phase 4: AWS SDK (30 min)
3. ✅ Phase 5: Lucide Icons (30 min)
4. ✅ Phase 6: Deployment Config (30 min)

### Week 2: Bundle Optimization
5. ✅ Phase 2: Bundle Optimization (1 hour)
6. ✅ Phase 3: PDF Refactor (2-3 hours)
7. ✅ Phase 7: Sharp Optimization (1 hour)

**Total Time**: ~8 hours
**Expected Savings**: ~800MB node_modules, ~40MB server bundle
**Deployment Status**: Should deploy successfully on free tiers

---

## Risk Mitigation

### PDF Generation Risk
- **Fallback**: Keep current implementation but lazy-loaded
- **Alternative**: Use client-side PDF generation for users
- **External**: Consider Browserless.io for $29/mo

### Image Processing Risk
- **Fallback**: Accept original images if Sharp unavailable
- **CDN**: Use Cloudinary free tier for image transforms

### Memory Spikes Risk
- **Monitor**: Add memory logging to health endpoint
- **Limit**: Set max file sizes for uploads
- **Queue**: Consider Bull/BullMQ for heavy operations

---

## Post-Deployment Checklist

- [ ] Health endpoint returns 200 OK
- [ ] PDF generation works (test with sample plan)
- [ ] Image uploads work
- [ ] Authentication works
- [ ] Database connection stable
- [ ] Memory usage under 512MB
- [ ] Response times acceptable
- [ ] Error tracking configured (Sentry?)

---

## Notes

### Dependencies to Monitor
- `md-editor-v3` - Consider if really needed
- `handlebars` - Only used in PDF generation
- `twilio` - Only for WhatsApp, could be external service
- `stripe` - Required, keep

### Future Optimizations
- Move PDF generation to AWS Lambda / Cloudflare Workers
- Use Cloudinary for all image processing
- Implement CDN caching
- Add Redis for session management
- Consider moving to monorepo with shared utilities

---

## Commands Reference

```bash
# Clean and rebuild
bun run clean && bun install && bun run build:render

# Check bundle size
du -sh node_modules .output/server .output/public

# Analyze dependencies
bun pm ls | grep -E "MB|GB"

# Test memory usage
NODE_OPTIONS=--max-old-space-size=2048 bun run build

# Deploy to Vercel
vercel --prod

# Deploy to Render
# Push to main branch after render.yaml is committed
```

---

## Contact & Support

If deployment still fails after these optimizations:
1. Check build logs for specific error
2. Monitor memory usage during build
3. Consider upgrading to paid tier (Render Starter $7/mo)
4. Alternative: Railway.app or Fly.io (better free tiers)

**Next Step**: Execute Phase 1 (Quick Wins) immediately
