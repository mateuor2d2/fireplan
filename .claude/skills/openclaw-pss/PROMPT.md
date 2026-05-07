# OpenCLAW PSS Tool - Prompt and Usage Guide

## INTRODUCTION

This tool provides a comprehensive solution for managing construction safety plans (Planes de Seguridad y Salud - PSS) in compliance with Spanish regulations (RD 1627/1997). It supports the complete lifecycle of safety plan creation, management, and distribution.

## TOOL CAPABILITIES

### 1. SAFETY PLAN MANAGEMENT
- Create multi-step safety plans with 4 sections: Obra, Plan, Contratista, Promotor
- Tree-based organization of work items (partidas) by chapters (capítulos)
- Dynamic budget calculations with master table integration
- Complete CRUD operations with ownership validation

### 2. DOCUMENT GENERATION
- Server-side PDF creation using pdfmake with HTML parsing
- Advanced image processing: S3 upload → Sharp compression → Base64 conversion
- Automatic image validation (max 500KB, proper format checking)
- QR code embedding in generated PDFs with expiration tracking

### 3. PUBLIC ACCESS SYSTEM
- QR code-based no-auth plan access
- Configurable expiration (30-1440 days)
- Token-based security with rate limiting
- Sanitized data exposure for public views

### 4. DIGITAL SIGNATURES
- Documenso API integration for e-signatures
- Multi-party signing workflows
- eIDAS compliant (legally binding in EU)
- Real-time webhook status updates

### 5. PAYMENT & SUBSCRIPTION
- Stripe integration for plan purchases
- Usage tracking and payment validation
- Different plan tiers with feature limits
- Automatic subscription management

### 6. USER MANAGEMENT
- Multi-provider OAuth (Google, GitHub)
- Email/password authentication
- User-scoped plan ownership
- Individual settings persistence

## TECHNICAL ARCHITECTURE

### FRONTEND STACK
```
Nuxt 4 (Vue 3 Composition API)
├── Nuxt UI Pro v4 (components, forms, tables)
├── TypeScript 5.9+ (strict mode)
├── Pinia (state management)
├── VeeValidate (form validation)
└── 15+ custom composables
```

### BACKEND STACK
```
Nuxt Server API (Nitro v2)
├── Mongoose + MongoDB (ODM)
├── 80+ RESTful endpoints
├── Zod validation schemas
└── JWT + OAuth authentication
```

### INFRASTRUCTURE
```
AWS S3 (file storage)
├── Sharp (image compression)
├── pdfmake (PDF generation)
├── Stripe (payments)
├── Mailgun (emails)
└── Documenso (digital signatures)
```

## WORKFLOW EXAMPLES

### WORKFLOW 1: Create a Safety Plan

**User Action:** Fills multi-step form to create new safety plan

**System Actions:**
1. Validates each form section with Zod schemas
2. Collects: Obra details, Plan specifications, Contratista info, Promotor info
3. Organizes work items (partidas) in tree structure by chapters
4. Calculates budget from master table data
5. Saves complete plan to MongoDB via `POST /api/planes`

**Code Reference:**
```typescript
// Store method: /app/stores/planes.ts
async crearPlan(planData: PlanInput) {
  this.planActual = { ...planData };
  const response = await $fetch('/api/planes', {
    method: 'POST',
    body: planData
  });
  this.planes.unshift(response);
  return response;
}
```

### WORKFLOW 2: Generate PDF with Images

**User Action:** Request PDF generation for completed plan

**System Actions:**
1. Validates image URLs with `validateImageForPdfmake()`
2. Downloads images from S3
3. Compresses large images (>200KB) using Sharp
4. Converts to base64 with validation (max 500KB)
5. Generates PDF using pdfmake with proper image embedding
6. Returns PDF buffer

**Image Processing Pipeline:**
```typescript
// /server/utils/imageUtils.ts
export async function imageUrlToBase64(url: string): Promise<string> {
  // Download from S3
  // Sharp compression if >200KB
  // Base64 conversion with validation
  // Return base64 string
}
```

### WORKFLOW 3: Public Plan Access via QR Code

**User Action:** Scans QR code to view public plan

**System Actions:**
1. Validates QR token (slug + accessToken match)
2. Checks expiration date
3. Verifies QR code is enabled
4. Returns sanitized plan data (no user IDs, payment info)
5. Provides PDF download link

**Public Endpoint:**
```
GET /public/planes/{planId}/{slug}
GET /public/planes/{planId}/{slug}/download
```

### WORKFLOW 4: Digital Signature Process

**User Action:** Sends plan for signature through Documenso

**System Actions:**
1. Generates PDF from completed plan
2. Uploads PDF to Documenso API
3. Creates signature workflow with recipients
4. Generates signature links
5. Listens for Documenso webhooks for status updates
6. Updates plan signature status in database

**Documenso Webhook:**
```typescript
// /server/api/webhooks/documenso.ts
export default defineEventHandler(async (event) => {
  const signatureId = getHeader(event, 'X-Documenso-Id');
  const status = getHeader(event, 'X-Documenso-Status');

  // Validate webhook secret
  // Update signature status in database
  // Notify recipients if completed
});
```

## DATABASE SCHEMAS

### Plan Document Structure
```typescript
{
  _id: ObjectId,
  nom_obra: String,
  desc_obra: String,
  fechas: { inicio: Date, fin: Date },
  plan: {
    titulo: String,
    objetivo: String,
    metodologia: String
  },
  contratista: {
    nombre: String,
    cif: String,
    seguros: [Seguro]
  },
  promotor: {
    nombre: String,
    cif: String
  },
  partidas: [Partida],      // Work items organized by chapters
  capitulos: [Capitulo],    // Chapter definitions
  presupuestos: [Presupuesto],
  tec_obra: [Tecnico],
  subcontratistas: [Subcontratista],
  seguros_contratista: [Seguro],
  det_graf: [DetalleGrafico],  // Images from DetallesGraficosComponent
  desc_cap_obra: String[],
  qrCode: {
    planId: ObjectId,
    slug: String,              // URL-friendly identifier
    accessToken: String,       // UUID for security
    expiresAt: Date,
    qrCodeImage: String,       // Base64 PNG
    enabled: Boolean
  },
  qrEnabled: Boolean
}
```

### User Document Structure
```typescript
{
  _id: ObjectId,
  email: String,
  nombre: String,
  password?: String,
  googleId?: String,
  githubId?: String,
  planId: ObjectId,
  appSettings: {
    userCapitulos: Map<String, String>,
    userPartidas: Map<String, String>,
    treePartidas: String[]
  }
}
```

### Conceptos (Reusable Construction Items)
```typescript
{
  _id: ObjectId,
  usuario: ObjectId,
  nombre: String,
  descripcion: String,
  unidades: String,
  precio: Number,
  capitulos: [String]
}
```

### Master Tables (Reference Data)
```typescript
{
  _id: ObjectId,
  tipo: 'capitulos' | 'riesgos' | '...',
  datos: [{
    id: String,
    nombre: String,
    descripcion?: String
  }]
}
```

## KEY FILES TO REFERENCE

### Frontend
- `/app/stores/planes.ts` - Plan state management
- `/app/stores/conceptos.ts` - Construction concepts management
- `/app/stores/presupuestos.ts` - Budget calculations
- `/app/components/planes/DetallesGraficosComponent.vue` - Image upload component
- `/app/components/qr/QRConfigForm.vue` - QR code configuration
- `/app/composables/useFormHandler.ts` - Form handling composable
- `/app/composables/useErrorHandler.ts` - Error handling composable

### Backend
- `/server/models/Planes.ts` - Plan schema
- `/server/models/Conceptos.ts` - Concept schema
- `/server/models/MasterTables.ts` - Master table schemas
- `/server/utils/imageUtils.ts` - Image processing utilities
- `/server/utils/imageCompression.ts` - Sharp compression
- `/server/api/planes/[id]/generate-pdf.get.ts` - PDF generation endpoint
- `/server/api/planes/[id]/generate-qr.post.ts` - QR code generation

## EVALUATION SCENARIOS

### Scenario 1: User asks "How do I create a safety plan?"

**Expected Response:**
- Explain the 4-step form structure (Obra, Plan, Contratista, Promotor)
- Reference the multi-step form component location
- Show code example for plan creation
- Mention budget calculations and tree structure
- Note: Always validate user ownership after creation

**Key Points:**
- Store handles plan creation
- Form validates with Zod schemas
- Tree structure organized by chapters
- Budget calculated from master tables
- Plan saved to MongoDB via `/api/planes` endpoint

### Scenario 2: User asks "PDF images not showing"

**Expected Response:**
- Check image validation in `validateImageForPdfmake()`
- Verify base64 format and size limits (500KB max)
- Ensure Sharp compression is working for large images
- Check console logs for detailed error messages
- Ensure proper CORS handling for external images

**Troubleshooting Steps:**
1. Validate image URL with S3 access
2. Test image compression with Sharp
3. Check base64 conversion (should start with `data:image/jpeg;base64,` or `data:image/png;base64,`)
4. Verify PDF generation logs for image processing errors
5. Ensure image width/height within PDF page limits

### Scenario 3: User asks "How do QR codes work?"

**Expected Response:**
- Explain QR code generation (POST `/api/planes/[id]/generate-qr`)
- Describe token-based security (slug + accessToken)
- Mention configurable expiration (30-1440 days)
- Explain public access endpoints (no authentication required)
- Note rate limiting for PDF downloads

**Public Access Flow:**
```
1. User scans QR code
2. Redirects to /public/planes/{planId}/{slug}
3. System validates token and expiration
4. Returns sanitized plan data
5. PDF available at /public/planes/{planId}/{slug}/download
```

**Security:**
- Token validation prevents unauthorized access
- Expiration prevents long-term access
- Rate limiting prevents abuse
- Data filtering removes sensitive information

### Scenario 4: User asks "How to implement digital signatures?"

**Expected Response:**
- Documenso API integration for e-signatures
- Multi-party signing workflow
- eIDAS compliance (legally binding in EU)
- Real-time webhook status updates

**Implementation:**
1. Send plan PDF to Documenso API
2. Create signature workflow with recipients
3. Receive signature links
4. Monitor webhooks for completion status
5. Update plan signature status in database

**Code Reference:**
```typescript
// POST /api/planes/[id]/send-signature
export default defineEventHandler(async (event) => {
  const planId = getRouterParam(event, 'id');
  const pdfBuffer = await generatePdf(planId);

  const documensoResponse = await $fetch('https://api.documenso.app/v1/preview', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${DOCUMENSO_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: {
      templateId: plan.templateId,
      document: {
        name: \`Plan de Seguridad - \${plan.nom_obra}\`,
        file: \`data:application/pdf;base64,\${pdfBuffer.toString('base64')}\`
      },
      signature: {
        recipients: [{
          email: recipientEmail,
          type: 'SIGNER'
        }]
      }
    }
  });

  return documensoResponse;
});
```

## BEST PRACTICES

### Development Standards
1. **Relative Imports Only**: Never use \`~\` or \`@\` aliases
2. **TypeScript Strict Mode**: Enable all strict type checking
3. **Zod Validation**: Always validate inputs with Zod schemas
4. **Vue 3 Composition API**: Use \`<script setup>\` and composables
5. **Proper Reactivity**: Create new array references when modifying state

### Security Standards
1. **User Ownership**: Always validate userId before operations
2. **Sensitive Data**: Never expose passwords, tokens in responses
3. **Authentication**: All API routes require JWT (except public)
4. **CORS**: Whitelist S3 bucket domains and specific routes
5. **Rate Limiting**: Implement on public endpoints

### Database Standards
1. **Validation**: Mongoose validation before save
2. **Indexes**: Proper indexes for query performance
3. **Schema Design**: Normalized with proper relationships
4. **Transactions**: Use for multi-step operations

### API Standards
1. **RESTful**: Follow REST conventions
2. **Consistent Response**: { success, data, error } format
3. **Error Handling**: Proper error messages and codes
4. **Documentation**: Include endpoint descriptions

## REGULATORY COMPLIANCE

- **RD 1627/1997**: Spanish construction safety regulations
- **eIDAS**: Digital signatures legally binding in EU
- **GDPR**: User data with consent management
- **TWCA**: Temporary Workers Coordination Act compliance
- **General Conditions**: National and regional construction regulations

## EVALUATION CHECKLIST

When responding to user queries, ensure:

- [ ] Response is specific to the PSS system
- [ ] Code examples are correct and complete
- [ ] File paths are relative and accurate
- [ ] Database schemas are correctly referenced
- [ ] Security considerations are addressed
- [ ] Best practices are followed
- [ ] Regulatory compliance is noted
- [ ] Code is TypeScript strict compliant
- [ ] No sensitive data exposed in examples

## USAGE FOR EVALUATION

When this tool is invoked for evaluation purposes:

1. **Understand the Request**: Identify the specific functionality being tested
2. **Provide Context**: Reference relevant schemas, endpoints, and components
3. **Show Examples**: Provide working code examples
4. **Explain Logic**: Describe the system logic clearly
5. **Mention Security**: Note security implications
6. **Include Compliance**: Reference regulatory requirements
