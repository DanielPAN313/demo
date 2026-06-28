import type { UserState } from '../../../types'

type StateControlPanelProps = {
  state: UserState
  onPoorSleep: () => void
  onHighStress: () => void
  onReset: () => void
}

export function StateControlPanel({
  state,
  onPoorSleep,
  onHighStress,
  onReset,
}: StateControlPanelProps) {
  return (
    <section className="panel" aria-labelledby="state-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">State sensing</p>
          <h2 id="state-title">User state simulator</h2>
        </div>
      </div>

      <div className="state-grid">
        <div>
          <span>Sleep</span>
          <strong>{state.sleepScore}</strong>
        </div>
        <div>
          <span>Stress</span>
          <strong>{state.stressLevel}</strong>
        </div>
        <div>
          <span>Fatigue</span>
          <strong>{state.fatigueLevel}</strong>
        </div>
        <div>
          <span>Focus</span>
          <strong>{state.focusCapacity}m</strong>
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={onPoorSleep}>
          Poor sleep
        </button>
        <button type="button" onClick={onHighStress}>
          High stress
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          Reset
        </button>
      </div>
    </section>
  )
}

