import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import {
  appStateReducer,
  createMessage,
  initialAppState,
} from './appState'
import type { AppStateActions } from './appState'
import { AppStateContext } from './appStateContext'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialAppState)

  const actions = useMemo<AppStateActions>(
    () => ({
      setUserState: (userState) => dispatch({ type: 'setUserState', payload: userState }),
      insertExternalEvent: (event) =>
        dispatch({ type: 'insertExternalEvent', payload: event }),
      updateSchedulePlan: (schedulePlan) =>
        dispatch({ type: 'updateSchedulePlan', payload: schedulePlan }),
      updateNotifications: (notifications) =>
        dispatch({ type: 'updateNotifications', payload: notifications }),
      updateMorningBrief: (morningBrief) =>
        dispatch({ type: 'updateMorningBrief', payload: morningBrief }),
      addAgentMessage: (message) =>
        dispatch({ type: 'addAgentMessage', payload: createMessage(message) }),
      addAgentMessages: (messages) =>
        dispatch({
          type: 'addAgentMessages',
          payload: messages.map((message) => createMessage(message)),
        }),
      updateSuggestedActions: (suggestedActions) =>
        dispatch({ type: 'updateSuggestedActions', payload: suggestedActions }),
      switchScenario: (scenario) =>
        dispatch({ type: 'switchScenario', payload: scenario }),
      setAgentRunning: (isRunning) =>
        dispatch({ type: 'setAgentRunning', payload: isRunning }),
      resetDemo: () => dispatch({ type: 'resetDemo' }),
    }),
    [],
  )

  const value = useMemo(() => ({ state, actions }), [actions, state])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
