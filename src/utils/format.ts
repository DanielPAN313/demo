import type { TimeBlockType } from '../types'

export const modeLabel: Record<TimeBlockType, string> = {
  focus: 'Focus',
  micro: 'Micro-slot',
  rest: 'Rest',
  sleep: 'Sleep',
  fixed: 'Fixed',
  buffer: 'Buffer',
}
