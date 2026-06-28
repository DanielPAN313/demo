import type { MorningBrief as MorningBriefData } from '../modules/morningBrief'

export type MorningBriefItem = {
  title: string
  description: string
}

export type MorningBriefProps = {
  morningBrief?: MorningBriefData
  summaryItems?: MorningBriefItem[]
  adjustmentReasons?: string[]
}

const defaultSummaryItems: MorningBriefItem[] = [
  {
    title: '夜间更新',
    description: '低优 GitHub 更新已归档，可在晨报中查看。',
  },
  {
    title: '协作消息',
    description: '普通协作消息不会打断夜间休息。',
  },
]

const defaultAdjustmentReasons = [
  '睡眠、固定日程和高优任务会共同影响今日排期。',
  '普通通知会被延后、汇总或静默处理。',
]

export function MorningBrief({
  morningBrief,
  summaryItems = defaultSummaryItems,
  adjustmentReasons = defaultAdjustmentReasons,
}: MorningBriefProps) {
  const activeSummaryItems = morningBrief
    ? [
        {
          title: '睡眠摘要',
          description: morningBrief.sleepSummary,
        },
        {
          title: '夜间事件',
          description: morningBrief.nightEventsSummary,
        },
        {
          title: '今日排期',
          description: morningBrief.scheduleSummary,
        },
        {
          title: '注意力分流',
          description: morningBrief.attentionSummary,
        },
      ]
    : summaryItems
  const activeAdjustmentReasons = morningBrief
    ? morningBrief.recommendedActions
    : adjustmentReasons

  return (
    <section className="panel morning-brief-panel" aria-labelledby="morning-brief-title">
      <div className="panel-title">
        <p className="eyebrow">Morning brief</p>
        <h2 id="morning-brief-title">{morningBrief?.title ?? '晨报与调整原因'}</h2>
      </div>

      <div className="brief-grid">
        <div className="brief-list">
          {activeSummaryItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <div className="reason-list">
          {activeAdjustmentReasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
