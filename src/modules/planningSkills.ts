import type { Priority } from '../types'

export type SkillScheduleItem = {
  date: string
  startTime: string
  endTime: string
  title: string
  priority: Priority
  reason: string
}

export type SkillPlanningResponse = {
  objective: string
  taskBreakdown: string[]
  constraints: string[]
  conflicts: string[]
  schedule: SkillScheduleItem[]
  answer: string
}

const knownConferences = [
  'AAAI',
  'CVPR',
  'ICML',
  'ICLR',
  'NeurIPS',
  'ACL',
  'EMNLP',
  'KDD',
  'SIGGRAPH',
  'CHI',
]

export const detectConference = (command: string): string | undefined => {
  const normalized = command.toLowerCase()

  return knownConferences.find((conference) => normalized.includes(conference.toLowerCase()))
}

const isConferenceAttendanceGoal = (objective: string): boolean => {
  const normalized = objective.toLowerCase()

  return (
    Boolean(detectConference(objective)) ||
    normalized.includes('conference') ||
    objective.includes('中稿') ||
    objective.includes('参会') ||
    objective.includes('现场')
  )
}

const hasGenericBreakdown = (items: string[]): boolean => {
  const joined = items.join(' ').toLowerCase()

  return (
    items.length < 5 ||
    !['camera', '注册', '签证', 'visa', 'poster', 'slides', 'rehearsal', '住宿', '酒店', '机票'].some(
      (keyword) => joined.includes(keyword),
    )
  )
}

const inferPriority = (title: string, fallback: Priority): Priority => {
  const normalized = title.toLowerCase()

  if (
    normalized.includes('deadline') ||
    normalized.includes('camera-ready') ||
    title.includes('注册') ||
    title.includes('签证') ||
    title.includes('入境') ||
    title.includes('邀请函')
  ) {
    return 'P0'
  }

  if (
    title.includes('机票') ||
    title.includes('住宿') ||
    normalized.includes('poster') ||
    normalized.includes('slides')
  ) {
    return fallback === 'P0' ? fallback : 'P1'
  }

  if (normalized.includes('rehearsal') || title.includes('讲解稿')) {
    return fallback === 'P0' || fallback === 'P1' ? fallback : 'P2'
  }

  return fallback
}

const createConferencePlanningResponse = (
  objective: string,
  conference = '会议',
): SkillPlanningResponse => ({
  objective,
  taskBreakdown: [
    `核对 ${conference} 官方 acceptance 后事项：camera-ready、注册、poster/slides、现场报到要求`,
    '整理论文最终版修改清单，确认作者信息、致谢、版权/开放获取选项',
    '完成参会注册，确认付款、发票、学生证明或 invitation letter',
    '确认入境/签证要求，准备护照、邀请函、在读/在职证明、资金或行程材料',
    '预订机票和住宿，优先选择可取消方案，并记录退改签 deadline',
    '制作 poster 或 slides，准备 3 分钟讲解和 30 秒 elevator pitch',
    '安排组内 rehearsal，收集反馈后做最终检查和备份',
  ],
  constraints: [
    'camera-ready、注册、签证/入境和机酒是硬约束，要早于展示材料启动。',
    '今天已有 P0/P1 工作，会议准备从明天开始，不挤占今天关键任务窗口。',
  ],
  conflicts: [
    '新目标需要和今天已有 P0/P1 任务整体重排；长周期事项先启动，创作类任务排到硬约束确认之后。',
  ],
  schedule: [
    {
      date: '2026-06-29',
      startTime: '09:30',
      endTime: '10:30',
      title: `核对 ${conference} 官方 deadline 和现场参会要求`,
      priority: 'P0',
      reason: '先确认 camera-ready、注册、现场报到、poster/slides 等硬性要求。',
    },
    {
      date: '2026-06-29',
      startTime: '14:00',
      endTime: '15:00',
      title: '整理 camera-ready 修改和提交材料清单',
      priority: 'P0',
      reason: '论文最终版和提交材料通常有明确截止时间，必须先锁定。',
    },
    {
      date: '2026-06-29',
      startTime: '15:15',
      endTime: '16:00',
      title: '确认注册、付款、邀请函和签证/入境材料',
      priority: 'P0',
      reason: '行政手续和签证/入境材料周期长，越早启动风险越低。',
    },
    {
      date: '2026-06-30',
      startTime: '10:00',
      endTime: '11:00',
      title: '筛选机票和住宿方案',
      priority: 'P1',
      reason: '现场参会需要尽早锁定可取消交通住宿，避免价格和名额风险。',
    },
    {
      date: '2026-06-30',
      startTime: '14:00',
      endTime: '16:00',
      title: '搭 poster/slides 第一版结构',
      priority: 'P1',
      reason: '展示材料需要多轮修改，先完成结构再进入视觉和讲稿。',
    },
    {
      date: '2026-07-01',
      startTime: '10:00',
      endTime: '11:00',
      title: '写 3 分钟讲解稿和 30 秒 elevator pitch',
      priority: 'P2',
      reason: '现场交流需要短讲和快速介绍，提前准备可以减少临场压力。',
    },
    {
      date: '2026-07-02',
      startTime: '15:00',
      endTime: '16:00',
      title: '组内 rehearsal 并收集反馈',
      priority: 'P2',
      reason: '让组里提前看一版，留出修改和备份时间。',
    },
  ],
  answer: '已拆成具体参会准备事项，并排到具体时间段。',
})

const normalizePriorities = (response: SkillPlanningResponse): SkillPlanningResponse => ({
  ...response,
  schedule: response.schedule.map((item) => ({
    ...item,
    priority: inferPriority(item.title, item.priority),
  })),
})

export const applyPlanningSkills = (
  response: SkillPlanningResponse,
  command: string,
): SkillPlanningResponse => {
  if (isConferenceAttendanceGoal(command) && hasGenericBreakdown(response.taskBreakdown)) {
    return createConferencePlanningResponse(
      response.objective || command,
      detectConference(command) ?? '会议',
    )
  }

  return normalizePriorities(response)
}
