import _ from 'lodash'

export class EmptyFeaturedContact extends Error {
}

export class SetOwnerFeaturedContactService {
  constructor (ownerRepository) {
    this.ownerRepository = ownerRepository
  }

  async setFeaturedContact (ownerId, featuredContact) {
    if (_.isEmpty(featuredContact.phoneId) && _.isEmpty(featuredContact.emailId)) {
      throw new EmptyFeaturedContact()
    }

    await this.ownerRepository.setOwnerFeaturedContact(ownerId, featuredContact)
  }
}
