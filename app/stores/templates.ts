// app/stores/templates.ts
import { defineStore } from 'pinia'
import { type TemplateFieldConfig, createFullFieldConfig } from '../../server/types/templates'

interface PrintingTemplate {
  _id?: string
  name: string
  description: string
  value: string
  content: string
  isDefault?: boolean
  isGlobal?: boolean
  fieldConfig?: TemplateFieldConfig
  label?: string // For UI compatibility
}

interface State {
  templates: PrintingTemplate[]
  isLoading: boolean
  error: string | null
}

export const useTemplatesStore = defineStore('templates', {
  state: (): State => ({
    templates: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // Get all available templates
    allTemplates: state => state.templates,

    // Get global templates only
    globalTemplates: state => state.templates.filter(t => t.isGlobal),

    // Get user templates only
    userTemplates: state => state.templates.filter(t => !t.isGlobal),

    // Get the default template (first one marked as default, or first global template)
    defaultTemplate(state) {
      return state.templates.find(t => t.isDefault) || state.templates.filter(t => t.isGlobal)[0] || null
    }
  },

  actions: {
    /**
     * Load all available templates for a user
     */
    async loadTemplates(userId?: string) {
      this.isLoading = true
      this.error = null

      try {
        const query = userId ? `?userId=${userId}` : ''
        const response = await $fetch(`/api/templates${query}`)

        if (response.success) {
          this.templates = response.data as PrintingTemplate[]
        } else {
          throw new Error('Failed to load templates')
        }
      } catch (error: any) {
        this.error = error.message || 'Error loading templates'
        console.error('Error loading templates:', error)

        // Fallback to default templates if API fails
        this.loadDefaultTemplates()
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create a new template
     */
    async createTemplate(templateData: Omit<PrintingTemplate, '_id'>) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch('/api/templates', {
          method: 'POST',
          body: templateData
        })

        if (response.success) {
          // Add the new template to the store
          this.templates.push(response.data)
          return response.data
        } else {
          throw new Error(response.message || 'Error creating template')
        }
      } catch (error: any) {
        this.error = error.message || 'Error creating template'
        console.error('Error creating template:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update an existing template
     */
    async updateTemplate(id: string, updateData: Partial<PrintingTemplate>) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch('/api/templates', {
          method: 'PATCH',
          body: { id, ...updateData }
        })

        if (response.success) {
          // Update the template in the store
          const index = this.templates.findIndex(t => t._id === id)
          if (index !== -1) {
            this.templates[index] = response.data
          }
          return response.data
        } else {
          throw new Error(response.message || 'Error updating template')
        }
      } catch (error: any) {
        this.error = error.message || 'Error updating template'
        console.error('Error updating template:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete a template
     */
    async deleteTemplate(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch('/api/templates', {
          method: 'DELETE',
          body: { id }
        })

        if (response.success) {
          // Remove the template from the store
          this.templates = this.templates.filter(t => t._id !== id)
          return response.data
        } else {
          throw new Error(response.message || 'Error deleting template')
        }
      } catch (error: any) {
        this.error = error.message || 'Error deleting template'
        console.error('Error deleting template:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Load default hardcoded templates as fallback
     */
    loadDefaultTemplates() {
      this.templates = [
        {
          value: 'standard',
          name: 'Plantilla Estándar',
          label: 'Plantilla Estándar',
          description: 'Formato básico con todos los elementos del plan de seguridad',
          content: `# Plan de Seguridad y Salud
## {{nom_obra}}

**Dirección:** {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}})
**Duración:** {{duracion_meses}} meses
**Presupuesto Total:** €{{presupuesto_total_obra}}

### Contratista
- **Empresa:** {{contratista.nom_contratista}}
- **CIF:** {{contratista.cif_contratista}}
- **Dirección:** {{contratista.dir_contratista}}

### Promotor
- **Nombre:** {{nom_promotor}}
- **CIF:** {{cif_promotor}}
- **Dirección:** {{dir_promotor}}

### Descripción de la Obra
{{desc_obra}}

### Condiciones de la Obra
{{desc_condiciones_obra}}

### Relación de puestos de trabajo evaluados

#### Unidades de obra

{{#each partidas}}
##### {{nom_concepto}}

**Descripción concepto:** {{desc_concepto}}

**Identificación y evaluación de riesgos de esta partida**

| **Riesgo** | **Probabilidad** | **Consecuencias** | **Resultado** |
|------------|------------------|-------------------|---------------|
{{#each evaluaciones}}
| {{riesgo.descripcion}} | {{probabilidad.descripcion}} | {{gravedad.descripcion}} | {{#evaluaGP gravedad.id probabilidad.id}}{{/evaluaGP}} |
{{/each}}

**Descripción concepto preventivo**

{{desc_concepto_preventivo}}

{{#if epis}}
**Epis de partida**

{{epis}}
{{/if}}

{{#if pcols}}
**Protecciones Colectivas de partida**

{{pcols}}
{{/if}}

{{#if maqs}}
**Maquinarias de partida**

{{maqs}}
{{/if}}

{{#if medauxs}}
**Medios Auxiliares de partida**

{{medauxs}}
{{/if}}

{{#if pqs}}
**Productos Químicos de partida**

{{pqs}}
{{/if}}

{{/each}}

{{#unless partidas}}
**Unidades de Obra**
{{#each partidasnombre}}
{{@index}}. {{this}}
{{/each}}
{{/unless}}

### Detalles Gráficos
{{#if detalles_graficos_count}}
Se incluyen {{detalles_graficos_count}} imágenes de detalles gráficos:

{{detalles_graficos}}
{{else}}
No se han añadido detalles gráficos a este plan.
{{/if}}`,
          isDefault: true,
          isGlobal: true,
          fieldConfig: createFullFieldConfig()
        },
        {
          value: 'detailed',
          name: 'Plantilla Detallada',
          label: 'Plantilla Detallada',
          description: 'Formato completo con información extendida y gráficos',
          content: `# Plan de Seguridad y Salud - Formato Detallado
## {{nom_obra}}

### Información General
- **Obra:** {{nom_obra}}
- **Dirección:** {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}})
- **Superficie construida:** {{superficie_construida_obra}} m²
- **Perímetro:** {{perimetro_obra}} m
- **Plantas sobre rasante:** {{num_plantas_sobre}}
- **Plantas bajo rasante:** {{num_plantas_bajo}}
- **Duración:** {{duracion_meses}} meses
- **Número de trabajadores:** {{num_trab_plan}}

### Presupuestos
- **Presupuesto total de obra:** €{{presupuesto_total_obra}}
- **Presupuesto de seguridad:** €{{presupuesto_total_seguridad}}
- **Presupuesto objeto de obra:** €{{presupuesto_objeto_obra}}
- **Presupuesto objeto de seguridad:** €{{presupuesto_objeto_seguridad}}

### Contratista
- **Empresa:** {{contratista.nom_contratista}}
- **CIF:** {{contratista.cif_contratista}}
- **Dirección:** {{contratista.dir_contratista}}
- **Población:** {{contratista.pob_contratista}} ({{contratista.cp_contratista}})
- **Teléfono:** {{contratista.telf_contratista}}
- **Email:** {{contratista.email_contratista}}

### Promotor
- **Nombre:** {{nom_promotor}}
- **CIF:** {{cif_promotor}}
- **Dirección:** {{dir_promotor}}
- **Población:** {{localidad_promotor}} ({{cp_promotor}})
- **Teléfono:** {{telf_promotor}}
- **Email:** {{email_promotor}}

### Descripción de la Obra
{{desc_obra}}

### Condiciones de la Obra
{{desc_condiciones_obra}}

### Condiciones Climáticas
- **Clima:** {{clima}}
- **Condiciones:** {{condiciones_clima}}
- **Orografía:** {{orografia}}

### Personal Técnico
{{#if tec_obra}}
{{#each tec_obra}}
- **{{this.nombre}}** - {{this.cargo}} ({{this.titulacion}})
  - Contacto: {{this.telf}} | {{this.mail}}
{{/each}}
{{else}}
- Sin personal técnico asignado
{{/if}}

### Presupuesto Desglosado
{{#if presupuesto}}
{{#each presupuesto}}
- **{{this.concepto}}**: €{{this.precioud}} ({{this.tipo_concepto_unidad}})
{{/each}}
**Total Presupuesto: €{{presupuesto_total_obra}}**
{{else}}
- Sin desglose presupuestario
{{/if}}

### Subcontratistas
{{#if subcontratistas}}
{{#each subcontratistas}}
- **{{this.nombre}}** - CIF: {{this.cif}} - Gremio: {{this.gremio}}
{{/each}}
{{else}}
- Sin subcontratistas especificados
{{/if}}

### Relación de puestos de trabajo evaluados

#### Unidades de obra

{{#each partidas}}
##### {{nom_concepto}}

**Descripción concepto:** {{desc_concepto}}

**Identificación y evaluación de riesgos de esta partida**

| **Riesgo** | **Probabilidad** | **Consecuencias** | **Resultado** |
|------------|------------------|-------------------|---------------|
{{#each evaluaciones}}
| {{riesgo.descripcion}} | {{probabilidad.descripcion}} | {{gravedad.descripcion}} | {{#evaluaGP gravedad.id probabilidad.id}}{{/evaluaGP}} |
{{/each}}

**Descripción concepto preventivo**

{{desc_concepto_preventivo}}

{{#if epis}}
**Epis de partida**

{{epis}}
{{/if}}

{{#if pcols}}
**Protecciones Colectivas de partida**

{{pcols}}
{{/if}}

{{#if maqs}}
**Maquinarias de partida**

{{maqs}}
{{/if}}

{{#if medauxs}}
**Medios Auxiliares de partida**

{{medauxs}}
{{/if}}

{{#if pqs}}
**Productos Químicos de partida**

{{pqs}}
{{/if}}

{{/each}}

{{#unless partidas}}
**Unidades de Obra**
{{#each partidasnombre}}
{{@index}}. {{this}}
{{/each}}
{{/unless}}

### Detalles Gráficos
{{#if detalles_graficos_count}}
Se incluyen {{detalles_graficos_count}} imágenes de detalles gráficos:

{{detalles_graficos}}
{{else}}
No se han añadido detalles gráficos a este plan.
{{/if}}`,
          isDefault: false,
          isGlobal: true,
          fieldConfig: createFullFieldConfig()
        },
        {
          value: 'compact',
          name: 'Plantilla Compacta',
          label: 'Plantilla Compacta',
          description: 'Formato resumido para impresión rápida',
          content: `# {{nom_obra}}

**Ubicación:** {{dir_obra}}, {{poblacion_obra}}
**Duración:** {{duracion_meses}} meses | **Presupuesto:** €{{presupuesto_total_obra}}

**Contratista:** {{contratista.nom_contratista}} ({{contratista.cif_contratista}})
**Promotor:** {{nom_promotor}} ({{cif_promotor}})

## Descripción
{{desc_obra}}

## Capítulos y Partidas
{{#if userCapitulos}}
{{#each userCapitulos}}
### {{nom_capitulo}}
{{#each partidas}}
- {{concepto}}: €{{precioud}} ({{tipo_concepto_unidad}})
{{/each}}
{{/each}}
{{else if partidasnombre}}
{{#each partidasnombre}}
- {{this}}: {{lookup ../partidasprecio @index}}€ ({{lookup ../partidasunidad @index}})
{{/each}}
{{/if}}

## Detalles Gráficos
{{#if detalles_graficos_count}}
Se incluyen {{detalles_graficos_count}} imágenes de detalles gráficos:

{{detalles_graficos}}
{{else}}
No se han añadido detalles gráficos a este plan.
{{/if}}`,
          isDefault: false,
          isGlobal: true,
          fieldConfig: {
            obra: { info_basica: true, ubicacion: true, caracteristicas: false, presupuesto: true, tiempo_costes: false, capitulos: false },
            plan: { info_general: true, entorno: false, interferencias: false, servicios: false, asistencia: false, condiciones_ambientales: false, detalles_graficos: true },
            contratista: true,
            promotor: false
          }
        },
        {
          value: 'professional',
          name: 'Plantilla Profesional',
          label: 'Plantilla Profesional',
          description: 'Formato empresarial con branding personalizado',
          content: `---
title: Plan de Seguridad y Salud
subtitle: {{nom_obra}}
author: {{contratista.nom_contratista}}
date: {{createdAt}}
---

# PLAN DE SEGURIDAD Y SALUD

## PROYECTO: {{nom_obra}}

### DATOS GENERALES DEL PROYECTO

| Campo | Valor |
|-------|-------|
| **Obra** | {{nom_obra}} |
| **Dirección** | {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}}) |
| **Superficie** | {{superficie_construida_obra}} m² |
| **Duración** | {{duracion_meses}} meses |
| **Presupuesto Total** | €{{presupuesto_total_obra}} |
| **Presupuesto Seguridad** | €{{presupuesto_total_seguridad}} |
| **Descripción** | {{tableCell desc_obra}} |

### AGENTES INTERVINIENTES

#### CONTRATISTA
- **Razón Social:** {{contratista.nom_contratista}}
- **CIF:** {{contratista.cif_contratista}}
- **Dirección:** {{contratista.dir_contratista}}, {{contratista.pob_contratista}} ({{contratista.cp_contratista}})
- **Contacto:** {{contratista.telf_contratista}} | {{contratista.email_contratista}}

#### PROMOTOR
- **Nombre:** {{nom_promotor}}
- **CIF:** {{cif_promotor}}
- **Dirección:** {{dir_promotor}}, {{localidad_promotor}} ({{cp_promotor}})
- **Contacto:** {{telf_promotor}} | {{email_promotor}}

### DESCRIPCIÓN DEL PROYECTO

{{desc_obra}}

### CONDICIONES PARTICULARES

{{desc_condiciones_obra}}

### Capítulos y Partidas
{{#if userCapitulos}}
{{#each userCapitulos}}
#### {{nom_capitulo}}
{{#each partidas}}
- **{{concepto}}**: €{{precioud}} ({{tipo_concepto_unidad}})
{{/each}}
{{/each}}
{{else if partidasnombre}}
{{#each partidasnombre}}
- **Partida {{@index}}**: {{this}} - €{{lookup ../partidasprecio @index}} ({{lookup ../partidasunidad @index}})
{{/each}}
{{else}}
- Sin capítulos o partidas especificados
{{/if}}

### DETALLES GRÁFICOS
{{#if detalles_graficos_count}}
Se incluyen {{detalles_graficos_count}} imágenes de detalles gráficos:

{{detalles_graficos}}
{{else}}
No se han añadido detalles gráficos a este plan.
{{/if}}

---
*Documento generado automáticamente por el sistema de gestión de planes de seguridad*`,
          isDefault: false,
          isGlobal: true,
          fieldConfig: createFullFieldConfig()
        }
      ]
    },

    /**
     * Clear all templates
     */
    clearTemplates() {
      this.templates = []
      this.error = null
    },

    /**
     * Set error state
     */
    setError(error: string) {
      this.error = error
      this.isLoading = false
    },

    /**
     * Get template by value/id
     */
    getTemplateByValue(value: string): PrintingTemplate | null {
      return this.templates.find(t => t.value === value) || null
    }
  }
})
