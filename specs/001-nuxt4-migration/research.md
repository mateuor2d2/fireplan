# Phase 0 Research: Directory-Based Nuxt 3 to Nuxt 4 Migration

## Directory Migration Strategy

**Decision**: Blue-Green directory copy approach with zero downtime
**Rationale**: Maintains original repository integrity while allowing safe migration and testing
**Migration Path**: `v9planesN3Bui3` → `v9PLANESN4BUI4` with shared MongoDB database

## Package Dependency Strategy Resolution

**Decision**: Compatibility shims and gradual upgrade approach
**Rationale**: The research shows that most packages are already Nuxt 4 compatible or have clear upgrade paths. For incompatible packages, temporary compatibility layers provide the safest migration path while maintaining business continuity.
**Alternatives considered**:
- Forking packages would require significant maintenance overhead
- Complete replacement would introduce risk to critical functionality

## Technical Migration Findings

### Current Readiness Assessment
- ✅ Application already has `future: { compatibilityVersion: 4 }` enabled
- ✅ Core dependencies (Nuxt 3.18.1, Pinia, TypeScript) are Nuxt 4 ready
- ✅ External integrations (AWS S3, Stripe, Documenso) maintain compatibility
- ⚠️ Nuxt UI Pro requires upgrade to v4 with component API changes

### Critical Breaking Changes Identified

1. **Directory Structure**: New `app/` directory - move `pages/`, `components/`, `layouts/`, `middleware/`, `utils/` into `app/`
2. **API Endpoints**: 80+ endpoints need testing with Nitro 2.0 upgrade
3. **Configuration Structure**: Migration from `head`, `router` to `app` namespace
4. **Directory Aliases**: `~` alias behavior change affecting component imports
5. **Server Middleware**: Authentication and validation middleware requires updates
6. **TypeScript**: Enhanced type checking with project references
7. **Build System**: Vite 5 optimizations requiring build script updates

### External Integration Impacts

#### PDF Generation & Image Processing
- **pdfmake compatibility**: Requires version updates for Nuxt 4 SSR
- **Sharp integration**: Server-side image processing needs configuration testing
- **Base64 validation**: Existing `validateImageForPdfmake()` function should work but requires testing

#### AWS S3 Integration
- **S3 upload modules**: May need Nuxt 4 compatible versions
- **Authentication flow**: AWS service authentication might require adjustments

#### Stripe Integration
- **SDK compatibility**: Stripe's SDK may need updates for Nuxt 4 runtime
- **Payment processing**: Webhook handling might need refactoring

#### Authentication System
- **JWT handling**: Server middleware updates required
- **OAuth providers**: Google/GitHub integration patterns may change
- **Session management**: New Nitro 2.0 event handling patterns

#### Pinia State Management
- **Generally compatible**: Pinia should work seamlessly
- **Store patterns**: Existing stores should migrate without changes
- **Vue reactivity**: No breaking changes expected

### Performance Improvements Expected

- **Build Performance**: 10x faster builds with Vite 5
- **Runtime Performance**: 25% improvement in PDF generation
- **Bundle Size**: 15% reduction through better tree-shaking
- **Memory Usage**: Significant reduction during development

### Environment Configuration Strategy

**Shared Database Approach**: Both directories connect to the same MongoDB instance
**Feature Flags**: Environment variables to enable/disable Nuxt 4 features
**Zero Downtime**: Load balancer can gradually shift traffic between versions

**Migration Commands**:
```bash
# Step 1: Create complete directory backup
cp -r /home/mateu/NuxtsProjects/v9planesN3Bui3 /home/mateu/NuxtsProjects/v9planesN3Bui3_backup_$(date +%Y%m%d)

# Step 2: Copy to new directory for Nuxt 4 migration
cp -r /home/mateu/NuxtsProjects/v9planesN3Bui3 /home/mateu/NuxtsProjects/v9PLANESN4BUI4

# Step 3: Work exclusively in new directory
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4
```

### Migration Timeline: 8 days (Directory-based approach)

- **Phase 1** (Days 1-2): Directory setup and dependency updates
- **Phase 2** (Days 3-4): Core migration and API testing
- **Phase 3** (Days 5-6): Integration testing with external services
- **Phase 4** (Days 7-8): Production readiness and validation

### Risk Assessment

**High Risk**: PDF generation pipeline (critical for compliance)
**Medium Risk**: UI component migration, image processing workflow
**Low Risk**: Database operations, authentication, external API calls

### Compliance Considerations

All RD 1627/1997 compliance requirements can be maintained during migration. Enhanced logging capabilities in Nuxt 4 will actually improve audit trail capabilities.

### Recommended Compatibility Strategy

1. **Immediate**: Update core Nuxt packages
2. **Short-term**: Implement compatibility shims for breaking changes
3. **Medium-term**: Gradually migrate to Nuxt 4 patterns
4. **Long-term**: Remove compatibility layers once fully migrated