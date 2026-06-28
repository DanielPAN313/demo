import type {
  AgentMessage,
  ExternalEvent,
  FixedSchedule,
  GitHubInboxItem,
  NotificationItem,
  SchedulePlan,
  SuggestedAction,
  Task,
  UserState,
} from '../types'
import type { MorningBrief } from '../modules/morningBrief'

export type ScenarioId =
  | 'baseline'
  | 'poorSleep'
  | 'highStress'
  | 'githubP1'
  | 'nightMode'
  | 'morningBrief'

export type AppState = {
  fixedSchedules: FixedSchedule[]
  tasks: Task[]
  userState: UserState
  externalEvents: ExternalEvent[]
  schedulePlan?: SchedulePlan
  notifications: NotificationItem[]
  morningBrief?: MorningBrief
  agentMessages: AgentMessage[]
  suggestedActions: SuggestedAction[]
  githubInboxItems: GitHubInboxItem[]
  currentScenario: ScenarioId
}

export type AppAction =
  | { type: 'setUserState'; payload: UserState }
  | { type: 'insertExternalEvent'; payload: ExternalEvent }
  | { type: 'insertExternalEvents'; payload: ExternalEvent[] }
  | { type: 'updateSchedulePlan'; payload: SchedulePlan }
  | { type: 'updateNotifications'; payload: NotificationItem[] }
  | { type: 'updateMorningBrief'; payload: MorningBrief }
  | { type: 'addAgentMessage'; payload: AgentMessage }
  | { type: 'addAgentMessages'; payload: AgentMessage[] }
  | { type: 'updateSuggestedActions'; payload: SuggestedAction[] }
  | { type: 'updateGitHubInboxItems'; payload: GitHubInboxItem[] }
  | { type: 'switchScenario'; payload: ScenarioId }
  | { type: 'resetDemo' }

export type AppStateActions = {
  setUserState: (userState: UserState) => void
  insertExternalEvent: (event: ExternalEvent) => void
  insertExternalEvents: (events: ExternalEvent[]) => void
  updateSchedulePlan: (schedulePlan: SchedulePlan) => void
  updateNotifications: (notifications: NotificationItem[]) => void
  updateMorningBrief: (morningBrief: MorningBrief) => void
  addAgentMessage: (message: Omit<AgentMessage, 'id' | 'createdAt'>) => void
  addAgentMessages: (messages: Omit<AgentMessage, 'id' | 'createdAt'>[]) => void
  updateSuggestedActions: (suggestedActions: SuggestedAction[]) => void
  updateGitHubInboxItems: (items: GitHubInboxItem[]) => void
  switchScenario: (scenario: ScenarioId) => void
  resetDemo: () => void
}

export type AppStateContextValue = {
  state: AppState
  actions: AppStateActions
}

const initialUserState: UserState = {
  sleepScore: 72,
  fatigueLevel: 'medium',
  stressLevel: 'medium',
  mood: 'normal',
  energyLevel: 'medium',
  focusCapacity: 45,
  lastUpdated: new Date(0).toISOString(),
  label: 'Baseline',
  adjustmentHint: 'Keep a normal task density until a scenario is triggered.',
}

const initialFixedSchedules: FixedSchedule[] = [
  {
    id: 'sleep-anchor',
    title: 'Sleep anchor',
    type: 'sleep',
    startTime: '00:00',
    endTime: '08:00',
    locked: true,
  },
]

const initialTasks: Task[] = [
  {
    id: 'task-demo-loop',
    title: 'Build reschedule demo loop',
    priority: 'P1',
    estimatedMinutes: 90,
    intensity: 'deep',
    category: 'coding',
    splittable: true,
    status: 'pending',
    source: 'user',
  },
]

export const initialAppState: AppState = {
  fixedSchedules: initialFixedSchedules,
  tasks: initialTasks,
  userState: initialUserState,
  externalEvents: [],
  notifications: [],
  agentMessages: [
    {
      id: 'msg-welcome',
      role: 'agent',
      content: 'I am ready to protect focus blocks and explain schedule changes.',
      createdAt: new Date(0).toISOString(),
    },
  ],
  suggestedActions: [],
  githubInboxItems: [],
  currentScenario: 'baseline',
}

export const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'setUserState':
      return {
        ...state,
        userState: action.payload,
      }
    case 'insertExternalEvent':
      return {
        ...state,
        externalEvents: [...state.externalEvents, action.payload],
      }
    case 'insertExternalEvents':
      return {
        ...state,
        externalEvents: [
          ...action.payload,
          ...state.externalEvents.filter(
            (event) =>
              !action.payload.some((payloadEvent) => payloadEvent.id === event.id),
          ),
        ],
      }
    case 'updateSchedulePlan':
      return {
        ...state,
        schedulePlan: action.payload,
      }
    case 'updateNotifications':
      return {
        ...state,
        notifications: action.payload,
      }
    case 'updateMorningBrief':
      return {
        ...state,
        morningBrief: action.payload,
      }
    case 'addAgentMessage':
      return {
        ...state,
        agentMessages: [...state.agentMessages, action.payload],
      }
    case 'addAgentMessages':
      return {
        ...state,
        agentMessages: [...state.agentMessages, ...action.payload],
      }
    case 'updateSuggestedActions':
      return {
        ...state,
        suggestedActions: action.payload,
      }
    case 'updateGitHubInboxItems':
      return {
        ...state,
        githubInboxItems: action.payload,
      }
    case 'switchScenario':
      return {
        ...state,
        currentScenario: action.payload,
      }
    case 'resetDemo':
      return initialAppState
    default:
      return state
  }
}

export const createMessage = (
  message: Omit<AgentMessage, 'id' | 'createdAt'>,
): AgentMessage => ({
  ...message,
  id: globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}`,
  createdAt: new Date().toISOString(),
})
