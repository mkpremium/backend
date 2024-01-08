import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'
import { subscribeToCommand } from '../infrastructure/listeners'

export function userEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
    'user.remove_favorite_building',
    container.resolve('removeFavoriteForNoSaleBuildings')
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OPERATOR,
    'importOperatorCommandHandler',
    container
  )
}
