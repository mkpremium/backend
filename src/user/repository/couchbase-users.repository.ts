import { User, UserProps } from '../../types/user'
import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import * as TE from 'fp-ts/TaskEither'
import { map } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import fromJSON from 'tcomb/lib/fromJSON'
import {
  FlipperFavoritesBuildingsService,
  UserNotFound
} from '../../flipper/service/flipper-favorites-buildings.service'

export class CouchbaseUsersRepository extends CouchbaseRepository<UserProps> implements FlipperFavoritesBuildingsService {
  struct () {
    return User
  }

  async getUserWithUsername (username) {
    const rows = await this.couchbaseAdapter.queryAsync(
      `SELECT *
       FROM ${this.bucketName}
       WHERE _documentType = 'operator'
         AND username = $1`,
      [username]
    )
    if (rows.length === 0)
      throw new UserNotFound(username)

    return fromJSON(rows[0], User)
  }

  async addFavoriteBuildingToUserOfId (userId, buildingId) {
    const user = await this.get(userId)

    const favoriteBuildings = user.favoriteBuildings

    if (favoriteBuildings.indexOf(buildingId) !== -1) {
      return
    }

    const updatedUser = User.update(user, {
      favoriteBuildings: {
        $set: [ ...favoriteBuildings, buildingId ]
      }
    })

    return this.couchbaseAdapter.save(updatedUser as any, User)
  }

  async removeFavoriteBuildingToUserOfId (userId, buildingId) {
    const user = await this.get(userId)
    if (!user) {
      throw new UserNotFound(userId)
    }

    const favoriteBuildings = user.favoriteBuildings
    const updatedFavoriteBuildings = favoriteBuildings.filter(b => b !== buildingId)

    const updatedUser = t.update(user, {
      favoriteBuildings: {
        $set: updatedFavoriteBuildings
      }
    })

    return this.couchbaseAdapter.save(updatedUser as any, User)
  }

  withFavoriteBuilding (buildingId: string): TE.TaskEither<Error, UserProps | undefined> {
    const query = `
        SELECT flipper.*
        FROM ${this.bucketName} flipper
        WHERE flipper._documentType = 'operator'
            AND $1 IN favoriteBuildings
    `
    return pipe(
      fromPromise(this.couchbaseAdapter.queryAsync(query, [buildingId])),
      map(rows => {
        if (rows.length === 0) {
          return undefined
        }

        return fromJSON(rows[ 0 ], User)
      })
    )
  }
}
