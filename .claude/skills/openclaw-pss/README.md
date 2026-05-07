# OpenCLAW PSS Tool Skill

Este skill proporciona una herramienta completa para la gestión de Planes de Seguridad y Salud (PSS - Plan de Seguridad y Salud) en cumplimiento con la legislación española RD 1627/1997.

## Descripción del Skill

El skill ofrece capacidades para:

1. **Gestión de Planes de Seguridad**
   - Creación multi-paso con 4 secciones (Obra, Plan, Contratista, Promotor)
   - Estructura tree para organización de partidas por capítulos
   - Cálculos presupuestarios dinámicos
   - Gestión de tablas maestras

2. **Generación de Documentos**
   - Creación de PDF con pdfmake y parsing HTML
   - Procesamiento avanzado de imágenes: Upload → S3 → Sharp compression → Base64
   - Validación automática de imágenes (máx 500KB, formato correcto)
   - Embedding de códigos QR en PDFs con seguimiento de expiración

3. **Acceso Público**
   - Acceso a planes mediante códigos QR sin autenticación
   - Expiración configurable (30-1440 días)
   - Validación basada en tokens de seguridad
   - Limitación de tasa para descargas de PDF

4. **Firmas Digitales**
   - Integración con API de Documenso
   - Flujos de firma multi-partes
   - Cumplimiento eIDAS (legalmente vinculante en UE)
   - Actualizaciones en tiempo real vía webhooks

5. **Pagos y Suscripciones**
   - Integración con Stripe para compras de planes
   - Seguimiento de uso y validación de pagos
   - Diferentes niveles de plan con límites de funcionalidad

6. **Gestión de Usuarios**
   - Autenticación OAuth multi-proveedor (Google, GitHub)
   - Autenticación email/contraseña
   - Propiedad de planes por usuario
   - Persistencia de ajustes individuales

## Estructura del Skill

```
openclaw-pss/
├── skill.ts          # Definición del skill para OpenCLAW
├── PROMPT.md         # Guía detallada de uso y casos de evaluación
└── README.md         # Este archivo
```

## Archivos del Skill

### skill.ts

Contiene la definición completa del skill con:

- **Descripción**: Propósito general de la herramienta PSS
- **Instrucciones detalladas**: Capabilidades técnicas, stack, archivos clave
- **Parámetros**: Estructura de parámetros esperados
- **Execute function**: Lógica de implementación para OpenCLAW

**Parámetros del skill:**

```typescript
{
  task: string,          // Descripción de la tarea específica
  context: string,       // Contexto adicional (sección del formulario, frontend/backend, etc.)
  action: string         // Tipo de acción (create, update, delete, read, generate, etc.)
}
```

### PROMPT.md

Guía extensa con:

- **Capacidades de la herramienta**: Explicación detallada de cada funcionalidad
- **Arquitectura técnica**: Stack de frontend y backend
- **Ejemplos de flujo**: 4 workflows principales detallados
- **Esquemas de base de datos**: Estructura completa de documentos
- **Archivos clave a referencia**: Rutas específicas del código
- **Escenarios de evaluación**: 4 casos comunes con respuestas esperadas
- **Mejores prácticas**: Estándares de desarrollo, seguridad y base de datos
- **Cumplimiento regulatorio**: RD 1627/1997, eIDAS, GDPR

## Uso del Skill con OpenCLAW

### Invocación del Skill

El skill se invoca cuando OpenCLAW necesita ejecutar una tarea relacionada con el sistema PSS:

```
/task action=<action> context=<context> task="<description>"
```

**Ejemplos de invocación:**

```
/task action=create context="crear nuevo plan de seguridad en sección Obra" task="Crear un plan con detalles de obra"
/task action=generate context="generar PDF con imágenes" task="Generar PDF completo del plan con imágenes de detalle"
/task action=read context="consultar acceso público" task="¿Cómo funciona el acceso público vía QR?"
/task action=explain context="firmas digitales" task="Explicar el proceso de firmas digitales con Documenso"
```

### Flujo de Evaluación del Skill

Cuando OpenCLAW invoca este skill, el sistema procesará:

1. **Análisis del contexto**: Identificar qué funcionalidad está solicitando el usuario
2. **Recopilación de información**: Referenciar esquemas de base de datos, endpoints API, componentes
3. **Providencia de solución**: Ejemplo de código específico, parámetros correctos, endpoints apropiados
4. **Seguridad**: Validación de propiedad de recursos, no exposición de datos sensibles
5. **Cumplimiento**: Referencias a regulaciones y mejores prácticas

### Casos de Uso Principales

#### Caso 1: Creación de Plan de Seguridad

**Pregunta:** "¿Cómo creo un plan de seguridad?"

**Respuesta esperada:**
- Explicar la estructura de 4 pasos (Obra, Plan, Contratista, Promotor)
- Referenciar componente de formulario multi-paso
- Mostrar código de creación con validación Zod
- Mencionar estructura tree y cálculos presupuestarios

#### Caso 2: Generación de PDF con Imágenes

**Pregunta:** "Las imágenes no se muestran en el PDF"

**Respuesta esperada:**
- Verificar validación en `validateImageForPdfmake()`
- Comprobar formato base64 y límites de tamaño (500KB)
- Asegurar que Sharp esté comprimiendo imágenes >200KB
- Revisar logs para errores de procesamiento
- Verificar manejo CORS para imágenes externas

#### Caso 3: Códigos QR para Acceso Público

**Pregunta:** "¿Cómo funcionan los códigos QR?"

**Respuesta esperada:**
- Explicar generación (POST `/api/planes/[id]/generate-qr`)
- Describir validación de tokens (slug + accessToken)
- Mencionar expiración configurable
- Explicar endpoints públicos sin autenticación
- Notar limitación de tasa para descargas

#### Caso 4: Firmas Digitales

**Pregunta:** "¿Cómo implementar firmas digitales?"

**Respuesta esperada:**
- Integración API Documenso
- Workflow multi-partes
- Cumplimiento eIDAS
- Actualizaciones webhooks en tiempo real

## Integración con el Sistema

### Archivos de Configuración

El skill debe ser registrado en `.claude/skills.json`:

```json
{
  "skills": {
    "openclaw-pss": "./openclaw-pss/skill.ts"
  }
}
```

### Archivos del Proyecto Relevantes

**Frontend:**
- `/app/stores/planes.ts` - Gestión de estado de planes
- `/app/stores/conceptos.ts` - Gestión de conceptos de construcción
- `/app/stores/presupuestos.ts` - Cálculos presupuestarios
- `/app/components/planes/DetallesGraficosComponent.vue` - Subida de imágenes
- `/app/components/qr/QRConfigForm.vue` - Configuración QR
- `/app/composables/useFormHandler.ts` - Manejo de formularios
- `/app/composables/useErrorHandler.ts` - Manejo de errores

**Backend:**
- `/server/models/Planes.ts` - Schema de plan
- `/server/models/Conceptos.ts` - Schema de concepto
- `/server/models/MasterTables.ts` - Schemas de tablas maestras
- `/server/utils/imageUtils.ts` - Utilidades de procesamiento de imágenes
- `/server/utils/imageCompression.ts` - Compresión Sharp
- `/server/api/planes/[id]/generate-pdf.get.ts` - Endpoint PDF
- `/server/api/planes/[id]/generate-qr.post.ts` - Generación QR

## Regulaciones y Cumplimiento

El skill incluye y referencia:

- **RD 1627/1997**: Regulaciones españolas de seguridad en construcción
- **eIDAS**: Firmas digitales legalmente vinculantes en UE
- **GDPR**: Manejo de datos de usuario con consentimiento
- **TWCA**: Cumplimiento Acto de Coordinación de Trabajadores Temporales
- **Condiciones Generales**: Regulaciones nacionales y regionales

## Evaluación por OpenCLAW

OpenCLAW evaluará este skill basándose en:

1. **Precisión de respuesta**: Claridad y exactitud en explicaciones
2. **Complejidad del ejemplo**: Proporcionar código completo y funcional
3. **Relevancia de contexto**: Referenciar esquemas correctos, endpoints, componentes
4. **Seguridad**: Consideraciones de seguridad apropiadas
5. **Cumplimiento**: Referencias a regulaciones y mejores prácticas
6. **Formato de código**: TypeScript estricto, imports relativos

## Mejores Prácticas Implementadas

### Desarrollo
- Solo imports relativos (sin `~` o `@` aliases)
- TypeScript modo estricto con validación Zod
- Composition API de Vue 3
- Reactividad apropiada (nuevas referencias de array)

### Seguridad
- Validación de propiedad de usuario para recursos
- Nunca exponer contraseñas, tokens en respuestas
- Todos los endpoints API requieren JWT (públicos excepto)
- CORS whitelist S3 bucket domains

### Base de Datos
- Validación Mongoose antes de guardar
- Índices apropiados para performance
- Diseño de schema normalizado
- Transacciones para operaciones multi-paso

### API
- RESTful con convenciones consistentes
- Respuestas consistentes { success, data, error }
- Manejo de errores apropiado
- Documentación de endpoints

## Rutas y Endpoints Importantes

### Plan Management
- `POST /api/planes` - Crear nuevo plan
- `GET /api/planes` - Listar planes con filtrado
- `GET /api/planes/[id]` - Obtener detalles
- `PUT /api/planes/[id]` - Actualizar plan
- `DELETE /api/planes/[id]` - Eliminar plan
- `GET /api/planes/[id]/generate-pdf` - Generar PDF
- `POST /api/planes/[id]/generate-qr` - Generar QR
- `POST /api/planes/[id]/regenerate-qr` - Regenerar QR

### Acceso Público
- `GET /public/planes/[id]/[slug]` - Vista pública
- `GET /public/planes/[id]/[slug]/download` - Descarga pública

### Firma Digital
- `POST /api/planes/[id]/send-signature` - Enviar para firma
- `GET /api/signatures/[id]` - Obtener estado firma
- `POST /api/webhooks/documenso` - Webhook Documenso

### Gestión de Conceptos
- `POST /api/conceptos` - Crear concepto
- `GET /api/conceptos` - Listar conceptos
- `PUT /api/conceptos/[id]` - Actualizar concepto
- `DELETE /api/conceptos/[id]` - Eliminar concepto

### Tablas Maestras
- `GET /api/master-tables/capitulos` - Obtener capítulos
- `GET /api/master-tables/riesgos` - Obtener riesgos
- `GET /api/master-tables/[tipo]` - Obtener cualquier tabla

## Configuración de Evaluación

OpenCLAW puede configurarse para:

1. **Validar respuestas específicas**: Comparar con respuestas esperadas
2. **Evaluar ejemplos de código**: Verificar que sean correctos y funcionales
3. **Verificar contexto**: Asegurar que se referencian recursos correctos
4. **Probar secuencias de comandos**: Verificar flujo lógico completo
5. **Evaluar manejo de errores**: Probar casos edge y validaciones

## Soporte y Mantenimiento

Para mantener este skill actualizado:

1. **Actualizar documentación**: Si cambia la arquitectura o funcionalidades
2. **Corregir ejemplos**: Si el código cambia de forma importante
3. **Refinar parámetros**: Si la estructura de parámetros evoluciona
4. **Actualizar regulaciones**: Si cambia la legislación aplicable
5. **Mejorar ejemplos**: Si se encuentran patrones comunes o casos edge

## Referencias

- **Legislación**: RD 1627/1997 - Reglamento de Prevención de Riesgos Laborales
- **eIDAS**: Electronic Signatures Regulations (EU) No 910/2014
- **Proyecto**: v9PLANESN4BUI4 - Sistema de Gestión de Planes de Seguridad
- **Stack**: Nuxt 4, Vue 3, TypeScript, MongoDB, Mongoose, Nuxt UI Pro
