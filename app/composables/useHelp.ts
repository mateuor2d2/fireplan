import type { HelpContent } from '~/types/help'
import { helpContentMap } from '~/constants/helpContent'

const fallbackHelp: HelpContent = {
  title: 'Ayuda',
  location: 'Página actual',
  description: 'Esta es la ayuda contextual de v9planes. Aquí encontrarás información sobre la página que estás visitando.',
  tips: [
    'Navega por las diferentes secciones usando el menú principal.',
    'Si necesitas asistencia adicional, contacta con el equipo de soporte.'
  ]
}

function matchPath(path: string, pattern: string): boolean {
  const pathParts = path.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)

  function match(i: number, j: number): boolean {
    if (i === pathParts.length && j === patternParts.length) return true
    if (j >= patternParts.length) return i === pathParts.length

    const pPart = patternParts[j]

    // Optional param [[id]] -> matches 0 or 1 segment
    if (pPart.startsWith('[[') && pPart.endsWith(']]')) {
      // Try matching 1 segment
      if (i < pathParts.length && match(i + 1, j + 1)) return true
      // Try matching 0 segments
      if (match(i, j + 1)) return true
      return false
    }

    // Catch-all [...slug] -> matches 0 or more segments
    if (pPart.startsWith('[...') && pPart.endsWith(']')) {
      // Greedy: try consuming as many as possible
      for (let k = pathParts.length; k >= i; k--) {
        if (match(k, j + 1)) return true
      }
      return false
    }

    // Required param [id] -> matches exactly 1 segment
    if (pPart.startsWith('[') && pPart.endsWith(']')) {
      if (i >= pathParts.length) return false
      return match(i + 1, j + 1)
    }

    // Exact match
    if (i >= pathParts.length || pathParts[i] !== pPart) return false
    return match(i + 1, j + 1)
  }

  return match(0, 0)
}

export function useHelp() {
  const route = useRoute()

  const help = computed<HelpContent>(() => {
    const path = route.path

    // Special case: user settings page uses hash-based tabs
    if (/^\/protected\/usuarios\/[^/]+\/settings$/.test(path)) {
      const tab = route.hash.replace('#', '') || 'memorias'
      const key = `/protected/usuarios/[[id]]/settings#${tab}`
      if (helpContentMap[key]) {
        return helpContentMap[key]
      }
    }

    // Exact match first
    if (helpContentMap[path]) {
      return helpContentMap[path]
    }

    // Try parameterized matches in order of specificity (longest first)
    const patterns = Object.keys(helpContentMap).sort((a, b) => b.length - a.length)

    for (const pattern of patterns) {
      if (matchPath(path, pattern)) {
        return helpContentMap[pattern]
      }
    }

    // Fallback: try parent paths
    const parts = path.split('/').filter(Boolean)
    for (let i = parts.length - 1; i >= 0; i--) {
      const parentPath = '/' + parts.slice(0, i).join('/')
      if (helpContentMap[parentPath]) {
        return helpContentMap[parentPath]
      }
    }

    // Ultimate fallback so help is never empty
    return {
      ...fallbackHelp,
      title: `Ayuda: ${path || 'Inicio'}`
    }
  })

  return {
    help
  }
}
