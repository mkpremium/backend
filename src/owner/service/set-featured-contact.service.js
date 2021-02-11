import _ from 'lodash'
import { mergeFeaturedContact } from '../owner'

export class EmptyFeaturedContact extends Error {
  constructor () {
    super('No phoneId nor emailId provided')
  }
}

export class SetOwnerFeaturedContactService {
  constructor (ownersRepository) {
    this.ownersRepository = ownersRepository
  }

  async setFeaturedContact (ownerId, featuredContact) {
    if (_.isEmpty(featuredContact.phoneId) && _.isEmpty(featuredContact.emailId)) {
      throw new EmptyFeaturedContact()
    }

    const owner = await this.ownersRepository.get(ownerId)
    const ownerWithFeaturedContact = mergeFeaturedContact(owner, featuredContact)

    return this.ownersRepository.save(ownerWithFeaturedContact)
  }
}
