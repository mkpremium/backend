import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { FoundOwnerProps } from '../repository/owner.repository'

export class SearchOwnerOrBuildingService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository
  ) {
  }

  search(phoneNumber: string): Promise<FoundOwnerProps[]> {
    return this.couchbaseOwnersRepository.findByPhoneNumber(phoneNumber)
  }
}
