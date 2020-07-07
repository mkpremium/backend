import { Operator } from '../types/operator'
import t from 'tcomb'

export class UserRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getUserOfId (id) {
    return this.couchbaseAdapter.getEntity(Operator, id)
  }

  async addFavoriteBuildingToUserOfId (userId, buildingId) {
    const user = await this.getUserOfId(userId)
    if (!user) {
      throw new UserNotFound(userId)
    }

    const favoriteBuildings = user.favoriteBuildings

    if (favoriteBuildings.indexOf(buildingId) !== -1) {
      return
    }

    const updatedUser = t.update(user, {
      favoriteBuildings: {
        $set: [...favoriteBuildings, buildingId]
      }
    })

    return this.couchbaseAdapter.save(updatedUser, Operator)
  }

  async removeFavoriteBuildingToUserOfId(userId, buildingId) {
    const user = await this.getUserOfId(userId)
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

    return this.couchbaseAdapter.save(updatedUser, Operator)
  }
}

class UserNotFound extends Error {
  constructor (userId) {
    super(`User of id ${userId} doesn't exists`)
    this.userId = userId
  }
}
