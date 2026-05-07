DESCRIPCIÓN: Recarga el contexto completo del proyecto.
USO: /refresh-context [--verbose]

FLUJO:

## 1. ANÁLISIS DEL PROYECTO

"🔄 **ANALIZANDO CONTEXTO DEL PROYECTO...**"

### A) Detectar Stack:

```javascript
// Read package.json
const pkg = JSON.parse(readFile("package.json"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const STACK = {
  nuxt4: deps.nuxt && deps.nuxt.startsWith("4"),
  nuxtUI: deps["@nuxt/ui"],
  mongoose: deps.mongoose,
  pinia: deps["@pinia/nuxt"] || deps["pinia"],
  vitest: deps.vitest,
  typescript: deps.typescript,
};
```

### B) Verificar Archivos Clave:

CLAUDE.md: [✅/❌] - Manual de arquitectura
spec.md: [✅/❌] - Spec activa (Spec Kit)
plan.md: [✅/❌] - Plan técnico activo
tasks.md: [✅/❌] - Tasks activas
app.config.ts:[✅/❌] - Configuración Nuxt UI
C) Detectar Entidades Existentes:

# Listar todos los modelos

```bash
MODELOS = glob('/server/models/\*.ts').map(f => basename(f, '.ts'));
```

# Listar todos los servicios

```bash

SERVICIOS = glob('/server/services/\*.service.ts').map(f => basename(f, '.service.ts'));
```

# Listar todos los stores

```bash

STORES = glob('/stores/\*.store.ts').map(f => basename(f, '.store.ts'));
B) Capa en Progreso:
```

# Buscar archivos modificados recientemente

```bash

ARCHIVOS_RECIENTES = findRecentlyModified([
'/server/models/',
'/server/services/',
'/stores/',
'/components/',
'/pages/'
]);

if (ARCHIVOS_RECIENTES.includes('/server/models/')) CAPA_ACTUAL = 'model';
else if (ARCHIVOS_RECIENTES.includes('/server/services/')) CAPA_ACTUAL = 'service';
else if (ARCHIVOS_RECIENTES.includes('/stores/')) CAPA_ACTUAL = 'store';
else if (ARCHIVOS_RECIENTES.includes('/components/')) CAPA_ACTUAL = 'component';
else if (ARCHIVOS_RECIENTES.includes('/pages/')) CAPA_ACTUAL = 'page';
else CAPA_ACTUAL = null;
C) Especificación Activa:

# Buscar spec más reciente

SPEC_ACTIVA = null;
if (exists('.specify/spec.md')) {
SPEC_ACTIVA = '.specify/spec.md';
SPEC_TYPE = 'Spec Kit';
} else if (exists('openspec/changes/')) {

# Buscar change no archivado más reciente

ACTIVE_CHANGES = listDirs('openspec/changes/').filter(d => !d.includes('archive'));
if (ACTIVE_CHANGES.length > 0) {
SPEC_ACTIVA = `openspec/changes/${ACTIVE_CHANGES[0]}/spec.md`;
SPEC_TYPE = 'OpenSpec';
}
}
```

3. REPORTE DE CONTEXTO
   🎯 **CONTEXTO RECARGADO - RESUMEN DEL PROYECTO**

🏗️ STACK DETECTADO:

- Nuxt 4: ${STACK.nuxt4 ? '✅' : '❌'}
- Nuxt UI: ${STACK.nuxtUI ? '✅' : '⚠️ (instalar: npx nuxi@latest module add @nuxt/ui)'}
- MongoDB (Mongoose): ${STACK.mongoose ? '✅' : '⚠️'}
- Pinia: ${STACK.pinia ? '✅' : '⚠️'}
- Vitest: ${STACK.vitest ? '✅' : '⚠️'}
- TypeScript: ${STACK.typescript ? '✅' : '⚠️'}

📁 ESTRUCTURA:

- Modelos: ${MODELOS.length} entidades (${MODELOS.join(', ')})
- Servicios: ${SERVICIOS.length} servicios
- Stores: ${STORES.length} stores
- Commands: ${listFiles('.claude/commands/').length} comandos personalizados

🚀 ESTADO ACTUAL:

- Entidad activa: **${ENTIDAD_ACTIVA || 'Ninguna detectada'}**
- Capa en progreso: **${CAPA_ACTUAL || 'No determinada'}**
- Spec activa: ${SPEC_ACTIVA ? `${SPEC_TYPE}: ${SPEC_ACTIVA}` : 'Ninguna'}
- Tests: ${STACK.vitest ? 'Disponibles' : 'No configurados'}

📚 CONTEXTO CARGADO EN MEMORIA:

1. Reglas de arquitectura (CLAUDE.md)
2. ${SPEC_ACTIVA ? `Especificación activa: ${SPEC_ACTIVA}` : 'Especificación: Ninguna'}
3. ${ENTIDAD_ACTIVA ? `Código de la entidad '${ENTIDAD_ACTIVA}'` : ''}

4. SUGERENCIAS DE ACCIÓN
   💡 **¿QUÉ HACER AHORA?**

${!SPEC_ACTIVA ? '1. 🆕 **Iniciar nueva feature**: `/build-feature <Entidad> "<Descripción>"`' : ''}
${SPEC_ACTIVA && CAPA_ACTUAL ? `2. 🔄 **Continuar desarrollo**: Estás en capa '${CAPA_ACTUAL}' de '${ENTIDAD_ACTIVA}'. Usa \`/implement-layer ${CAPA_ACTUAL} ${ENTIDAD_ACTIVA}\`` : ''}
${ENTIDAD_ACTIVA ? `3. 🧪 **Generar tests**: \`/generate-crud-tests ${ENTIDAD_ACTIVA}\`` : ''}
${MODELOS.length > 0 ? '4. 📊 **Ver estadísticas**: ' + MODELOS.length + ' entidades documentadas' : ''} 5. 🛠️ **Verificar configuración**: Ejecutar \`npm run typecheck\` y \`npm run test:unit\`

```

```
