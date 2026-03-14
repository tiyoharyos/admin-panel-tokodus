// app/(protected)/flutes/constants.ts

import type { FormData } from '../types/types'

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

export const EMPTY_STATS = {
  totalFlutes: 0, bFlute: 0, cFlute: 0, cbFlute: 0, ebFlute: 0, others: 0,
}