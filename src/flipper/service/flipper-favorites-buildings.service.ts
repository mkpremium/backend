import { UserProps } from '../../types/user'
import * as TE from 'fp-ts/TaskEither'

export interface FlipperFavoritesBuildingsService {
  addFavoriteBuildingToUserOfId (userId: string, buildingId: string): Promise<UserProps>
  removeFavoriteBuildingToUserOfId (userId: string, buildingId: string): Promise<UserProps>
  withFavoriteBuilding (buildingId: string): TE.TaskEither<Error, UserProps | undefined>
}

export class UserNotFound extends Error {
  constructor (readonly userId: string) {
    super(`User of id ${userId} doesn't exists`)
  }
}
