import type {
  AgentResult,
  ExternalEvent,
  NotificationItem,
  ScheduleBlock,
  UserState,
} from '../types'

const routeEvent = (event: ExternalEvent, isNight = false): NotificationItem => {
  const channel = isNight ? 'silent' : event.interruptLevel

  return {
    id: `notification-${event.id}`,
    title: event.title,
    channel,
    sourceEventId: event.id,
    reason: event.summary,
    createdAt: new Date().toISOString(),
  }
}

export const runRhythmAgent = (
  schedule: ScheduleBlock[],
  state: UserState,
  event?: ExternalEvent,
): AgentResult => ({
  schedulePlan: {
    date: new Date().toISOString().slice(0, 10),
    blocks: schedule,
    summary: 'Mock rhythm agent schedule result.',
    generatedAt: new Date().toISOString(),
  },
  notifications: event ? [routeEvent(event)] : [],
  explanations: [
    state.sleepScore < 70
      ? 'Sleep score is low, so the agent would reduce task density.'
      : 'Current state is stable, so the baseline rhythm remains unchanged.',
  ],
})

export const buildMorningBrief = (
  nightEvents: ExternalEvent[],
  state: UserState,
): AgentResult => ({
  notifications: nightEvents.map((event) => routeEvent(event, true)),
  explanations: [
    'Night updates were silently archived and grouped for morning review.',
    `Sleep score is ${state.sleepScore}, so today can start with adjusted task density.`,
  ],
})

