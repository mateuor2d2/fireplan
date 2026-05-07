DESCRIPCIÓN: Crea la estructura base de 5 capas para una nueva entidad.
USO: /scaffold-entity <NombreEntidad>
EJEMPLO: /scaffold-entity Product

ACCIONES:

## 1. VALIDAR ENTRADA

- Verificar que <NombreEntidad> sea PascalCase (ej: Product, User, Invoice)
- Verificar que no exista ya la entidad (buscar en `/server/models/`)
- Calcular variantes:
  EntityPascal = {{NombreEntidad}} (Product)
  EntityCamel = {{nombreEntidad}} (product)
  EntityDash = {{nombre-entidad}} (product)

## 2. CREAR ESTRUCTURA DE CARPETAS

```bash
# Crear carpeta para componentes de esta entidad
mkdir -p /components/{{NombreEntidad}}
# Crear carpeta para páginas admin
mkdir -p /pages/admin/{{nombreEntidad}}s


```

## 3. GENERAR ARCHIVOS

A) MODELO (/server/models/{{NombreEntidad}}.ts)

```typescript
import { Schema, model, type Document } from 'mongoose';

export interface I{{NombreEntidad}} extends Document {
  // TODO: Definir propiedades basadas en spec.md
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const {{NombreEntidad}}Schema = new Schema<I{{NombreEntidad}}>({
  name: { type: String, required: true },
  // TODO: Añadir más campos según spec.md
}, { timestamps: true });

export const {{NombreEntidad}} = model<I{{NombreEntidad}}>('{{NombreEntidad}}', {{NombreEntidad}}Schema);
```

B) SERVICIO (/server/services/{{nombreEntidad}}.service.ts)

````typescript
import { {{NombreEntidad}}, type I{{NombreEntidad}} } from '../models/{{NombreEntidad}}';
import type { Create{{NombreEntidad}}Dto, Update{{NombreEntidad}}Dto } from '@/types/dto/{{nombreEntidad}}.dto';

export class {{NombreEntidad}}Service {
  async findAll(filter = {}) {
    return await {{NombreEntidad}}.find(filter).lean().exec();
  }

  async findById(id: string) {
    return await {{NombreEntidad}}.findById(id).lean().exec();
  }

  async create(dto: Create{{NombreEntidad}}Dto) {
    const item = new {{NombreEntidad}}(dto);
    return await item.save();
  }

  async update(id: string, dto: Update{{NombreEntidad}}Dto) {
    return await {{NombreEntidad}}.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async delete(id: string) {
    return await {{NombreEntidad}}.findByIdAndDelete(id).exec();
  }

  // TODO: Añadir métodos específicos de negocio según spec.md
} ```
C) STORE (/stores/{{nombreEntidad}}.store.ts)
```typescript
import { defineStore } from 'pinia';
import { {{NombreEntidad}}Service } from '@/server/services/{{nombreEntidad}}.service';

export const use{{NombreEntidad}}Store = defineStore('{{nombreEntidad}}', {
  state: () => ({
    items: [] as any[],
    currentItem: null as any,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAll() {
      this.isLoading = true;
      try {
        const service = new {{NombreEntidad}}Service();
        this.items = await service.findAll();
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async createItem(data: any) {
      const service = new {{NombreEntidad}}Service();
      return await service.create(data);
    },

    // TODO: Añadir más acciones según spec.md
  },

  getters: {
    // TODO: Añadir getters según spec.md
  }
}); ```
D) COMPONENTE (/components/{{NombreEntidad}}/{{NombreEntidad}}Table.vue)
```typescript
<!-- ADVERTENCIA: Este archivo es un template básico.
     Para implementación completa, usar el skill 'mom-nuxt4-ui-skill' OBLIGATORIAMENTE -->
<template>
  <div>
    <UTable :rows="items" :columns="columns">
      <template #actions="{ row }">
        <UButton icon="i-lucide-edit" @click="$emit('edit', row)" />
        <UButton icon="i-lucide-trash" color="red" @click="$emit('delete', row)" />
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: any[]
}>();

defineEmits<{
  edit: [item: any]
  delete: [item: any]
}>();

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  // TODO: Añadir más columnas según spec.md
  { key: 'actions', label: 'Acciones' }
];
</script> ```

**IMPORTANTE**: La implementación real de componentes DEBE usar el skill `mom-nuxt4-ui-skill` para garantizar:
- Uso correcto de componentes Nuxt UI v4
- TypeScript y type safety
- Accesibilidad (a11y)
- Responsive design con Tailwind CSS v4
E) PÁGINA (/pages/admin/{{nombreEntidad}}s/index.vue)
```typescript
<!-- ADVERTENCIA: Este archivo es un template básico.
     Para implementación completa, usar el skill 'mom-nuxt4-ui-skill' OBLIGATORIAMENTE -->
<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{NombreEntidad}}s</h1>
      <UButton label="Nuevo {{NombreEntidad}}" @click="isModalOpen = true" />
    </div>

    <{{NombreEntidad}}Table
      :items="store.items"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <UModal v-model="isModalOpen">
      <!-- TODO: Implementar formulario de creación/edición -->
      <div class="p-4">
        <h2 class="text-xl mb-4">Nuevo {{NombreEntidad}}</h2>
        <!-- Formulario aquí -->
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const store = use{{NombreEntidad}}Store();
const isModalOpen = ref(false);

await useAsyncData(() => store.fetchAll());

function handleEdit(item: any) {
  // TODO: Implementar edición
}

function handleDelete(item: any) {
  // TODO: Implementar eliminación
}
</script>```

**IMPORTANTE**: La implementación real de páginas DEBE usar el skill `mom-nuxt4-ui-skill` para garantizar:
- Uso correcto de composables de Nuxt 4
- Integración con Nuxt UI v4
- Data fetching optimizado
- Manejo adecuado de estado
- SEO y metadatos
- Renderizado SSR/SSG optimizado
4. MENSAJE FINAL

"✅ SCAFFOLD COMPLETADO para '{{NombreEntidad}}'
Se crearon 5 archivos en las capas:

    Modelo: /server/models/{{NombreEntidad}}.ts

    Servicio: /server/services/{{nombreEntidad}}.service.ts

    Store: /stores/{{nombreEntidad}}.store.ts

    Componente: /components/{{NombreEntidad}}/{{NombreEntidad}}Table.vue

    Página: /pages/admin/{{nombreEntidad}}s/index.vue

⚠️ **RECORDATORIO OBLIGATORIO**: Para la implementación de componentes y páginas (frontend),
es OBLIGATORIO usar el skill 'mom-nuxt4-ui-skill'. Esto asegura:
- Uso correcto de Nuxt UI v4
- TypeScript con type safety
- Accesibilidad (a11y)
- Responsive design con Tailwind CSS v4
- Mejores prácticas de Nuxt 4

Cada archivo tiene comentarios // TODO: para guiar la implementación detallada basada en spec.md."
```
````
