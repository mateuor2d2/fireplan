# Deployment Optimization - Execution Status

## Current Status: NOT STARTED

### Metrics (Before Optimization)
- node_modules: 1.6GB
- .output/server: 71MB
- .output/public: 4.9MB
- Build memory: 8GB required
- Deployment: FAILS on Render/Vercel

---

## Phase Progress

### Phase 1: Quick Wins (30 min) - ⏳ PENDING
- [ ] Remove three.js (32MB)
- [ ] Remove playwright-core (9.8MB)
- [ ] Remove better-sqlite3 (12MB)
- [ ] Update build scripts
- [ ] Create .npmignore
- [ ] Test build

**Expected Savings**: 600MB

### Phase 2: Bundle Optimization (1 hour) - ⏳ PENDING
- [ ] Update nuxt.config.ts
- [ ] Configure externals
- [ ] Add manual chunks
- [ ] Optimize Vite config

**Expected Savings**: 21MB server bundle

### Phase 3: PDF Refactor (2-3 hours) - ⏳ PENDING
- [ ] Extract PDF logic to separate file
- [ ] Implement lazy loading
- [ ] Configure chunking
- [ ] Test PDF generation

**Expected Savings**: 15MB initial bundle

### Phase 4: AWS SDK (30 min) - ⏳ PENDING
- [ ] Update S3 service to singleton
- [ ] Consider modular AWS SDK
- [ ] Test S3 uploads

**Expected Savings**: 6MB

### Phase 5: Lucide Icons (30 min) - ⏳ PENDING
- [ ] Remove lucide-vue-next
- [ ] Update components to use Iconify
- [ ] Test all icons

**Expected Savings**: 27MB

### Phase 6: Deployment Config (30 min) - ⏳ PENDING
- [ ] Create vercel.json
- [ ] Create render.yaml
- [ ] Add health endpoint
- [ ] Test deployment

**Expected Result**: Successful deployment

### Phase 7: Sharp Optimization (1 hour) - ⏳ PENDING
- [ ] Make Sharp optional
- [ ] Add fallback logic
- [ ] Test image processing

**Expected Savings**: 17MB

---

## Execution Log

### 2026-03-03 - Planning Phase
- Created optimization plan
- Identified root causes
- Documented all phases

---

## Commands to Execute

### Start Phase 1
```bash
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4

# 1. Remove unused packages
bun remove three playwright-core better-sqlite3

# 2. Clean install
bun run clean
rm -rf node_modules bun.lockb
bun install

# 3. Check size
du -sh node_modules

# 4. Test build
bun run build

# 5. Check output
du -sh .output/server
```

### Update Status After Phase 1
Update this file with:
```markdown
### Phase 1: Quick Wins - ✅ COMPLETED
**Date**: 2026-03-03
**Duration**: XX minutes
**Results**:
- node_modules: 1.6GB → XXX GB
- Build time: XX seconds
- Issues: None / [List issues]
```

---

## Target Metrics

| Metric | Current | Phase 1 | Phase 2 | Final | Target |
|--------|---------|---------|---------|-------|--------|
| node_modules | 1.6GB | 1.0GB | 0.9GB | 0.8GB | < 0.8GB |
| .output/server | 71MB | 50MB | 35MB | 30MB | < 30MB |
| Build memory | 8GB | 4GB | 3GB | 2GB | < 2GB |
| Deploy time | Timeout | 5min | 3min | 2min | < 3min |

---

## Next Actions

1. **IMMEDIATE**: Execute Phase 1 commands
2. **AFTER PHASE 1**: Update metrics and verify savings
3. **DECISION POINT**: If Phase 1 sufficient, deploy. Else continue to Phase 2.

---

## Files to Modify

### Phase 1
- [ ] `package.json` - Remove dependencies
- [ ] `.npmignore` - Create new file
- [ ] `bun.lockb` - Regenerate

### Phase 2
- [ ] `nuxt.config.ts` - Add optimizations
- [ ] `vite.config.ts` - Optional, for advanced config

### Phase 3
- [ ] `server/api/planes/[id]/generate-pdf.get.ts` - Refactor
- [ ] `server/utils/pdf-generator.ts` - Create new file

### Phase 6
- [ ] `vercel.json` - Create new file
- [ ] `render.yaml` - Create new file
- [ ] `server/api/health.get.ts` - Create new file

---

## Rollback Plan

If optimization breaks functionality:

1. **Git Revert**
```bash
git checkout package.json
bun install
```

2. **Restore Config**
```bash
git checkout nuxt.config.ts
```

3. **Full Restore**
```bash
git reset --hard HEAD
bun install
```

---

## Support & Resources

- Full Plan: `14-DEPLOYMENT-OPTIMIZATION-PLAN.md`
- Quick Start: `14-QUICK-START.md`
- Config Examples: `OPTIMIZED-NUXT-CONFIG.ts`
- Deployment: `VERCEL-RENDER-CONFIGS.md`

---

## Decision Tree

```
START
  ↓
Execute Phase 1
  ↓
Build successful?
  ├─ YES → Deploy to Vercel → Success? → DONE 🎉
  │                          └─ NO → Check logs, fix issues
  │
  └─ NO → Check error
           ↓
         Memory error? → Execute Phase 2
           ↓
         Dependency error? → Fix imports
           ↓
         Other → Check logs, debug
```

---

## Notes

- Execute phases sequentially
- Update metrics after each phase
- Commit changes after each successful phase
- Test deployment after Phase 1 + Phase 6
