import type { FormData, FluteStats } from '../types/types'

export const BASE_FORM: FormData = { code: '', name: '' }

export const FLUTE_TYPE_MAP: Record<string, string> = {
  B:  'B-Flute',
  C:  'C-Flute',
  CB: 'CB-Flute',
  BC: 'BC-Flute',
  EB: 'EB-Flute',
  E:  'E-Flute',
  A:  'A-Flute',
  F:  'F-Flute',
}

export const EMPTY_STATS: FluteStats = {
  totalFlutes: 0,
  latestAdded: null,
  lastUpdated: null,
}