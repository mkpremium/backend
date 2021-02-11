import { mergeFeaturedContact } from '../owner'

export class SetOwnerFeaturedContactService {
  constructor (ownersRepository) {
    this.ownersRepository = ownersRepository
  }

  async setFeaturedContact (ownerId, featuredContact) {
    const owner = await this.ownersRepository.get(ownerId)
    const ownerWithFeaturedContact = mergeFeaturedContact(owner, featuredContact)

    return this.ownersRepository.save(ownerWithFeaturedContact)
  }
}
