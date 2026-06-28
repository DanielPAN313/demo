import type { ExternalEvent, UserState } from '../types'

export type AutonomyLevel = 'auto' | 'ask' | 'lock'

export const decideAutonomyLevel = (
  event: ExternalEvent | undefined,
  state: UserState,
): AutonomyLevel => {
  if (!event) return 'auto'
  if (event.priority === 'P0') return 'ask'
  if (event.priority === 'P1' && state.stressLevel === 'high') return 'ask'

  return 'auto'
}
