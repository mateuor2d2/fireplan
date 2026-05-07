# PLAN DE REFACTORIZACIÓN - Deployment Optimization

## Resumen Ejecutivo

**Problema**: El proyecto no deploya en Render ni Vercel porque requiere 8GB de memoria para construir.

**Solución**: Plan de optimización en 7 fases para reducir el uso de memoria a <2GB y lograr deployment exitoso.

**Tiempo estimado**: 30 minutos - 8 horas (según fases necesarias)

---

## Estado Actual

### Métricas Problemáticas
```
node_modules:      1.6GB  ❌ INACEPTABLE
.output/server:    71MB   ❌ DEMASIADO GRANDE
Build memory:      8GB    ❌ EXCEDE LÍMITES FREE TIER
Deployment:        FAIL   ❌ EN RENDER Y VERCEL
```

### Causas Identificadas
1. **Dependencias fantasmas**: three.js (32MB) - NO SE USA
2. **PDF generation**: pdfmake + fonts personalizados (muy pesado)
3. **Bundle sin optimizar**: Falta tree-shaking y code splitting
4. **AWS SDK completo**: Solo necesitamos S3
5. **Lucide Icons**: Paquete completo sin tree-shake

---

## Plan de Acción

### 🚀 FASE 1: Quick Wins (30 min) - PRIORIDAD MÁXIMA

**Acción inmediata**: Ejecutar script automatizado
```bash
./.planning/phases/14-deployment-optimization/execute-phase1.sh
```

**Cambios**:
- Eliminar: three, playwright-core, better-sqlite3
- Actualizar scripts de build (4GB en lugar de 8GB)
- Crear .npmignore
- Limpiar y reinstalar

**Resultado esperado**:
- node_modules: 1.6GB → ~1.0GB (ahorro 600MB)
- Build memory: 8GB → 4GB

---

### FASE 2: Bundle Optimization (1 hora) - Si Fase 1 no es suficiente

**Cambios**:
- Optimizar nuxt.config.ts
- Configurar externals para dependencias pesadas
- Implementar code splitting manual
- Optimizar configuración de Vite

**Resultado esperado**:
- .output/server: 71MB → ~35MB

**Archivo de referencia**: `OPTIMIZED-NUXT-CONFIG.ts`

---

### FASE 3: PDF Refactor (2-3 horas) - Si persiste el problema

**Opciones**:
A. **Servicio externo** (Browserless, Puppeteer Cloud) - RECOMENDADO
B. **Reemplazar** pdfmake con alternativa más ligera
C. **Lazy loading** agresivo del generador PDF actual

**Implementación** (Opción C - Mantener funcionamiento actual):
```typescript
// Lazy import solo cuando se necesita
const { generatePdf } = await import('../../../utils/pdf-generator')
```

**Resultado esperado**:
- Reducción inicial del bundle: 15MB
- PDF solo se carga cuando se solicita

---

### FASE 4: AWS SDK (30 min)

**Cambios**:
- Usar singleton pattern para S3 client
- Considerar SDK modular si es necesario

**Resultado esperado**: Ahorro 6MB

---

### FASE 5: Lucide Icons (30 min)

**Cambios**:
- Eliminar lucide-vue-next
- Usar @iconify-json/lucide (ya instalado)
- Actualizar componentes: `<Icon name="lucide:menu" />`

**Resultado esperado**: Ahorro 27MB

---

### FASE 6: Deployment Configuration (30 min)

**Cambios**:
- Crear `vercel.json` con configuración optimizada
- Crear `render.yaml` para Render
- Añadir endpoint de health check

**Resultado esperado**: Deployment exitoso

**Archivos de referencia**: `VERCEL-RENDER-CONFIGS.md`

---

### FASE 7: Sharp Optimization (1 hora) - Opcional

**Cambios**:
- Hacer Sharp dependencia opcional
- Implementar fallback si no está disponible

**Resultado esperado**: Ahorro 17MB adicional

---

## Ejecución Recomendada

### Opción 1: Empezar con Quick Wins (RECOMENDADO)
```bash
# 1. Ejecutar Fase 1
./.planning/phases/14-deployment-optimization/execute-phase1.sh

# 2. Verificar resultados
du -sh node_modules .output/server

# 3. Si node_modules < 1GB, intentar deployment
vercel --prod

# 4. Si falla, continuar con Fase 2
```

### Opción 2: Ejecución Manual
Ver `14-QUICK-START.md` para comandos paso a paso.

---

## Métricas de Éxito

| Métrica | Actual | Objetivo | Estado |
|---------|--------|----------|--------|
| node_modules | 1.6GB | < 0.8GB | ⏳ |
| Server bundle | 71MB | < 30MB | ⏳ |
| Build memory | 8GB | < 2GB | ⏳ |
| Deploy status | ❌ FAIL | ✅ SUCCESS | ⏳ |

---

## Decisiones Clave

### ¿Qué dependencias eliminar?
- ✅ **three** (32MB) - No se usa, eliminar
- ✅ **playwright-core** (9.8MB) - Solo para testing, eliminar
- ✅ **better-sqlite3** (12MB) - Usamos MongoDB, eliminar
- ⚠️ **pdfmake** (5MB) - Necesario, optimizar con lazy loading
- ⚠️ **sharp** (17MB) - Necesario, hacer opcional

### ¿Qué enfoque para PDF?
- **Corto plazo**: Lazy loading (Fase 3, Opción C)
- **Largo plazo**: Servicio externo (Browserless)

### ¿Vercel o Render?
- **Vercel**: Mejor para Nuxt, setup más fácil
- **Render**: Build time más generoso
- **Recomendación**: Intentar ambos, usar el que funcione

---

## Riesgos y Mitigación

### Riesgo 1: PDF generation falla después de optimizar
**Mitigación**: Mantener implementación actual con lazy loading
**Rollback**: `git checkout package.json && bun install`

### Riesgo 2: Memory limit still exceeded
**Mitigación**: Aumentar a 6GB temporalmente, continuar optimizaciones
**Alternativa**: Considerar plan pago ($7/mo)

### Riesgo 3: Features rotas por dependencias eliminadas
**Mitigación**: Testing exhaustivo después de cada fase
**Rollback**: Git branches para cada fase

---

## Timeline

### Semana 1 (Crítico)
- Día 1: Fase 1 (30 min) → Intentar deployment
- Día 2-3: Si falla, Fases 2-4
- Día 4: Fase 6 (deployment configs)
- Día 5: Deployment final

### Semana 2 (Optimización)
- Fase 5 (Icons)
- Fase 7 (Sharp)
- Testing completo
- Documentar cambios

---

## Archivos del Plan

```
.planning/phases/14-deployment-optimization/
├── .continue-here.md           ← EMPEZAR AQUÍ
├── README.md                   ← Visión general
├── 14-DEPLOYMENT-OPTIMIZATION-PLAN.md  ← Plan detallado completo
├── 14-QUICK-START.md           ← Comandos rápidos
├── 14-EXECUTION-STATUS.md      ← Seguimiento de progreso
├── OPTIMIZED-NUXT-CONFIG.ts    ← Configuración optimizada
├── VERCEL-RENDER-CONFIGS.md    ← Configs de deployment
├── execute-phase1.sh           ← Script automatizado
└── PHASE-SUMMARY.md            ← Este archivo
```

---

## Próximos Pasos Inmediatos

1. ✅ **Leer** `.continue-here.md` para instrucciones rápidas
2. ✅ **Ejecutar** `execute-phase1.sh` (30 min)
3. ✅ **Verificar** métricas después de Fase 1
4. ✅ **Deployar** si métricas son buenas
5. ✅ **Continuar** con fases siguientes si es necesario

---

## Comandos de Referencia Rápida

```bash
# Ver tamaño de dependencias
du -sh node_modules/* | sort -hr | head -20

# Verificar bundle size
du -sh .output/server .output/public

# Build con límite de memoria
NODE_OPTIONS='--max-old-space-size=4096' bun run build

# Analizar bundle
bun run analyze

# Deploy a Vercel
vercel --prod

# Deploy a Render (después de push)
git push origin main
```

---

## Soporte

### Si el build falla
1. Revisar logs de error
2. Incrementar memoria temporalmente (6GB)
3. Verificar dependencias conflictivas
4. Consultar `14-DEPLOYMENT-OPTIMIZATION-PLAN.md` sección troubleshooting

### Si el deployment falla
1. Verificar environment variables
2. Comprobar health endpoint: `/api/health`
3. Revisar logs de Vercel/Render
4. Verificar que todos los externals están configurados

### Si features fallan
1. Rollback con git
2. Verificar que dependencias eliminadas no se usaban
3. Comprobar imports dinámicos
4. Testing exhaustivo

---

**Estado**: 🟡 LISTO PARA EJECUTAR
**Prioridad**: 🔴 CRÍTICA
**Tiempo estimado total**: 8 horas (fases completas) | 30 min (fase 1)

**👉 PRÓXIMA ACCIÓN**: Ejecutar `./.planning/phases/14-deployment-optimization/execute-phase1.sh`
