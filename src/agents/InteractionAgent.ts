import { BaseAgent } from '../core/BaseAgent'
import { generateNotifications } from '../modules/notificationEngine'
import type { AgentContext, AgentResult, NotificationChannel, NotificationItem } from '../types'

const countByChannel = (
  notifications: NotificationItem[],
  channel: NotificationChannel,
): number => notifications.filter((notification) => notification.channel === channel).length

export class InteractionAgent extends BaseAgent {
  constructor() {
    super('InteractionAgent')
  }

  async run(context: AgentContext): Promise<AgentResult> {
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
        await this.createDeepSeekMessage(
          context,
          'Decide how notifications should reach the user without breaking focus unnecessarily.',
          [
            `${notifications.length} notifications routed.`,
            `${immediateCount} immediate, ${deferCount} deferred, ${digestCount} digest, ${silentCount} silent.`,
          ],
        ),
      ],
    }
  }
}
