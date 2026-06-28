import { BaseAgent } from '../core/BaseAgent'
import { generateNotifications } from '../modules/notificationEngine'
import { runAgentApi } from '../services/agentApi'
import type { AgentContext, AgentResult, NotificationChannel, NotificationItem } from '../types'

const countByChannel = (
  notifications: NotificationItem[],
  channel: NotificationChannel,
): number => notifications.filter((notification) => notification.channel === channel).length

export class InteractionAgent extends BaseAgent {
  constructor() {
    super('InteractionAgent')
  }

  private buildLocalResult(context: AgentContext): AgentResult {
    const notifications = generateNotifications(context.externalEvents, {
      currentTime: context.currentTime,
      eventType: context.eventType,
      userState: context.userState,
    })

    const immediateCount = countByChannel(notifications, 'immediate')
    const deferCount = countByChannel(notifications, 'defer')
    const digestCount = countByChannel(notifications, 'digest')
    const silentCount = countByChannel(notifications, 'silent')

    return {
      notifications,
      explanations: notifications.map(
        (notification) => `${notification.title}：${notification.reason}`,
      ),
      agentMessages: [
        this.createMessage(
          `InteractionAgent 已运行。我已将 ${notifications.length} 条外部事件分流：${immediateCount} 条立即提醒、${deferCount} 条稍后提醒、${digestCount} 条晨报汇总、${silentCount} 条静默归档。`,
        ),
      ],
    }
  }

  async run(context: AgentContext): Promise<AgentResult> {
    return runAgentApi(
      this.name,
      '你负责注意力防火墙和通知分流。把 externalEvents 分成 immediate、defer、digest、silent 四类，输出 notifications 和每条分流原因。',
      context,
      this.buildLocalResult(context),
    )
  }
}
