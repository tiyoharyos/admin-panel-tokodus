import { AxiosError } from 'axios'
import type { Flute, FluteApiItem, FluteStats } from '../types/types'
import { FLUTE_TYPE_MAP } from '../constants/constants'

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const getFluteAccent = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'B':         return '#3b82f6'
    case 'C':         return '#10b981'
    case 'CB':
    case 'BC':        return '#f59e0b'
    case 'EB':
    case 'E':         return '#8b5cf6'
    default:          return '#64748b'
  }
}

export const getFluteIcon = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'B':         return 'mdi:alpha-b-box'
    case 'C':         return 'mdi:alpha-c-box'
    case 'CB':
    case 'BC':        return 'mdi:layers-triple'
    case 'EB':
    case 'E':         return 'mdi:package-variant'
    default:          return 'mdi:shape'
  }
}

export const resolveFluteName = (upperCode: string): string =>
  FLUTE_TYPE_MAP[upperCode] || `${upperCode}-Flute`

export const mapFluteItem = (item: FluteApiItem): Flute => ({
  id: item.id_f?.toString() || '',
  code: item.code || '',
  name: item.name || '',
  createdAt: item.created_at || new Date().toISOString(),
  updatedAt: item.updated_at || new Date().toISOString(),
})

export const calculateStats = (data: Flute[]): FluteStats => {
  const sorted = [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const updated = data
    .filter(f => f.updatedAt && f.updatedAt !== f.createdAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return {
    totalFlutes: data.length,
    latestAdded: sorted[0]
      ? { code: sorted[0].code, name: sorted[0].name, createdAt: sorted[0].createdAt }
      : null,
    lastUpdated: updated[0]
      ? { code: updated[0].code, name: updated[0].name, updatedAt: updated[0].updatedAt }
      : null,
  }
}

export const extractErrorMessage = (err: unknown, fallback = 'Terjadi kesalahan'): string => {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED') return 'Koneksi timeout. Silakan coba lagi.'
    if (!err.response) return 'Tidak bisa connect ke server. Periksa koneksi internet.'
    const msg = (err.response.data as { message?: string })?.message
    if (msg) return msg
  }
  if (err instanceof Error) return err.message
  return fallback
}

export const isDuplicateError = (err: unknown, code: string): string | null => {
  if (err instanceof AxiosError) {
    if (err.response?.status === 500 &&
      typeof err.response.data === 'string' &&
      err.response.data.includes('Duplicate entry'))
      return `Kode "${code}" sudah terdaftar.`
  }
  return null
}