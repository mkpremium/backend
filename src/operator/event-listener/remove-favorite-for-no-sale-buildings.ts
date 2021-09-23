import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'

export function removeFavoriteForNoSaleBuildings() {
  return function(evt: BuildingNegotiationStatusChanged) {
  }
}
