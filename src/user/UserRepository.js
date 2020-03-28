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

    const favouriteBuildings = user.favouriteBuildings

    if (favouriteBuildings.indexOf(buildingId) !== -1) {
      return
    }

    const updatedUser = t.update(user, {
      favouriteBuildings: {
        $set: [...favouriteBuildings, buildingId]
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
