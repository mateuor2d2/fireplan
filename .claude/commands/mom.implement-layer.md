DESCRIPCIÓN: Implementa una capa específica para una entidad, basándose en spec.md.
USO: /implement-layer <capa> <NombreEntidad>
EJEMPLO: /implement-layer service Product

CAPAS VÁLIDAS: `model`, `service`, `store`, `component`, `page`

FLUJO:

## 1. VALIDACIÓN

- Verificar que `capa` sea válida
- Verificar que `NombreEntidad` exista (buscar archivo base)
- Cargar contexto: `spec.md`, `plan.md`, `CLAUDE.md`

## 2. SEGÚN CAPA:

### CAPA: `model`

**Objetivo**: Implementar esquema Mongoose completo basado en spec.md.

**Pasos**:

1. Leer `spec.md` y extraer:
   - Propiedades y sus tipos
   - Validaciones (required, unique, min, max, etc.)
   - Relaciones con otras entidades
2. Actualizar `/server/models/{{NombreEntidad}}.ts`:
   - Completar interfaz `I{{NombreEntidad}}` con todas las propiedades
   - Completar esquema con validaciones detalladas
   - Añadir índices si son necesarios
   - Añadir hooks (pre-save, pre-validate) si son necesarios
3. Crear/actualizar tests del modelo
4. Ejecutar validación: `npx tsc --noEmit` para verificar tipos

**Output esperado**: Modelo 100% alineado con spec.md, listo para usar.

### CAPA: `service`

**Objetivo**: Implementar lógica de negocio completa.

**Pasos**:

1. Leer `spec.md` y extraer:
   - Reglas de negocio (ej: "precio > 0", "stock no negativo")
   - Operaciones CRUD + operaciones específicas
   - Validaciones complejas
2. Actualizar `/server/services/{{nombreEntidad}}.service.ts`:
   - Implementar todos los métodos según spec.md
   - Añadir validación de reglas de negocio
   - Manejo de errores específicos (ej: "Producto no encontrado")
   - Transacciones MongoDB si son necesarias
3. Crear tests para cada método del servicio
4. Verificar coherencia con DTOs en `@/types/dto/`

### CAPA: `store`

**Objetivo**: Implementar store Pinia reactivo.

**Pasos**:

1. Analizar qué estado/reactividad necesita la UI según spec.md
2. Actualizar `/stores/{{nombreEntidad}}.store.ts`:
   - State: Definir todas las propiedades reactivas necesarias
   - Actions: Implementar llamadas al servicio + manejo de estado
   - Getters: Computed properties para la UI
   - Persistencia (localStorage) si es requerida
3. Asegurar que el store sea compatible con SSR (Nuxt 4)
4. Crear tests del store (mockeando el servicio)

### CAPA: `component`

**Objetivo**: Crear componentes Vue con Nuxt UI.

**Pasos**:

1. Analizar mockups/descripciones UI en spec.md
2. **INVOCAR SKILL OBLIGATORIO**: Ejecutar `Skill('mom-nuxt4-ui-skill')` ANTES de crear cualquier componente
3. Implementar `/components/{{NombreEntidad}}/{{NombreEntidad}}Table.vue`:
   - Columnas correctas con formateo adecuado
   - Acciones (editar, eliminar, ver detalle)
   - Slots para personalización
   - Props bien tipados
4. Crear componentes adicionales si son necesarios:
   - `{{NombreEntidad}}Form.vue` para creación/edición
   - `{{NombreEntidad}}Card.vue` para vista detalle
5. Usar EXCLUSIVAMENTE componentes Nuxt UI (verificado por el skill)
6. Añadir tests de componente (montaje, interacción)

### CAPA: `page`

**Objetivo**: Implementar página Nuxt con routing.

**Pasos**:

1. Analizar flujo de navegación en spec.md
2. **INVOCAR SKILL OBLIGATORIO**: Ejecutar `Skill('mom-nuxt4-ui-skill')` ANTES de crear cualquier página
3. Implementar `/pages/admin/{{nombreEntidad}}s/index.vue`:
   - Data fetching con `useAsyncData`
   - Manejo de parámetros de ruta (si aplica)
   - Integración completa con store
   - Manejo de estados (loading, error, empty)
4. Crear páginas adicionales si son necesarias:
   - `/pages/admin/{{nombreEntidad}}s/[id].vue` para detalle/edición
   - `/pages/{{nombreEntidad}}s/index.vue` para vista pública
5. Configurar meta tags, SEO, breadcrumbs
6. Asegurar responsive design (verificado por el skill)

## 3. VERIFICACIÓN FINAL POR CAPA

Para cada capa, al finalizar:

1. **Ejecutar tests específicos**: `npm run test:unit -- --run {{capa}}`
2. **Verificar tipos**: `npx tsc --noEmit`
3. **Revisar contra spec.md**: ¿Cumple todos los requerimientos?
4. **Sugerir commit**: `git commit -m "feat({{capa}}): implement {{NombreEntidad}} {{capa}}"`

## 4. MENSAJE FINAL

"✅ **CAPA '{{capa}}' IMPLEMENTADA** para '{{NombreEntidad}}'
Revisión completada:

- ✓ Alineada con spec.md
- ✓ Tests disponibles
- ✓ Tipos TypeScript verificados
- ✓ Lista para commit

**Siguiente**: Continúa con la siguiente capa en el orden: model → service → store → component → page"
