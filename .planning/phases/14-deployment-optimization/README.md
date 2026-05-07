# Phase 14: Deployment Optimization

## Overview
Optimize the application for successful deployment on Render and Vercel by reducing bundle size and memory requirements.

## Problem
- **Current**: Requires 8GB memory to build
- **Symptom**: Deployment fails on free tiers
- **Root Cause**: 
  - 1.6GB node_modules
  - 71MB server bundle
  - Unused dependencies (three.js 32MB)
  - Heavy PDF generation with pdfmake

## Solution
7-phase optimization plan to reduce memory to <2GB and deploy successfully.

## Quick Links

- **[Full Plan](./14-DEPLOYMENT-OPTIMIZATION-PLAN.md)** - Detailed implementation guide
- **[Quick Start](./14-QUICK-START.md)** - Execute Phase 1 in 30 minutes
- **[Execution Status](./14-EXECUTION-STATUS.md)** - Track progress
- **[Config Examples](./OPTIMIZED-NUXT-CONFIG.ts)** - Optimized configuration
- **[Deployment Configs](./VERCEL-RENDER-CONFIGS.md)** - Vercel/Render setup

## Execute Now

### Option 1: Automated Script
```bash
./.planning/phases/14-deployment-optimization/execute-phase1.sh
```

### Option 2: Manual Execution
```bash
# Remove unused deps
bun remove three playwright-core better-sqlite3

# Clean and reinstall
bun run clean && bun install

# Test build with 4GB
NODE_OPTIONS='--max-old-space-size=4096' bun run build
```

## Expected Results

| Metric | Before | After Phase 1 | After All Phases | Target |
|--------|--------|---------------|------------------|--------|
| node_modules | 1.6GB | ~1.0GB | ~0.8GB | < 0.8GB |
| Server bundle | 71MB | ~50MB | ~30MB | < 30MB |
| Build memory | 8GB | 4GB | 2GB | < 2GB |
| Deploy status | ❌ Fail | ⚠️ Maybe | ✅ Success | ✅ |

## Timeline

- **Phase 1** (30 min): Quick wins - Remove unused deps
- **Phase 2** (1 hour): Bundle optimization
- **Phase 3** (2-3 hours): PDF refactor (optional)
- **Phase 4-7** (2-3 hours): Additional optimizations

**Total**: 8 hours for full optimization

## Success Criteria

- [ ] Build completes with 4GB memory limit
- [ ] Server bundle < 50MB
- [ ] Deploys successfully to Vercel/Render
- [ ] All functionality works (PDF gen, S3, auth)
- [ ] Health endpoint returns 200 OK

## Next Steps

1. **Execute Phase 1** (use script or manual)
2. **Check metrics** (node_modules size, build output)
3. **Test build** (with 4GB limit)
4. **Deploy to Vercel** (create vercel.json first)
5. **If fails**, continue to Phase 2

## Support

- Check logs: `vercel logs` or Render dashboard
- Memory issues: Increase to 6GB temporarily
- Build errors: Check dependency conflicts
- Runtime errors: Check environment variables

## Files Structure

```
14-deployment-optimization/
├── README.md (this file)
├── 14-DEPLOYMENT-OPTIMIZATION-PLAN.md (full plan)
├── 14-QUICK-START.md (quick commands)
├── 14-EXECUTION-STATUS.md (progress tracking)
├── OPTIMIZED-NUXT-CONFIG.ts (config reference)
├── VERCEL-RENDER-CONFIGS.md (deployment configs)
└── execute-phase1.sh (automation script)
```

---

**Status**: ⏳ READY TO START
**Priority**: 🔴 HIGH
**Estimated Time**: 30 min - 8 hours (depending on phases needed)
