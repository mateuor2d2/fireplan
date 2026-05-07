# Codebase Concerns

**Analysis Date:** 2025-01-16

## Tech Debt

**Large Files (Maintenance Burden):**
- Issue: Several files exceed 1,000 lines, making them difficult to navigate and maintain
- Files:
  - `server/api/planes/[id]/generate-pdf.get.ts` (1,947 lines)
  - `app/stores/planes.ts` (1,487 lines)
  - `app/stores/conceptos.ts` (1,423 lines)
  - `app/pages/protected/planes/[[id]]/presupuesto.vue` (1,329 lines)
  - `app/pages/protected/usuarios/[[id]]/settings.vue` (1,406 lines)
- Impact: Reduced code maintainability, difficulty in testing, higher cognitive load for developers
- Fix approach: Break down into smaller modules following Single Responsibility Principle. Extract PDF generation logic into separate services. Split large components into smaller sub-components.

**Excessive `any` Types:**
- Issue: Widespread use of `any` type defeats TypeScript's type safety benefits
- Files: `app/stores/planes.ts`, `app/stores/conceptos.ts`, `app/stores/presupuestos.ts`, `app/stores/user.ts`, `app/utils/templateHelpers.ts`
- Impact: Loss of type safety, runtime errors that should be caught at compile time, reduced IDE support
- Fix approach: Define proper interfaces for all data structures. Replace `any` with specific types or generics. Enable strict TypeScript mode.

**Debug Logging in Production:**
- Issue: Extensive console.log statements throughout the codebase, including in production paths
- Files: `app/stores/planes.ts` (100+ console.log statements), `server/api/planes/[id]/generate-pdf.get.ts` (50+ console.log statements), `server/api/conceptos.getMiniConceptos.ts`
- Impact: Performance degradation, information leakage in production, console noise
- Fix approach: Implement proper logging framework with log levels (winston, pino). Remove or conditionally disable debug logs in production. Use structured logging for better observability.

**Incomplete Admin Features:**
- Issue: Admin functionality has placeholder implementations without actual logic
- Files: `app/pages/protected/admin/defaults.vue`, `server/api/admin/presupuesto-defaults.put.ts`
- Impact: Admin cannot manage defaults properly, system configuration incomplete
- Fix approach: Implement TODO items at lines 406-444 in defaults.vue. Add proper admin role checking when user model has isAdmin field (already noted in code).

**Duplicate Code in Worktrees:**
- Issue: `.auto-claude/worktrees/` directory contains duplicate code artifacts that may cause confusion
- Files: `.auto-claude/worktrees/tasks/001-error-qr-service/`, `.auto-claude/worktrees/tasks/001-qrservice-error/`
- Impact: Disk space usage, potential confusion about which codebase is active, maintenance overhead
- Fix approach: Clean up worktree artifacts after task completion. Add gitignore patterns if these are temporary. Document worktree cleanup process.

**Package Manager Inconsistency:**
- Issue: Package manager inconsistency between package.json declaration and actual usage
- Files: `package.json` specifies "pnpm@10.11.0" but CLAUDE.md mentions bun 10.11.0
- Impact: Dependency installation issues, potential lock file conflicts, developer confusion
- Fix approach: Standardize on one package manager. Update documentation to match actual usage. Ensure lock files (bun.lockb, bun-lock.yaml, pnpm-lock.yaml) are properly managed.

## Known Bugs

**QR Code Functionality Issues:**
- Symptoms: QR code feature exists but doesn't show properly (based on recent commit message "qr functionality exists but dont shows")
- Files: `server/api/planes/[id]/toggle-qr.post.ts` (untracked), `app/schemas/qr.ts`, `app/types/qr.ts`
- Trigger: QR code generation or display
- Workaround: None documented
- Fix approach: Investigate QR code display logic. Verify QR code data flow from generation to display. Check component rendering and state management.

**Image Placeholder Processing:**
- Symptoms: Complex placeholder handling for images in PDFs with multiple formats (IMG_PLACEHOLDER_X vs __IMG_PLACEHOLDER_X__)
- Files: `server/api/planes/[id]/generate-pdf.get.ts` (lines 604-1005)
- Trigger: PDF generation with images
- Workaround: System attempts to handle both formats but has extensive fallback logic
- Fix approach: Standardize on one placeholder format. Remove legacy placeholder handling. Simplify image processing pipeline.

## Security Considerations

**Weak JWT Secret Default:**
- Risk: Default JWT secret 'your-secret-key' allows token forgery if not overridden
- Files: `server/utils/auth.ts` (line 6)
- Current mitigation: Environment variable override with default fallback
- Recommendations: Remove default value. Fail fast if JWT_SECRET not configured. Add secret complexity validation. Rotate secrets periodically.

**Potential XSS in Markdown Rendering:**
- Risk: User-generated markdown rendered to HTML without sanitization
- Files: `app/components/Memorias.vue` (line 493), `server/api/planes/[id]/generate-pdf.get.ts` (uses marked library)
- Current mitigation: MarkdownIt library (somewhat safe but not complete)
- Recommendations: Implement HTML sanitization (DOMPurify, sanitize-html). Validate and sanitize user input before rendering. Use CSP to mitigate rendered HTML risks.

**Admin Authorization Bypass:**
- Risk: Admin endpoints check for user authentication but not admin role
- Files: `server/api/admin/presupuesto-defaults.put.ts` (lines 26-32), other admin endpoints
- Current mitigation: Commented TODO indicates awareness of the issue
- Recommendations: Implement isAdmin field in User model. Add admin role checks to all admin endpoints. Create role-based access control middleware.

**Environment Variable Exposure:**
- Risk: 95+ environment variable usages without validation or type checking
- Files: Throughout codebase
- Current mitigation: RuntimeConfig in nuxt.config.ts
- Recommendations: Add environment variable validation schema. Fail fast on missing required variables. Use type-safe environment variable access. Document all required environment variables.

**Secret Management:**
- Risk: .env file exists and may contain secrets in git history
- Files: `.env`, `.gitignore` shows .env is ignored
- Current mitigation: .gitignore excludes .env files
- Recommendations: Ensure .env.example is provided. Check git history for accidentally committed secrets. Use secret scanning (git-secrets, truffleHog). Rotate potentially exposed secrets.

**Public QR Code Endpoints:**
- Risk: Public QR code access endpoints have no rate limiting (documented as TODO)
- Files: `server/api/planes/[id]/generate-qr.post.ts` and related public endpoints
- Current mitigation: Token validation and expiration checking
- Recommendations: Implement rate limiting (100 req/hour for access, 20/hr for PDF downloads). Add IP-based throttling. Monitor abuse patterns. Add CAPTCHA for repeated access.

## Performance Bottlenecks

**PDF Generation Performance:**
- Problem: PDF generation is resource-intensive with synchronous image processing
- Files: `server/api/planes/[id]/generate-pdf.get.ts` (1,947 lines, processes images synchronously)
- Cause: Multiple image conversions (URL → base64), compression, validation in request path
- Improvement path: Implement async PDF generation queue. Cache converted images. Use background job processing (Bull, Agenda). Pre-process images on upload. Stream PDF responses for large documents.

**Database Query Inefficiency:**
- Problem: Mixed usage of lean() vs non-lean queries (50 lean queries found, many non-lean)
- Files: Throughout `server/api/`
- Cause: Inconsistent query patterns, some queries return full Mongoose documents
- Improvement path: Standardize on lean() queries for read operations. Use projections to limit returned fields. Add database indexes for common queries. Implement query result caching.

**N+1 Query Problem:**
- Problem: Potential N+1 queries when fetching partidas with concepto lookups
- Files: `server/api/planes/[id]/generate-pdf.get.ts` (lines 1792-1843), `app/stores/planes.ts`
- Cause: Looping through partidas and fetching conceptos individually
- Improvement path: Use $lookup aggregation or populate() to fetch related data in single query. Batch concepto lookups. Cache concepto data in memory.

**No Response Caching:**
- Problem: No caching layer for frequently accessed data
- Files: Throughout `server/api/`
- Cause: All requests hit database
- Improvement path: Implement Redis caching for master tables, user settings, and template data. Add HTTP cache headers for static content. Use Nitro route caching for expensive operations.

**Memory Leaks from Watchers:**
- Problem: 47 reactive watchers but only 2 cleanup handlers (onUnmounted/onBeforeUnmount)
- Files: Throughout `app/components/`, `app/stores/`
- Cause: Watchers not properly cleaned up when components unmount
- Improvement path: Add onUnmounted cleanup for all watchers. Use watchEffect with cleanup function. Implement proper component lifecycle management.

**Timer Cleanup Issues:**
- Problem: 8+ setTimeout/setInterval usage but only 2 clearInterval/clearTimeout calls
- Files: `app/components/PaymentModal.vue`, `app/components/TableMasterData.vue`, others
- Cause: Timers not cleaned up on component unmount
- Improvement path: Store timer references and clear on unmount. Use useTimeoutFn/composable from VueUse. Implement automatic cleanup patterns.

**Large Store Operations:**
- Problem: Large array operations in stores without pagination or virtualization
- Files: `app/stores/planes.ts` (treePartidas population), `app/stores/conceptos.ts` (conceptos filtering)
- Cause: Processing entire datasets in memory
- Improvement path: Implement pagination for large lists. Use virtual scrolling for UI components. Lazy load data as needed. Consider web workers for heavy computations.

## Fragile Areas

**PDF Generation Pipeline:**
- Files: `server/api/planes/[id]/generate-pdf.get.ts`
- Why fragile: 1,947-line monolithic function, complex state management, multiple processing steps, extensive error handling for edge cases
- Safe modification: Extract pipeline stages into separate classes. Add comprehensive integration tests. Document image processing flow. Implement rollback mechanisms.
- Test coverage: Minimal (no test files found). High risk - should have unit tests for each pipeline stage.

**Image Processing:**
- Files: `server/utils/imageUtils.ts`, `server/utils/imageCompression.ts`, `app/components/DetallesGraficosComponent.vue`
- Why fragile: Multiple image formats, size limits, compression logic, S3 integration, base64 conversion
- Safe modification: Add validation tests for various image formats. Mock S3 in tests. Implement graceful degradation. Add image processing queue.
- Test coverage: Gaps - needs tests for compression edge cases, large images, corrupt images, unsupported formats.

**State Management (Planes Store):**
- Files: `app/stores/planes.ts`
- Why fragile: Complex reactivity patterns, array mutations, nested state updates, 1,487 lines
- Safe modification: Follow Vue reactivity best practices. Use Immer for immutable updates. Add state change logs. Implement time-travel debugging.
- Test coverage: Minimal - needs unit tests for all store actions, especially treePartidas population and presupuesto management.

**Authentication Flow:**
- Files: `server/utils/auth.ts`, `server/api/auth/`, `app/stores/user.ts`
- Why fragile: JWT handling, OAuth integration, token refresh, cookie management
- Safe modification: Add comprehensive auth tests. Mock external OAuth providers. Test token expiration scenarios. Implement secure token storage.
- Test coverage: Gaps - needs tests for token refresh, OAuth failures, session management, logout flows.

**Payment Processing:**
- Files: `app/components/PaymentModal.vue`, `server/api/payments/`, `server/utils/stripe.ts`
- Why fragile: External Stripe dependency, webhook handling, retry logic, SSE connection management
- Safe modification: Add webhook signature verification. Test payment failure scenarios. Implement idempotency for payment operations. Add proper error recovery.
- Test coverage: Gaps - needs tests for payment failures, webhooks, retry logic, race conditions.

**Form Validation:**
- Files: `app/schemas/`, `app/composables/useFormHandler.ts`, `app/composables/usePlanFormField.ts`
- Why fragile: Zod schemas, VeeValidate integration, custom validation logic, multi-step forms
- Safe modification: Keep Zod schemas in sync with UI forms. Test validation edge cases. Document validation rules. Implement custom error messages.
- Test coverage: Minimal - needs tests for all validation schemas, error messages, form state transitions.

## Scaling Limits

**PDF Generation Capacity:**
- Current capacity: Single-threaded, synchronous processing, ~2-5 seconds per PDF
- Limit: ~10-20 concurrent PDF generations before server becomes unresponsive
- Scaling path: Implement horizontal scaling with queue (Bull, AWS SQS). Use serverless functions for PDF generation. Pre-generate PDFs for common templates. Add CDN caching for generated PDFs.

**Database Connection Pool:**
- Current capacity: maxPoolSize: 10 in `server/utils/db.ts`
- Limit: ~100 concurrent database operations before connection exhaustion
- Scaling path: Increase pool size based on load. Use connection pooling service (PgBouncer, ProxySQL). Implement read replicas for queries. Optimize query performance to reduce connection time.

**Image Upload/Processing:**
- Current capacity: Synchronous Sharp compression, ~5-10 seconds per image
- Limit: ~5-10 concurrent image uploads before timeout
- Scaling path: Move image processing to background queue. Use async upload with progress tracking. Implement image optimization service (Imgix, Cloudinary). Add CDN for image delivery.

**Real-time Features (SSE):**
- Current capacity: Server-Sent Events for payment updates
- Limit: ~1,000 concurrent SSE connections per server instance
- Scaling path: Use WebSocket service (Pusher, Ably). Implement Redis pub/sub for multi-instance SSE. Use polling fallback for unreliable connections.

**File Storage (S3):**
- Current capacity: Direct S3 integration
- Limit: S3 request limits (5,500 PUT/COPY/POST/DELETE per second per prefix)
- Scaling path: Use S3 Transfer Acceleration. Implement multipart uploads for large files. Add CloudFront CDN for delivery. Use S3 Cross-Region Replication for global access.

## Dependencies at Risk

**Package Manager Lock Files:**
- Risk: Multiple lock files present (bun.lockb, bun-lock.yaml, pnpm-lock.yaml) indicating package manager confusion
- Impact: Dependency resolution conflicts, installation failures, inconsistent dependency trees
- Migration plan: Standardize on single package manager. Remove unused lock files. Document package manager choice in project README. Add pre-commit hook to prevent mixed package manager usage.

**PDFMake Version:**
- Risk: pdfmake@0.2.23 with custom VFS font handling
- Impact: Potential breaking changes with updates, font loading issues, bundle size
- Migration plan: Encapsulate pdfMake initialization in service layer. Test with newer pdfmake versions. Consider alternative PDF libraries (pdf-lib, jsPDF). Document custom font requirements.

**Marked Library:**
- Risk: marked@16.4.2 for markdown parsing without sanitization
- Impact: XSS vulnerabilities from user-generated markdown
- Migration plan: Add DOMPurify for HTML sanitization. Consider markdown-it with plugins. Implement content security policy. Test XSS scenarios.

**Nuxt 4 Migration:**
- Risk: Upgrading from Nuxt 3 to Nuxt 4 (compatibilityVersion: 4 in config)
- Impact: Breaking changes, deprecated APIs, module compatibility issues
- Migration plan: Follow Nuxt 4 migration guide. Test all components and pages. Update Nuxt UI modules. Check Nitro endpoint compatibility. Test deployment pipeline.

**Mongoose 8.x:**
- Risk: Mongoose@8.21.0 with potential breaking changes from v7
- Impact: Schema validation changes, query behavior updates, plugin compatibility
- Migration plan: Review Mongoose 8 changelog. Test all database operations. Update schema definitions. Check middleware compatibility. Monitor query performance.

## Missing Critical Features

**Test Infrastructure:**
- Problem: No test files found in codebase (0 .test.ts, 0 .spec.ts files excluding node_modules)
- Blocks: Confidence in deployments, refactoring safety, bug prevention
- Fix approach: Set up Vitest or Jest. Write unit tests for utilities and stores. Add integration tests for API endpoints. Implement E2E tests with Playwright. Configure CI/CD test automation.

**Error Monitoring:**
- Problem: No error tracking service integration (Sentry, Bugsnag, Rollbar)
- Blocks: Production error visibility, user issue tracking, debugging
- Fix approach: Integrate error monitoring service. Add source maps for stack traces. Implement error boundaries in Vue components. Set up alerting for critical errors.

**API Documentation:**
- Problem: No API documentation (Swagger/OpenAPI) for 80+ endpoints
- Blocks: API integration, frontend-backend collaboration, onboarding
- Fix approach: Generate OpenAPI schema from Zod validations. Set up Swagger UI. Document authentication flows. Add request/response examples.

**Performance Monitoring:**
- Problem: No APM or performance monitoring (New Relic, Datadog, Vercel Analytics)
- Blocks: Performance optimization, user experience tracking, bottleneck identification
- Fix approach: Integrate APM service. Add custom performance metrics. Monitor database query times. Track API response times. Set up performance budgets.

**Backup/Disaster Recovery:**
- Problem: No documented backup strategy for MongoDB or S3 data
- Blocks: Data loss recovery, business continuity, compliance
- Fix approach: Implement automated MongoDB backups. Enable S3 versioning. Document restore procedures. Test disaster recovery scenarios. Implement data retention policies.

**Feature Flags:**
- Problem: No feature flag system for gradual rollouts
- Blocks: Safe deployments, A/B testing, beta feature management
- Fix approach: Integrate feature flag service (LaunchDarkly, Unleash). Implement environment-based flags. Add admin UI for flag management. Document flag lifecycle.

## Test Coverage Gaps

**No Test Files:**
- What's not tested: Entire codebase (0 test files found)
- Files: All source files in `app/` and `server/`
- Risk: All functionality could break unnoticed, refactoring is dangerous
- Priority: High - Blocks confident development and deployment

**Critical Paths Untested:**
- What's not tested:
  - PDF generation pipeline (`server/api/planes/[id]/generate-pdf.get.ts`)
  - Authentication flows (`server/utils/auth.ts`, OAuth endpoints)
  - Payment processing (Stripe integration)
  - QR code generation and validation
  - Image upload and processing
- Files: All critical business logic files
- Risk: Production bugs, edge case failures, regression issues
- Priority: High - Core functionality needs test coverage

**Store State Management:**
- What's not tested: All Pinia store actions, getters, and state mutations
- Files: `app/stores/planes.ts`, `app/stores/user.ts`, `app/stores/conceptos.ts`, `app/stores/presupuestos.ts`
- Risk: State corruption, reactivity bugs, data loss
- Priority: Medium - State management is critical but failures are usually visible

**API Endpoint Validation:**
- What's not tested: Request/response validation, error handling, authentication
- Files: All 80+ endpoints in `server/api/`
- Risk: Invalid data processing, security vulnerabilities, inconsistent responses
- Priority: High - API contracts need validation

**Component Behavior:**
- What's not tested: User interactions, form submissions, error display
- Files: All 49 components in `app/components/`
- Risk: UI bugs, poor user experience, accessibility issues
- Priority: Medium - UI issues are visible but hurt user satisfaction

**Database Operations:**
- What's not tested: Query execution, data validation, transaction handling
- Files: All Mongoose model operations
- Risk: Data corruption, query failures, performance issues
- Priority: High - Data integrity is critical

**Integration Points:**
- What's not tested: External service integrations (Stripe, S3, Mailgun, Documenso)
- Files: `server/utils/stripe.ts`, `server/api/services/s3.service.ts`, email services
- Risk: Integration failures, API changes, service outages
- Priority: Medium - External services are generally reliable but need monitoring

---

*Concerns audit: 2025-01-16*
