# Quick Start Guide: Directory-Based Nuxt 3 to Nuxt 4 Migration

## Overview

This guide provides step-by-step instructions for migrating the construction safety management SaaS application from `v9planesN3Bui3` (Nuxt 3) to `v9PLANESN4BUI4` (Nuxt 4) using a blue-green directory copy approach with zero downtime.

## Prerequisites

- Backup your current application
- Ensure all tests pass in current Nuxt 3 environment
- Create `v9PLANESN4BUI4` directory (already done)
- Have staging environment ready for testing
- Review migration documentation and data models

## Migration Timeline: 8 Days (Directory-Based Approach)

### Phase 1: Directory Setup & Copying (Days 1-2)

#### Day 1: Directory Preparation

```bash
# 1. Create complete backup of original directory
cp -r /home/mateu/NuxtsProjects/v9planesN3Bui3 /home/mateu/NuxtsProjects/v9planesN3Bui3_backup_$(date +%Y%m%d)

# 2. Verify source directory functionality
cd /home/mateu/NuxtsProjects/v9planesN3Bui3
pnpm run test
pnpm run build

# 3. Create database backup
mongodump --uri="mongodb://localhost:27017/preveniusdbDev" --out=/backup/$(date +%Y%m%d)
```

#### Day 2: Directory Copy & Initial Setup

```bash
# 1. Copy source to target directory
cp -r /home/mateu/NuxtsProjects/v9planesN3Bui3 /home/mateu/NuxtsProjects/v9PLANESN4BUI4

# 2. Work in target directory
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4

# 3. Copy environment configuration
cp /home/mateu/NuxtsProjects/v9planesN3Bui3/.env .

# 4. Add Nuxt 4 migration flags
echo "NUXT_4_MIGRATION_MODE=true" >> .env
echo "ENABLE_NUXT_4_FEATURES=false" >> .env
```

### Phase 2: Nuxt 4 Migration (Days 3-4)

#### Days 3-4: Framework Updates in Target Directory

```bash
# Work in target directory
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4

# 1. Update package.json for Nuxt 4
pnpm update nuxt@latest @nuxt/ui-pro@latest @nuxt/content@latest @nuxt/image@latest

# 2. Install migration codemods
pnpm add -D @codemod/nuxt-4-migration

# 3. Run automated migration
pnpm dlx codemod@latest nuxt/4/migration-recipe

# 4. Create new directory structure for Nuxt 4
mkdir -p app
mv pages app/
mv components app/
mv layouts app/
mv middleware app/
mv utils app/

# 5. Update configuration files
# Update nuxt.config.ts (see Configuration Updates section)
```

### Phase 3: Integration Testing (Days 5-6)

#### Days 5-6: External Integration Validation

**Configuration Updates:**

```typescript
// nuxt.config.ts - Key changes needed
export default defineNuxtConfig({
  // Remove: future: { compatibilityVersion: 4 }

  // Add enhanced TypeScript support
  typescript: {
    typeCheck: true,
    strict: true
  },

  // Update app configuration structure
  app: {
    head: {
      // Move existing head config here
    },
    baseURL: '/my-app/',
    cdnURL: 'https://cdn.com'
  },

  // Nitro optimizations
  nitro: {
    experimental: {
      wasm: true // For PDF generation improvements
    },
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  },

  // Enhanced development experience
  devtools: {
    enabled: true
  }
})
```

#### Day 5: Store and API Updates

**Pinia Store Validation:**

```typescript
// Verify all stores follow this pattern
// stores/planes.ts, stores/user.ts, etc.

export const usePlanesStore = defineStore('planes', {
  state: () => ({
    planes: [],
    currentPlan: null,
    loading: false
  }),

  getters: {
    // Existing getters should work
  },

  actions: {
    // Verify all async actions work with Nuxt 4
    async fetchPlanes() {
      // Existing logic - test thoroughly
    }
  }
})
```

**API Route Updates:**

```typescript
// Verify server routes for compatibility
// server/api/planes/[id]/generate-pdf.get.ts

export default defineEventHandler(async (event) => {
  // Existing logic should work
  // Test Sharp and pdfmake compatibility

  const plan = await getPlan(event)
  const pdf = await generatePlanPDF(plan)

  return pdf
})
```

### Phase 3: UI Components (5-7 Days)

#### Days 6-8: Nuxt UI v4 Migration

**Component Updates:**

```typescript
// Check for breaking changes in Nuxt UI v4
// Update component imports and props

// Before (may change):
<UButton @click="submit">Submit</UButton>
<UModal v-model="isOpen">
  <UCard>Content</UCard>
</UModal>

// After (verify with v4 docs):
<UButton variant="solid" @click="submit">Submit</UButton>
<UModal v-model:open="isOpen">
  <UCard>Content</UCard>
</UModal>
```

#### Days 9-10: Testing and Validation

```bash
# 1. Run comprehensive test suite
pnpm run test
pnpm run test:e2e
pnpm run test:performance

# 2. Test critical workflows
# - PDF generation with various plan types
# - Image upload and compression
# - Stripe payment processing
# - Documenso signature workflows

# 3. Performance validation
# - Build time should be 10x faster
# - PDF generation 25% faster
# - API responses under 200ms
```

### Phase 4: Validation (3-5 Days)

#### Days 11-13: Compliance and Integration Testing

**Legal Compliance Validation:**

```typescript
// Test compliance features
// - All audit trails preserved
// - RD 1627/1997 compliance maintained
// - eIDAS signature compatibility verified

// Enhanced compliance logging in Nuxt 4
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const userId = await getUserId(event)

  try {
    const result = await processSafetyPlan(event)

    // Enhanced logging for compliance
    await logComplianceEvent({
      userId,
      action: 'safety_plan_generated',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      result: result.id
    })

    return result
  } catch (error) {
    await logComplianceError({
      userId,
      error: error.message,
      timestamp: new Date()
    })
    throw error
  }
})
```

#### Days 14-15: Performance and Load Testing

**Performance Metrics Validation:**

```bash
# Expected improvements:
# - Build time: 10x faster
# - Bundle size: 15% reduction
# - PDF generation: 25% faster
# - API response: 20% improvement

# Run performance tests
pnpm run test:performance
pnpm run build --analyze
```

## Migration Validation Checklist

### ✅ Pre-Migration Validation
- [ ] All tests passing in Nuxt 3 environment
- [ ] Backup created and verified
- [ ] Staging environment prepared
- [ ] Dependencies compatibility checked

### ✅ Phase 1 Validation
- [ ] Core dependencies updated without errors
- [ ] Configuration migration completed
- [ ] Basic functionality verified
- [ ] TypeScript compilation successful

### ✅ Phase 2 Validation
- [ ] All stores working correctly
- [ ] API routes functioning properly
- [ ] Database operations stable
- [ ] External integrations working

### ✅ Phase 3 Validation
- [ ] UI components rendering correctly
- [ ] Nuxt UI v4 migration complete
- [ ] Image processing pipeline working
- [ ] PDF generation functional

### ✅ Phase 4 Validation
- [ ] Compliance requirements met
- [ ] Performance targets achieved
- [ ] Security measures intact
- [ ] User acceptance testing passed

## Rollback Procedure

If critical issues arise during migration:

```bash
# 1. Stop migration process
# 2. Restore from backup
git checkout v3-before-migration

# 3. Restore dependencies
pnpm install

# 4. Verify functionality
pnpm run test
pnpm run dev

# 5. Document issues and plan fixes
```

## Common Issues and Solutions

### Issue 1: TypeScript Compilation Errors
**Solution**: Update tsconfig.json for Nuxt 4 compatibility

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "types": ["@nuxt/types"]
  }
}
```

### Issue 2: Component Import Errors
**Solution**: Update import paths for new directory structure

```typescript
// Before: import MyComponent from '~/components/MyComponent.vue'
// After: import MyComponent from '~/components/MyComponent.vue'
// (verify ~ alias behavior in your setup)
```

### Issue 3: Build Performance Issues
**Solution**: Optimize Vite configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: ['pdfmake', 'sharp']
    }
  }
})
```

## Post-Migration Optimization

### Performance Enhancements
```typescript
// Enable caching for repeated operations
export default defineEventHandler(async (event) => {
  const cache = await useStorage('cache')
  const cacheKey = `result:${event.context.params.id}`

  let result = await cache.getItem(cacheKey)
  if (!result) {
    result = await computeExpensiveOperation(event)
    await cache.setItem(cacheKey, result, { ttl: 3600 })
  }

  return result
})
```

### Monitoring Setup
```typescript
// Add performance monitoring
export default defineEventHandler(async (event) => {
  const startTime = performance.now()

  try {
    const result = await processRequest(event)

    // Log performance metrics
    console.log(`Operation completed in ${performance.now() - startTime}ms`)

    return result
  } catch (error) {
    console.error(`Operation failed after ${performance.now() - startTime}ms`, error)
    throw error
  }
})
```

## Success Metrics

### Technical Metrics
- [ ] Build time reduction: 50%+
- [ ] Bundle size reduction: 15%+
- [ ] Type checking speed: 30%+ improvement
- [ ] Zero test failures

### Business Metrics
- [ ] PDF generation time: 25% improvement
- [ ] Image upload processing: 40% improvement
- [ ] API response times: 20% improvement
- [ ] Zero downtime during migration

### Compliance Metrics
- [ ] All audit trails preserved
- [ ] RD 1627/1997 compliance maintained
- [ ] eIDAS signature compatibility verified
- [ ] No data loss during migration

## Next Steps

After successful migration:

1. **Monitor Performance**: Track metrics for 2 weeks
2. **Remove Compatibility Code**: Gradually remove temporary shims
3. **Update Documentation**: Update developer guides and API docs
4. **Team Training**: Train developers on Nuxt 4 features
5. **Plan Next Updates**: Prepare for future Nuxt versions

## Support

For issues during migration:
- Check [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)
- Review [Nuxt UI v4 Migration](https://ui.nuxt.com/getting-started/upgrade)
- Monitor GitHub issues for package-specific updates
- Use staging environment for extensive testing