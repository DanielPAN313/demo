export type FatigueLevel = 'low' | 'medium' | 'high'

export type StressLevel = 'low' | 'medium' | 'high'

export type Mood = 'calm' | 'normal' | 'anxious' | 'low'

export type EnergyLevel = 'low' | 'medium' | 'high'

export type UserState = {
  sleepScore: number
  fatigueLevel: FatigueLevel
  stressLevel: StressLevel
  mood: Mood
  energyLevel: EnergyLevel
  focusCapacity: number
  lastUpdated: string
  label?: string
  adjustmentHint?: string
}

