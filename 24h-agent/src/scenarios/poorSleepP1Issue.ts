import { baselineSchedule, initialUserState, urgentGithubEvent } from '../data/demoData'

export const poorSleepP1IssueScenario = {
  name: 'Poor sleep + GitHub P1 issue',
  state: {
    ...initialUserState,
    sleepScore: 54,
    fatigueLevel: 'high' as const,
    focusCapacity: 'low' as const,
  },
  schedule: baselineSchedule,
  event: urgentGithubEvent,
}

