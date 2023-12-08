import { ContactProps, OwnerStatus, OwnerType } from '../owner'
import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'

export interface AddOwnerCommand {
  verified: boolean,
  buildingId: string,
  status: OwnerStatus,
  type: OwnerType,
  note: string,
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
    secondSurname: string,
    contacts: ContactProps[]
  }
}

export class AddOwnerService {
  constructor (private couchbaseOwnersRepository: CouchbaseOwnersRepository) {
  }

  addOwner (cmd: AddOwnerCommand) {
    return this.couchbaseOwnersRepository.save(cmd)
  }
}
