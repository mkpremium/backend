import _ from 'lodash'

export class EmptyFeaturedContact extends Error {
}

export class SetOwnerFeaturedContactService {
  constructor (ownersRepository) {
    this.ownersRepository = ownersRepository
  }

  async setFeaturedContact (ownerId, featuredContact) {
    if (_.isEmpty(featuredContact.phoneId) && _.isEmpty(featuredContact.emailId)) {
      throw new EmptyFeaturedContact()
    }

    await this.ownersRepository.setOwnerFeaturedContact(ownerId, featuredContact)
  }
}
