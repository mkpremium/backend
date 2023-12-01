import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'

export function userEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
    'user.remove_favorite_building',
    container.resolve('removeFavoriteForNoSaleBuildings')
  )
}
