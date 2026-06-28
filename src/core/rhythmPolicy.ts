import type { TaskIntensity, TimeBlockType, UserState } from '../types'

export const preferredModeByTaskIntensity: Record<TaskIntensity, TimeBlockType> = {
  deep: 'focus',
  medium: 'focus',
  light: 'micro',
  recovery: 'rest',
}

export const shouldReduceDeepWork = (state: UserState): boolean =>
  state.sleepScore < 70 || state.fatigueLevel === 'high' || state.focusCapacity < 30
