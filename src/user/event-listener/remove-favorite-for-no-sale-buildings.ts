import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { fromPromise } from '../../infrastructure/fp-utils'
import { User, UserProps } from '../../types/user'
import { UsersRepository } from '../repository/users.repository'

export function removeFavoriteForNoSaleBuildings ({ usersRepository }: { usersRepository: UsersRepository }) {
  return async function removeFavorite(evt: BuildingNegotiationStatusChanged) {
    if (evt.negotiationStatus !== 'NO VENDE') {
      return
    }
    await pipe(
      usersRepository.withFavoriteBuilding(evt.buildingId),
      TE.chain((user) => {
        if (!user) {
          return TE.of(undefined)
        }
        const updatedUser = removeFavoriteBuilding(user, evt.buildingId)
        return fromPromise(usersRepository.save(updatedUser))
      })
    )()
  }
}

function removeFavoriteBuilding (user: UserProps, buildingId: string): UserProps {
  return User.update(user, {
    favoriteBuildings: {
      $set: user.favoriteBuildings.filter(id => id !== buildingId)
    }
  })
}
