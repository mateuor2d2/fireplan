DESCRIPCIÓN: Orquesta el desarrollo completo de una feature desde spec hasta deploy.
USO: /build-feature <NombreEntidad> "<descripción>"
EJEMPLO: /build-feature Invoice "Sistema de facturación con impuestos"

PASOS:

## FASE 0: PREPARACIÓN

1. **Verificar stack**:
   - Check: `package.json` tiene `nuxt@4`, `@nuxt/ui`, `mongoose`, `@pinia/nuxt`
   - Check: Existe `CLAUDE.md` en raíz
   - Check: Spec Kit inicializado (carpeta `.specify`)

2. **Informar inicio**:
   "🚀 INICIANDO: **{{NombreEntidad}}** ({{descripción}})
   Stack: Nuxt 4 + UI + MongoDB | Patrón: Page→Component→Store→Service→Model
   Este proceso tiene 5 fases. Requerirá tu confirmación en puntos clave."

## FASE 1: ESPECIFICACIÓN (Interactiva)

3. **Crear spec**:
   - Ejecutar: `/speckit.specify`
   - Prompt automático: "Feature: {{descripción}} para '{{NombreEntidad}}'. Incluir:
     1. Propiedades de la entidad (nombre, tipo, validaciones)
     2. Relaciones con otras entidades
     3. Reglas de negocio (ej: precio>0, stock no negativo)
     4. UI: Listado (UTable), Formulario (UForm), Acciones (UButton)
     5. Permisos: ¿Admin-only o público?"

4. **Pausa para revisión**:
   "📋 SPEC CREADA en `.specify/spec.md`
   **Por favor revisa y edita:**
   1. ¿Las propiedades son correctas?
   2. ¿Las reglas de negocio están completas?
   3. ¿La UI descrita usa componentes Nuxt UI?
      Responde 'spec ok' para continuar o haz ediciones primero."

5. **Crear plan técnico**:
   - Ejecutar: `/speckit.plan`
   - "Plan técnico generado en `.specify/plan.md`"

6. **Crear tasks**:
   - Ejecutar: `/speckit.tasks`
   - "Tasks generadas en `.specify/tasks.md` ({{N}} tareas)"

## FASE 2: SCAFFOLD DE ENTIDAD (Automático)

7. **Scaffold**:
   - Ejecutar comando interno: `/scaffold-entity {{NombreEntidad}}`
   - Verificar creación de 5 archivos:
     ✓ `/server/models/{{NombreEntidad}}.ts`
     ✓ `/server/services/{{nombreEntidad}}.service.ts`
     ✓ `/stores/{{nombreEntidad}}.store.ts`
     ✓ `/components/{{NombreEntidad}}/{{NombreEntidad}}Table.vue`
     ✓ `/pages/admin/{{nombreEntidad}}s/index.vue`

## FASE 3: IMPLEMENTACIÓN POR CAPAS (Guiada)

8. **Ciclo para cada capa** (ORDEN ESTRICTO):

   **CAPA 1: MODELO**
   - "🔄 **CAPA 1/5: MODELO**"
   - Ejecutar: `/implement-layer model {{NombreEntidad}}`
   - "✅ Modelo creado. Ejecuta tests: `npm run test:unit -- --run model`"
   - Esperar respuesta: 'tests pasan' o 'corregir'
   - Si 'tests pasan': `git add . && git commit -m "feat(model): add {{NombreEntidad}} schema"`

   **CAPA 2: SERVICIO**
   - "🔄 **CAPA 2/5: SERVICIO**"
   - Ejecutar: `/implement-layer service {{NombreEntidad}}`
   - Sugerir: `/generate-crud-tests {{NombreEntidad}} --layer service`
   - "✅ Servicio creado. Ejecuta tests: `npm run test:unit -- --run service`"
   - Esperar respuesta -> Commit: `feat(service): implement {{NombreEntidad}}Service`

   **CAPA 3: STORE**
   - "🔄 **CAPA 3/5: STORE**"
   - Ejecutar: `/implement-layer store {{NombreEntidad}}`
   - Tests -> Commit: `feat(store): add {{nombreEntidad}} store`

   **CAPA 4: COMPONENTE**
   - "🔄 **CAPA 4/5: COMPONENTE** (FRONTEND - SKILL OBLIGATORIO)"
   - Ejecutar: `/implement-layer component {{NombreEntidad}}`
   - "⚠️ **IMPORTANTE**: El comando invocará automáticamente el skill 'mom-nuxt4-ui-skill' para garantizar uso correcto de Nuxt UI v4"
   - "✅ Componente con Nuxt UI v4 creado. Verifica UI."
   - Commit: `feat(component): add {{NombreEntidad}}Table`

   **CAPA 5: PÁGINA**
   - "🔄 **CAPA 5/5: PÁGINA** (FRONTEND - SKILL OBLIGATORIO)"
   - Ejecutar: `/implement-layer page {{NombreEntidad}}`
   - "⚠️ **IMPORTANTE**: El comando invocará automáticamente el skill 'mom-nuxt4-ui-skill' para garantizar uso correcto de Nuxt UI v4"
   - "✅ Página admin creada. Verifica en navegador."
   - Commit: `feat(page): add admin {{nombreEntidad}}s page`

## FASE 4: VERIFICACIÓN FINAL

9. **Validación con Spec Kit**:
   - Ejecutar: `/speckit.implement`
   - "🔍 Validando completitud de tasks..."

10. **Reporte final**:
    "🎉 **FEATURE '{{NombreEntidad}}' COMPLETADA**
    - ✅ Spec definida
    - ✅ 5 capas implementadas
    - ✅ Tests pasando
    - ✅ 5 commits semánticos
    - 📍 URLs: /admin/{{nombreEntidad}}s (admin), /api/{{nombreEntidad}} (API)
      Siguientes pasos: 1) Desplegar a staging 2) Documentar endpoints 3) Crear manual de usuario"
