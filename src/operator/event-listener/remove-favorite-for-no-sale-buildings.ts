import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import { UsersRepository } from '../users.repository'

export function removeFavoriteForNoSaleBuildings ({ usersRepository }: { usersRepository: UsersRepository }) {
  return function (evt: BuildingNegotiationStatusChanged) {
    if (evt.negotiationStatus !== 'NO VENDE') {
      return
    }
  }
}
