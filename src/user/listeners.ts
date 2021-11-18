import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'

export function userEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    BUILDING_NEGOTIATION_STATUS_CHANGED,
    'user.remove_favorite_building',
    container.resolve('removeFavoriteForNoSaleBuildings')
  )
}
