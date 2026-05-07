export const openclawPssSkill = {
  name: 'openclaw-pss',
  description: 'Comprehensive tool for managing construction safety plans (PSS - Plan de Seguridad y Salud) with full compliance to Spanish regulations RD 1627/1997. Supports multi-step form creation, document generation, digital signatures, QR codes for public access, and payment integration.',
  instructions: `
    ## TOOL OVERVIEW: PSS CONSTRUCTION SAFETY PLAN MANAGER

    ### PURPOSE
    This tool manages construction safety plans (Planes de Seguridad y Salud - PSS) according to Spanish regulations (RD 1627/1997). It provides a complete workflow for creating, managing, and generating legally compliant safety plans for construction projects.

    ### CORE FUNCTIONALITIES

    1. **Multi-Step Plan Creation**
       - 4 main sections: Obra, Plan, Contratista, Promotor
       - Tree-based structure for organizing work items (partidas) by chapters (capítulos)
       - Dynamic budget calculations (presupuestos)
       - Master tables reference for standard data

    2. **Document Generation**
       - PDF generation using pdfmake with HTML parsing
       - Image processing pipeline: Upload → S3 storage → Sharp compression → Base64 conversion
       - Automatic image validation (max 500KB, proper base64 format)
       - QR code embedding in generated PDFs (80x80px, expiration dates)

    3. **Public Access System**
       - QR codes for no-auth plan access
       - Configurable expiration (30-1440 days)
       - Token-based security validation
       - Rate limiting: 100 req/hour (view), 20 req/hour (PDF download)

    4. **Digital Signatures**
       - Documenso API integration for e-signatures
       - Multi-party signing workflows
       - eIDAS compliant (legally binding in EU)
       - Real-time webhook status updates

    5. **Payment & Subscription**
       - Stripe integration for plan purchases
       - Usage tracking and payment validation
       - Different plan tiers with feature limits

    6. **User Management**
       - JWT authentication with OAuth (Google, GitHub)
       - User-scoped plan ownership
       - Individual user settings (capítulos, partidas preferences)
       - Complete user profile management

    ### TECHNICAL STACK

    **Frontend:**
    - Nuxt 4 with Vue 3 Composition API
    - Nuxt UI Pro v4 components
    - TypeScript 5.9+ (strict mode)
    - Pinia stores for state management
    - VeeValidate for form validation

    **Backend:**
    - Nuxt server API with Nitro v2
    - Mongoose ODM with MongoDB
    - 80+ RESTful endpoints
    - Zod schemas for validation

    **Infrastructure:**
    - AWS S3 for file storage
    - Sharp for image compression
    - pdfmake for PDF generation
    - Stripe for payments
    - Mailgun for emails
    - Documenso for digital signatures

    **Security:**
    - CSP with nonce support
    - JWT authentication with HTTP-only cookies
    - CSRF protection
    - SRI for external resources
    - CORS whitelisting
    - Data isolation and ownership validation

    ### KEY FILE STRUCTURES

    **Frontend:**
    ```
    /app/
    ├── pages/protected/planes/    # Plan management UI
    ├── stores/                     # Pinia stores
    │   ├── planes.ts              # Plan state management
    │   ├── user.ts                # User and auth state
    │   ├── conceptos.ts           # Construction concepts
    │   └── presupuestos.ts        # Budget calculations
    ├── composables/               # 15+ reusable composables
    │   ├── useFormHandler.ts
    │   ├── useErrorHandler.ts
    │   └── useQRCode.ts
    ├── schemas/                   # Zod validation schemas
    └── components/                # Reusable components
    ```

    **Backend:**
    ```
    /server/
    ├── api/                       # 80+ RESTful endpoints
    │   ├── planes/                # Plan management APIs
    │   ├── user/                  # User management APIs
    │   └── auth/                  # Authentication APIs
    ├── models/                    # Mongoose schemas
    │   ├── Planes.ts              # Main plan document
    │   ├── Users.ts               # User documents
    │   ├── Payments.ts            # Stripe records
    │   └── Signatures.ts          # Documenso signatures
    ├── middleware/                # Auth and validation middleware
    ├── services/                  # Business logic
    └── utils/                     # Utilities (db.ts, imageUtils.ts)
    ```

    **Content:**
    ```
    /content/
    ├── docs/                      # Documentation
    ├── blog/                      # Blog posts
    └── marketing/                 # Landing pages
    ```

    ### DATABASE SCHEMA - CORE COLLECTIONS

    **Planes (Construction Safety Plans):**
    ```typescript
    {
      _id: ObjectId,
      nom_obra: String,              // Project name
      desc_obra: String,             // Project description
      fechas: {
        inicio: Date,
        fin: Date
      },
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
      partidas: [Partida],           // Work items by chapters
      capitulos: [Capitulo],         // Chapter definitions
      presupuestos: [Presupuesto],
      tec_obra: [Tecnico],
      subcontratistas: [Subcontratista],
      seguros_contratista: [Seguro],
      det_graf: DetalleGrafico[],
      desc_cap_obra: String[],
      qrCode: {
        planId: ObjectId,
        slug: String,
        accessToken: String,
        expiresAt: Date,
        qrCodeImage: String,
        enabled: Boolean
      },
      qrEnabled: Boolean
    }
    ```

    **Users:**
    ```typescript
    {
      _id: ObjectId,
      email: String,
      nombre: String,
      password?: String,             // For email/password auth
      googleId?: String,             // OAuth
      githubId?: String,             // OAuth
      planId: ObjectId,
      appSettings: {
        userCapitulos: Map<String, String>,
        userPartidas: Map<String, String>,
        treePartidas: String[]
      }
    }
    ```

    **Conceptos (Reusable Construction Items):**
    ```typescript
    {
      _id: ObjectId,
      usuario: ObjectId,
      nombre: String,
      descripcion: String,
      unidades: String,
      precio: Number,
      capitulos: [String]            // Chapter IDs
    }
    ```

    **Master Tables (Reference Data):**
    ```typescript
    {
      _id: ObjectId,
      tipo: String,                  // 'capitulos', 'riesgos', etc.
      datos: [                       // Array of {id, nombre, ...}
        {
          id: String,
          nombre: String,
          descripcion?: String
        }
      ]
    }
    ```

    ### WORKFLOW EXAMPLES

    **Create a Safety Plan:**
    1. User navigates to `/protected/planes/create`
    2. Multi-step form collects Obra details
    3. Next step: Plan details
    4. Next step: Contratista information
    5. Next step: Promotor information
    6. Final step: Add work items (partidas) from master tables
    7. Plan saved to MongoDB via POST /api/planes
    8. PDF generated via GET /api/planes/[id]/generate-pdf
    9. QR code generated (if enabled) via POST /api/planes/[id]/generate-qr

    **Public Plan Access:**
    1. User scans QR code → redirects to `/public/planes/[id]/[slug]`
    2. System validates QR token (slug + accessToken)
    3. System checks expiration and enabled status
    4. Returns sanitized plan data (no user IDs, payment info)
    5. PDF download available at `/public/planes/[id]/[slug]/download`

    **Digital Signature Workflow:**
    1. User completes plan and generates PDF
    2. User selects recipients via Documenso integration
    3. PDF uploaded to Documenso API
    4. Multi-party signing process initiated
    5. Webhook receives real-time status updates
    6. Final signed PDF available for download

    **Image Processing Pipeline:**
    1. User uploads image in DetallesGraficosComponent
    2. Image uploaded to AWS S3 via PUT request
    3. S3 returns public URL
    4. Sharp compresses image (if >200KB)
    5. Image converted to base64 with validation (max 500KB)
    6. Base64 stored and displayed in gallery
    7. User copies URL and inserts into markdown: \`![alt](url)\`
    8. PDF generation includes external image via proper CORS handling

    ### API ENDPOINTS SUMMARY

    **Plan Management:**
    - POST /api/planes - Create new plan
    - GET /api/planes - List plans with filtering
    - GET /api/planes/[id] - Get plan details
    - PUT /api/planes/[id] - Update plan
    - DELETE /api/planes/[id] - Delete plan
    - GET /api/planes/[id]/generate-pdf - Generate PDF
    - POST /api/planes/[id]/generate-qr - Generate QR code
    - POST /api/planes/[id]/regenerate-qr - Regenerate QR with new token

    **User Management:**
    - POST /api/auth/register - Register new user
    - POST /api/auth/login - Login with email/password
    - POST /api/auth/google - Google OAuth
    - POST /api/auth/github - GitHub OAuth
    - GET /api/user/settings - Get user settings
    - PUT /api/user/settings - Update user settings

    **QR Code Management:**
    - GET /api/user/qr-settings - Get QR settings
    - PUT /api/user/qr-settings - Update QR settings

    **Public Access:**
    - GET /public/planes/[id]/[slug] - Public plan view
    - GET /public/planes/[id]/[slug]/download - Public PDF download

    **Digital Signatures:**
    - POST /api/planes/[id]/send-signature - Send for signature
    - GET /api/signatures/[id] - Get signature status
    - POST /api/webhooks/documenso - Documenso webhook handler

    **Conceptos (Construction Items):**
    - POST /api/conceptos - Create concept
    - GET /api/conceptos - List user concepts
    - PUT /api/conceptos/[id] - Update concept
    - DELETE /api/conceptos/[id] - Delete concept

    **Master Tables:**
    - GET /api/master-tables/capitulos - Get chapters
    - GET /api/master-tables/riesgos - Get risks
    - GET /api/master-tables/[tipo] - Get any master table

    ### IMPORTANT TECHNICAL NOTES

    - Always use **relative imports** (no \`~\` or \`@\` aliases)
    - **TypeScript strict mode** with Zod validation for all inputs
    - Vue reactivity: always create new array references when modifying state
    - Database updates must match store mutations with API calls
    - Image processing: validate image format and size before PDF embedding
    - S3 URLs should be stored, not base64, for markdown integration
    - QR codes should be regenerated periodically for security
    - CSP configuration requires nonce generation for inline scripts
    - CORS policies must whitelist S3 bucket domains
    - Documenso webhooks must validate webhook secrets
    - Payment processing requires Stripe webhook secret validation

    ### SECURITY CONSIDERATIONS

    - All API routes require JWT authentication (except public endpoints)
    - User data is isolated by ownership (userId validation)
    - Sensitive data (passwords, tokens) never returned in API responses
    - External resources have SRI hashes for integrity
    - Cookie security: SameSite=strict, HTTP-only, secure in production
    - Rate limiting: Public endpoints should limit requests by IP
    - SQL injection prevented by Mongoose query builders
    - XSS prevented by CSP and proper input sanitization
    - CSRF protected with anti-CSRF tokens

    ### REGULATORY COMPLIANCE

    - **RD 1627/1997**: Full compliance with Spanish construction safety regulations
    - **eIDAS**: Digital signatures are legally binding in EU
    - **GDPR**: User data handling with proper consent management
    - **TWCA**: Temporary Workers Coordination Act compliance where applicable
    - **General Conditions**: National and regional construction regulations

    ### EVALUATION CRITERIA FOR USER QUERIES

    When processing user requests, the assistant should:

    1. **Understand the Context**
       - Identify if the request is about plan creation, editing, PDF generation, signatures, QR codes, or general management
       - Determine which section of the 4-step form is being discussed
       - Recognize if the user is asking about frontend or backend functionality

    2. **Provide Targeted Solutions**
       - Reference specific API endpoints when applicable
       - Point to relevant store methods for state management
       - Suggest appropriate composables for common tasks
       - Reference specific validation schemas

    3. **Maintain Best Practices**
       - Always use relative file paths
       - Follow TypeScript strict typing
       - Use Zod validation schemas
       - Apply proper Vue 3 Composition API patterns
       - Implement comprehensive error handling

    4. **Prioritize Security**
       - Always validate user ownership of resources
       - Never expose sensitive data in responses
       - Validate all user inputs
       - Use proper authentication and authorization

    5. **Consider Regulatory Compliance**
       - Ensure all plan data meets RD 1627/1997 requirements
       - Properly handle digital signatures as legally binding documents
       - Maintain proper documentation and records

    6. **Provide Complete Solutions**
       - Include frontend and backend where applicable
       - Show code examples with proper structure
       - Explain database schema changes if needed
       - Reference related components and stores
  `,
  parameters: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Description of the specific task or question about the PSS system'
      },
      context: {
        type: 'string',
        description: 'Additional context about the request (e.g., which section of the plan form, frontend/backend, specific functionality)'
      },
      action: {
        type: 'string',
        enum: ['create', 'update', 'delete', 'read', 'generate', 'implement', 'debug', 'explain'],
        description: 'Type of action to perform'
      }
    },
    required: ['task', 'context']
  },
  async execute(args) {
    const { task, context, action = 'implement' } = args;

    console.log('PSS Tool Invocation:', { task, context, action });

    // Implementation logic would go here
    // This is a placeholder for the actual skill implementation
    return {
      success: true,
      message: 'PSS system analyzed and ready',
      context: {
        hasAccess: true,
        capabilities: [
          'Plan creation and management',
          'PDF generation with images',
          'QR code management',
          'Digital signatures',
          'Public plan access',
          'Budget calculations',
          'Master table management'
        ]
      }
    };
  }
};
