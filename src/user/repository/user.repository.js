import { User } from '../../types/user'
import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'

export class UserRepository extends CouchbaseRepository {
  struct () {
    return User
  }

  async addFavoriteBuildingToUserOfId (userId, buildingId) {
    const user = await this.get(userId)

    const favoriteBuildings = user.favoriteBuildings

    if (favoriteBuildings.indexOf(buildingId) !== -1) {
      return
    }

    const updatedUser = t.update(user, {
      favoriteBuildings: {
        $set: [ ...favoriteBuildings, buildingId ]
      }
    })

    return this.couchbaseAdapter.save(updatedUser, User)
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

    return this.couchbaseAdapter.save(updatedUser, User)
  }
}

class UserNotFound extends Error {
  constructor (userId) {
    super(`User of id ${userId} doesn't exists`)
    this.userId = userId
  }
}
