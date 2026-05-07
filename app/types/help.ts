export interface HelpAction {
  label: string
  icon?: string
  description?: string
}

export interface HelpContent {
  title: string
  location: string
  description: string
  tips: string[]
  actions?: HelpAction[]
}

export type HelpMap = Record<string, HelpContent>
