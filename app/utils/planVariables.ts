// Utility function to extract template variables from a Plan object
import type { Plan } from '@/stores/planes'

// Define which fields should be available as template variables
// We focus on string and number fields that make sense in templates
const TEMPLATE_VARIABLE_FIELDS: Array<keyof Plan> = [
  'nom_obra',
  'dir_obra',
  'poblacion_obra',
  'cp_obra',
  'desc_obra',
  'desc_condiciones_obra',
  'entorno_obra',
  'condiciones_entorno_obra',
  'lineas_aereas',
  'conducciones_enterradas',
  'estado_medianeras',
  'acometidas',
  'interferencias_edificios',
  'servidumbres_de_paso',
  'trafico',
  'instalacion_electrica',
  'instalacion_agua',
  'centro_asistencial',
  'centro_asistencial_primaria',
  'num_extintoresco2',
  'num_extintoresabc',
  'num_duchas',
  'num_lavabos',
  'num_comedores',
  'num_vestuarios',
  'contenido_botiquin',
  'orografia',
  'condiciones_clima',
  'nom_contratista',
  'cif_contratista',
  'dir_contratista',
  'localidad_contratista',
  'cp_contratista',
  'telf_contratista',
  'nom_recurso_preventivo',
  'dni_recurso_preventivo',
  'telf_recurso_preventivo',
  'email_contratista',
  'nom_promotor',
  'cif_promotor',
  'dir_promotor',
  'localidad_promotor',
  'cp_promotor',
  'telf_promotor',
  'email_promotor',
  'nom_plandeseguridad',
  'desc_plandeseguridad',
  'num_trab_plan',
  'hay_planos'
]

// Additional fields that should be available with nested access
const NESTED_VARIABLE_FIELDS: Record<string, Array<{ field: string, label: string }>> = {
  contratista: [
    { field: 'nom_contratista', label: 'Nombre del contratista' },
    { field: 'cif_contratista', label: 'CIF del contratista' },
    { field: 'dir_contratista', label: 'Dirección del contratista' },
    { field: 'localidad_contratista', label: 'Localidad del contratista' },
    { field: 'cp_contratista', label: 'Código postal del contratista' },
    { field: 'telf_contratista', label: 'Teléfono del contratista' },
    { field: 'email_contratista', label: 'Email del contratista' }
  ],
  promotor: [
    { field: 'nom_promotor', label: 'Nombre del promotor' },
    { field: 'cif_promotor', label: 'CIF del promotor' },
    { field: 'dir_promotor', label: 'Dirección del promotor' },
    { field: 'localidad_promotor', label: 'Localidad del promotor' },
    { field: 'cp_promotor', label: 'Código postal del promotor' },
    { field: 'telf_promotor', label: 'Teléfono del promotor' },
    { field: 'email_promotor', label: 'Email del promotor' }
  ]
}

export interface TemplateVariable {
  key: string
  description: string
}

/**
 * Extract template variables from the Plan interface
 * @returns Array of template variables with their keys and descriptions
 */
export function getPlanTemplateVariables(): TemplateVariable[] {
  const variables: TemplateVariable[] = []

  // Add basic fields
  TEMPLATE_VARIABLE_FIELDS.forEach((field) => {
    // Convert camelCase to human readable format
    const label = field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())

    variables.push({
      key: `{{${field}}}`,
      description: label
    })
  })

  // Add nested fields
  Object.entries(NESTED_VARIABLE_FIELDS).forEach(([category, fields]) => {
    fields.forEach(({ field, label }) => {
      variables.push({
        key: `{{${category}.${field}}}`,
        description: label
      })
    })
  })

  // Add numeric fields with special handling
  variables.push(
    { key: '{{duracion_meses}}', description: 'Duración en meses' },
    { key: '{{presupuesto_total_obra}}', description: 'Presupuesto total de la obra' },
    { key: '{{presupuesto_total_seguridad}}', description: 'Presupuesto total de seguridad' },
    { key: '{{presupuesto_objeto_obra}}', description: 'Presupuesto objeto de obra' },
    { key: '{{presupuesto_objeto_seguridad}}', description: 'Presupuesto objeto de seguridad' },
    { key: '{{perimetro_obra}}', description: 'Perímetro de la obra' },
    { key: '{{superficie_construida_obra}}', description: 'Superficie construida' },
    { key: '{{num_plantas_sobre}}', description: 'Número de plantas sobre rasante' },
    { key: '{{num_plantas_bajo}}', description: 'Número de plantas bajo rasante' }
  )

  return variables
}

/**
 * Get a sample plan object with default values for template preview
 * @returns Partial Plan object with sample values
 */
export function getSamplePlanData(): Partial<Plan> {
  return {
    nom_obra: 'Nombre de la Obra',
    dir_obra: 'Dirección de la Obra',
    poblacion_obra: 'Población',
    cp_obra: '00000',
    duracion_meses: 12,
    presupuesto_total_obra: 100000,
    desc_obra: 'Descripción detallada de la obra',
    desc_condiciones_obra: 'Condiciones generales de la obra',
    nom_contratista: 'Nombre del Contratista S.A.',
    cif_contratista: 'B12345678',
    dir_contratista: 'Dirección del Contratista',
    nom_promotor: 'Nombre del Promotor',
    cif_promotor: 'B87654321',
    dir_promotor: 'Dirección del Promotor',
    desc_plandeseguridad: 'Descripción del plan de seguridad',
    num_trab_plan: '10',
    hay_planos: 'Sí'
  }
}
