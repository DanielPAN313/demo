import type { ExternalEvent, NotificationChannel, UserState } from '../types'

export const decideNotificationRoute = (
  event: ExternalEvent,
  state: UserState,
  isNight = false,
): NotificationChannel => {
  if (event.priority === 'P0') return 'immediate'
  if (isNight) return 'silent'
  if (event.priority === 'P1' && state.stressLevel !== 'high') return 'immediate'
  if (event.priority === 'P1') return 'defer'

  return 'digest'
}
