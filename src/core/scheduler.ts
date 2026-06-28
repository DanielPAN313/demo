import type { ScheduleBlock, UserState } from '../types'

export const adjustScheduleForState = (
  schedule: ScheduleBlock[],
  state: UserState,
): ScheduleBlock[] => {
  if (state.sleepScore >= 70 && state.fatigueLevel !== 'high') {
    return schedule
  }

  return schedule.map((block) =>
    block.id === 'morning-focus'
      ? { ...block, title: 'Reduced-intensity deep work', endTime: '10:45' }
      : block,
  )
}
