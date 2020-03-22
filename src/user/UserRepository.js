import { Operator } from '../types/operator'

export class UserRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getUserOfId (id) {
    return this.couchbaseAdapter.getEntity(Operator, id)
  }
}
