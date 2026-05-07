import { computed, ref, watch } from 'vue'
import type { TemplateFieldConfig } from '../../server/types/templates'
import { createFullFieldConfig, fieldConfigFromContent } from '../../server/types/templates'
import { usePlanesStore } from '../stores/planes'
import { useTemplatesStore } from '../stores/templates'
import {
  buildSchemaObra,
  buildSchemaPlan,
  buildSchemaContratista,
  buildSchemaPromotor
} from '../schemas/planes'

export function useTemplateFormFields() {
  const storePlanes = usePlanesStore()
  const storeTemplates = useTemplatesStore()

  const config = ref<TemplateFieldConfig>(createFullFieldConfig())

  const selectedTemplateValue = computed(() => {
    return storePlanes.planActual?.printingTemplate || ''
  })

  const currentTemplate = computed(() => {
    if (!selectedTemplateValue.value) return null
    return storeTemplates.getTemplateByValue(selectedTemplateValue.value)
  })

  function resolveConfig(tmpl: any): TemplateFieldConfig {
    if (tmpl?.fieldConfig) return tmpl.fieldConfig as TemplateFieldConfig
    if (tmpl?.content) return fieldConfigFromContent(tmpl.content as string)
    return createFullFieldConfig()
  }

  watch(currentTemplate, (tmpl) => {
    config.value = tmpl ? resolveConfig(tmpl) : createFullFieldConfig()
  }, { immediate: true })

  watch(selectedTemplateValue, (val) => {
    if (val) {
      const tmpl = storeTemplates.getTemplateByValue(val)
      config.value = tmpl ? resolveConfig(tmpl) : createFullFieldConfig()
    }
  }, { immediate: true })

  function isVisible(sectionPath: string): boolean {
    const cfg = config.value
    const parts = sectionPath.split('.')

    if (parts.length === 1) {
      const key = parts[0] as keyof TemplateFieldConfig
      return cfg[key] as boolean
    }

    if (parts.length === 2 && parts[1]) {
      const [group, field] = parts as [string, string]
      const groupConfig = cfg[group as keyof TemplateFieldConfig]
      if (typeof groupConfig === 'object' && groupConfig !== null) {
        return (groupConfig as Record<string, boolean>)[field] ?? true
      }
    }

    return true
  }

  function getTemplateDiff(
    oldConfig: TemplateFieldConfig,
    newConfig: TemplateFieldConfig
  ): { added: string[], removed: string[] } {
    const added: string[] = []
    const removed: string[] = []

    const allPaths: string[] = []

    const obraKeys = Object.keys(oldConfig.obra) as string[]
    obraKeys.forEach(k => allPaths.push(`obra.${k}`))
    const planKeys = Object.keys(oldConfig.plan) as string[]
    planKeys.forEach(k => allPaths.push(`plan.${k}`))
    allPaths.push('contratista', 'promotor')

    for (const path of allPaths) {
      const wasVisible = isVisibleInConfig(oldConfig, path)
      const willBeVisible = isVisibleInConfig(newConfig, path)
      if (willBeVisible && !wasVisible) added.push(path)
      if (!willBeVisible && wasVisible) removed.push(path)
    }

    return { added, removed }
  }

  function isVisibleInConfig(cfg: TemplateFieldConfig, path: string): boolean {
    const parts = path.split('.')
    if (parts.length === 1) {
      return cfg[parts[0] as keyof TemplateFieldConfig] as boolean
    }
    if (parts.length === 2 && parts[1]) {
      const [group, field] = parts as [string, string]
      const groupConfig = cfg[group as keyof TemplateFieldConfig]
      if (typeof groupConfig === 'object' && groupConfig !== null) {
        return (groupConfig as Record<string, boolean>)[field] ?? true
      }
    }
    return true
  }

  async function changeTemplate(newTemplateValue: string) {
    const oldConfig = { ...config.value }
    const tmpl = storeTemplates.getTemplateByValue(newTemplateValue)
    if (!tmpl) return

    const newCfg = resolveConfig(tmpl)
    const diff = getTemplateDiff(oldConfig, newCfg)
    storePlanes.updatePlanField('printingTemplate', newTemplateValue)
    config.value = newCfg

    if (diff.added.length > 0 || diff.removed.length > 0) {
      const toast = useToast()
      const parts: string[] = []
      if (diff.added.length > 0) parts.push(`+${diff.added.length} secciones visibles`)
      if (diff.removed.length > 0) parts.push(`-${diff.removed.length} secciones ocultas`)
      toast.add({
        title: 'Plantilla cambiada',
        description: parts.join(', '),
        color: 'success'
      })
    }

    return diff
  }

  // ─── Dynamic Zod schemas (respect visibility) ───

  const dynamicSchemaObra = computed(() => buildSchemaObra(config.value))
  const dynamicSchemaPlan = computed(() => buildSchemaPlan(config.value))
  const dynamicSchemaContratista = computed(() => buildSchemaContratista(config.value))
  const dynamicSchemaPromotor = computed(() => buildSchemaPromotor(config.value))

  return {
    config,
    isVisible,
    changeTemplate,
    selectedTemplateValue,
    currentTemplate,
    dynamicSchemaObra,
    dynamicSchemaPlan,
    dynamicSchemaContratista,
    dynamicSchemaPromotor
  }
}
