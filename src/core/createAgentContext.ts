import {
  externalEvents,
  fixedSchedules,
  initialNotifications,
  initialSchedulePlan,
  tasks,
  userStates,
} from '../data'
import type { AgentContext } from '../types'
import type { AgentRuntimeEvent } from './agentEvents'

export const createAgentContext = (event?: AgentRuntimeEvent): AgentContext => {
  const userState =
    event?.type === 'USER_STATE_CHANGED' && event.payload?.userState
      ? event.payload.userState
      : userStates.normal

  const insertedExternalEvents =
    event?.type === 'EXTERNAL_EVENT_INSERTED'
      ? [
          ...(event.payload?.externalEvents ?? []),
          ...(event.payload?.externalEvent ? [event.payload.externalEvent] : []),
        ]
      : []
  const contextExternalEvents =
    insertedExternalEvents.length > 0
      ? event?.payload?.replaceExternalEvents
        ? insertedExternalEvents
        : [
            ...insertedExternalEvents,
            ...externalEvents.filter(
              (externalEvent) =>
                !insertedExternalEvents.some(
                  (insertedEvent) => insertedEvent.id === externalEvent.id,
                ),
            ),
          ]
      : externalEvents

  const userCommand =
    event?.type === 'USER_COMMAND' && event.payload?.command
      ? event.payload.command
      : undefined

  return {
    fixedSchedules,
    tasks,
    userState,
    externalEvents: contextExternalEvents,
    schedulePlan: initialSchedulePlan,
    notifications: initialNotifications,
    agentMessages: [],
    currentTime: '10:30',
    eventType: event?.type ?? 'INIT',
    userCommand,
  }
}
