import t from 'tcomb'
import { contactOfId, FeaturedContact, mergeFeaturedContact } from '../owner'

const FeaturedContactDef = t.union([
  t.String,
  FeaturedContact
])
FeaturedContactDef.dispatch = fc => fc instanceof Object ? FeaturedContact : t.String

export class SetOwnerFeaturedContactService {
  constructor (ownersRepository) {
    this.ownersRepository = ownersRepository
  }

  async setFeaturedContact (ownerId, featuredContact) {
    const owner = await this.ownersRepository.get(ownerId)
    const ownerWithFeaturedContact = t.match(FeaturedContactDef(featuredContact),
      FeaturedContact, fc => mergeFeaturedContact(owner, fc),
      t.String, contactId => {
        const contact = contactOfId(owner, contactId)
        return mergeFeaturedContact(
          owner,
          contact.type === 'EMAIL' ? { emailId: contact.id } : { phoneId: contact.id }
        )
      }
    )

    return this.ownersRepository.save(ownerWithFeaturedContact)
  }
}
