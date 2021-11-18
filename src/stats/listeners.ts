import { OperatorStats } from './models'
import { OperatorActions } from './types'
import { EventBus } from '../infrastructure/event-bus'

export function statListeners (eventBus: EventBus) {
  eventBus.on('worksheet.next_in_queue_taken',
    ({ by, source }) => OperatorStats.registerAction(by, OperatorActions.VIEW_WORKSHEET, source))
  eventBus.on('scheduled_events.call_scheduled',
    ({ userId }) => OperatorStats.registerAction(userId, OperatorActions.SCHEDULE_CALL))
}
