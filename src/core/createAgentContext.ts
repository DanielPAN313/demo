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

  const contextExternalEvents =
    event?.type === 'EXTERNAL_EVENT_INSERTED' && event.payload?.externalEvent
      ? [
          event.payload.externalEvent,
          ...externalEvents.filter(
            (externalEvent) => externalEvent.id !== event.payload?.externalEvent?.id,
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
