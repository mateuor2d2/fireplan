DESCRIPCIÓN: Genera tests unitarios para una entidad en todas las capas.
USO: /generate-crud-tests <NombreEntidad> [--layer <capa>]
EJEMPLO: /generate-crud-tests Product --layer service

FLUJO:

## 1. DETECTAR ARCHIVOS EXISTENTES

- Buscar entidad en todas las capas
- Listar archivos encontrados:
  - Modelo: `/server/models/{{NombreEntidad}}.ts` (✅/❌)
  - Servicio: `/server/services/{{nombreEntidad}}.service.ts` (✅/❌)
  - Store: `/stores/{{nombreEntidad}}.store.ts` (✅/❌)
  - Componente: `/components/{{NombreEntidad}}/{{NombreEntidad}}Table.vue` (✅/❌)

## 2. GENERAR TESTS SEGÚN CAPA

### SI CAPA = `model` o NO ESPECIFICADA:

**Archivo**: `/server/models/{{NombreEntidad}}.test.ts`

````typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connectToDatabase, disconnectFromDatabase } from '../utils/mongodb';
import { {{NombreEntidad}} } from './{{NombreEntidad}}';
import mongoose from 'mongoose';

describe('{{NombreEntidad}} Model', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await {{NombreEntidad}}.deleteMany({});
  });

  it('debería crear un documento válido', async () => {
    const validData = {
      // TODO: Completar con datos válidos basados en el esquema
      name: 'Test {{NombreEntidad}}',
      // ... otros campos requeridos
    };

    const doc = new {{NombreEntidad}}(validData);
    const saved = await doc.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe(validData.name);
    // ... más assertions
  });

  it('debería fallar si falta campo requerido', async () => {
    const invalidData = {};
    const doc = new {{NombreEntidad}}(invalidData);

    await expect(doc.save()).rejects.toThrow();
  });

  it('debería respetar campo único', async () => {
    const data = { name: 'UniqueName' };
    await new {{NombreEntidad}}(data).save();

    const duplicate = new {{NombreEntidad}}(data);
    await expect(duplicate.save()).rejects.toThrow(/duplicate/);
  });

  // TODO: Añadir tests para validaciones específicas
  // TODO: Añadir tests para relaciones/populate
  // TODO: Añadir tests para hooks (pre-save, etc.)
});```
SI CAPA = service o NO ESPECIFICADA:

Archivo: /server/services/{{nombreEntidad}}.service.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {{NombreEntidad}}Service } from './{{nombreEntidad}}.service';
import { {{NombreEntidad}} } from '../models/{{NombreEntidad}}';
import type { Create{{NombreEntidad}}Dto } from '@/types/dto/{{nombreEntidad}}.dto';

// Mock del modelo
vi.mock('../models/{{NombreEntidad}}');

describe('{{NombreEntidad}}Service', () => {
  let service: {{NombreEntidad}}Service;

  const mock{{NombreEntidad}} = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test {{NombreEntidad}}',
    save: vi.fn().mockResolvedValue(this),
    toObject: () => ({ ...this })
  };

  beforeEach(() => {
    service = new {{NombreEntidad}}Service();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear exitosamente', async () => {
      const dto: Create{{NombreEntidad}}Dto = { name: 'New' };
      ({{NombreEntidad}} as any).mockImplementation(() => ({
        ...mock{{NombreEntidad}},
        save: vi.fn().mockResolvedValue({ ...mock{{NombreEntidad}} })
      }));

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mock{{NombreEntidad}}.save).toHaveBeenCalled();
    });

    it('debería lanzar error por datos inválidos', async () => {
      const dto = {} as Create{{NombreEntidad}}Dto;
      await expect(service.create(dto)).rejects.toThrow();
    });

    // TODO: Añadir tests para validaciones de negocio específicas
  });

  describe('findAll', () => {
    it('debería retornar array de items', async () => {
      const mockItems = [{ name: 'Item 1' }, { name: 'Item 2' }];
      ({{NombreEntidad}}.find as any).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(mockItems) })
      });

      const result = await service.findAll();
      expect(result).toEqual(mockItems);
    });

    // TODO: Más tests para findAll con filtros
  });

  // TODO: Tests para findById, update, delete
  // TODO: Tests para métodos de negocio personalizados
});```

SI CAPA = store o NO ESPECIFICADA:

Archivo: /stores/{{nombreEntidad}}.store.test.ts
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { use{{NombreEntidad}}Store } from './{{nombreEntidad}}.store';
import { {{NombreEntidad}}Service } from '@/server/services/{{nombreEntidad}}.service';

vi.mock('@/server/services/{{nombreEntidad}}.service');

describe('use{{NombreEntidad}}Store', () => {
  let store: ReturnType<typeof use{{NombreEntidad}}Store>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = use{{NombreEntidad}}Store();
    vi.clearAllMocks();
  });

  describe('state inicial', () => {
    it('debería tener state inicial correcto', () => {
      expect(store.items).toEqual([]);
      expect(store.currentItem).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchAll', () => {
    it('debería cargar items exitosamente', async () => {
      const mockItems = [{ id: 1, name: 'Test' }];
      ({{NombreEntidad}}Service.prototype.findAll as any).mockResolvedValue(mockItems);

      await store.fetchAll();

      expect(store.items).toEqual(mockItems);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('debería manejar errores', async () => {
      const errorMsg = 'Network error';
      ({{NombreEntidad}}Service.prototype.findAll as any).mockRejectedValue(new Error(errorMsg));

      await expect(store.fetchAll()).rejects.toThrow();
      expect(store.error).toContain(errorMsg);
    });
  });

  // TODO: Tests para createItem, updateItem, deleteItem
  // TODO: Tests para getters
});```
SI CAPA = component o NO ESPECIFICADA:

Archivo: /components/{{NombreEntidad}}/{{NombreEntidad}}Table.test.ts
```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import {{NombreEntidad}}Table from './{{NombreEntidad}}Table.vue';

describe('{{NombreEntidad}}Table', () => {
  const mockItems = [
    { id: 1, name: 'Item 1', description: 'Desc 1' },
    { id: 2, name: 'Item 2', description: 'Desc 2' }
  ];

  it('renderiza correctamente con items', () => {
    const wrapper = mount({{NombreEntidad}}Table, {
      props: { items: mockItems }
    });

    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.text()).toContain('Item 1');
    expect(wrapper.text()).toContain('Item 2');
  });

  it('renderiza columnas correctas', () => {
    const wrapper = mount({{NombreEntidad}}Table, {
      props: { items: mockItems }
    });

    const headers = wrapper.findAll('thead th');
    expect(headers).toHaveLength(3); // id, name, actions
    expect(headers[0].text()).toBe('ID');
    expect(headers[1].text()).toBe('Nombre');
  });

  it('emite evento edit al hacer clic en botón', async () => {
    const wrapper = mount({{NombreEntidad}}Table, {
      props: { items: mockItems }
    });

    await wrapper.find('[data-test="edit-button-0"]').trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')![0]).toEqual([mockItems[0]]);
  });

  it('emite evento delete al hacer clic en botón', async () => {
    const wrapper = mount({{NombreEntidad}}Table, {
      props: { items: mockItems }
    });

    await wrapper.find('[data-test="delete-button-0"]').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('muestra mensaje cuando no hay items', () => {
    const wrapper = mount({{NombreEntidad}}Table, {
      props: { items: [] }
    });

    expect(wrapper.text()).toContain('No hay items');
  });
});```
3. MENSAJE FINAL

"🧪 TESTS GENERADOS para '{{NombreEntidad}}'
Archivos creados/actualizados:
{{lista de archivos de test}}

✅ Recomendaciones:

    Completa los // TODO: en cada archivo de test

    Ejecuta la suite completa: npm run test:unit

    Asegúrate de que los mocks reflejen la implementación real

    Añade tests para casos edge y errores

📊 Cobertura objetivo: >80% por capa"
````
