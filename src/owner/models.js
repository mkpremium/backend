import { CouchbaseModel } from '../db/model'
import { Owner } from './owner'

export class OwnerRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = Owner
  }
}
