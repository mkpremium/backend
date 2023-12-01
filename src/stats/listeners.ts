import { OperatorStats } from './models'
import { OperatorActions } from './types'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'

export function statListeners (eventBus: EventListener) {
  eventBus.on(
    DomainEventCatalog.WORKSHEET__NEXT_IN_QUEUE_TAKEN,
    'stats.count_view',
    ({ by, source }) => OperatorStats.registerAction(by, OperatorActions.VIEW_WORKSHEET, source))
  eventBus.on(
    DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED,
    'stats.count_scheduled_call',
    ({ userId }) => OperatorStats.registerAction(userId, OperatorActions.SCHEDULE_CALL))
}
