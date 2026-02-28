// utils/fluteHelpers.ts
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export const getFluteBadgeVariant = (code: string): 'primary' | 'success' | 'warning' | 'info' | 'gray' => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B': return 'primary'
    case 'C': return 'success'
    case 'CB':
    case 'BC': return 'warning'
    case 'EB':
    case 'E': return 'info'
    default: return 'gray'
  }
}

export const getFluteBadgeClass = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B': return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'C': return 'bg-green-100 text-green-800 border border-green-200'
    case 'CB':
    case 'BC': return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'EB':
    case 'E': return 'bg-purple-100 text-purple-800 border border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

export const getFluteIcon = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B': return 'mdi:alpha-b-box'
    case 'C': return 'mdi:alpha-c-box'
    case 'CB':
    case 'BC': return 'mdi:layers-triple'
    case 'EB':
    case 'E': return 'mdi:package-variant'
    default: return 'mdi:shape'
  }
}

export const FLUTE_TYPE_MAP: Record<string, string> = {
  'B': 'B-Flute',
  'C': 'C-Flute',
  'CB': 'CB-Flute',
  'BC': 'BC-Flute',
  'EB': 'EB-Flute',
  'E': 'E-Flute',
  'A': 'A-Flute',
  'F': 'F-Flute'
}