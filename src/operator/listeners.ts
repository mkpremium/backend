import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'

export function operatorEventListeners (eventBus: EventBus, container: AwilixContainer) {
  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, container.resolve('removeFavoriteForNoSaleBuildings'))
}
