import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { fromPromise } from '../../infrastructure/fp-utils'
import { FlipperFavoritesBuildingsService } from '../../flipper/service/flipper-favorites-buildings.service'

export function removeFavoriteForNoSaleBuildings ({ flipperFavoritesBuildingsService }: {
  flipperFavoritesBuildingsService: FlipperFavoritesBuildingsService
}) {
  return async function removeFavorite (evt: BuildingNegotiationStatusChanged) {
    if (evt.negotiationStatus !== 'NO VENDE') {
      return
    }
    await pipe(
      flipperFavoritesBuildingsService.withFavoriteBuilding(evt.buildingId),
      TE.chain((user) => {
        if (!user) {
          return TE.of(undefined)
        }
        return fromPromise(flipperFavoritesBuildingsService.removeFavoriteBuildingToUserOfId(user.id, evt.buildingId))
      })
    )()
  }
}
