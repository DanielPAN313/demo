import { createContext, useContext } from 'react'
import type { AppStateContextValue } from './appState'

export const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

export function useAppState() {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }

  return context
}

