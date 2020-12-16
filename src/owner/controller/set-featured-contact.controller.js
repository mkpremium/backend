import { FeaturedContact } from '../owner'
import { EmptyFeaturedContact } from '../SetOwnerFeaturedContactService'
import { newHttpError } from '../../lib/http-error'
import { OwnerNotFound } from '../OwnerRepository'

export const createSetFeaturedContactController = setOwnerFeaturedContactService => {
  return async (req, res) => {
    try {
      const featuredContact = FeaturedContact(req.body)
      await setOwnerFeaturedContactService.setFeaturedContact(req.params.ownerId, featuredContact)

      res.json()
    } catch (e) {
      if (e instanceof EmptyFeaturedContact) {
        throw newHttpError(400, `Invalid featured contact request.`)
      } else if (e instanceof OwnerNotFound) {
        throw newHttpError(400, e.message)
      } else {
        console.error(e)
        throw newHttpError(500, `Some error occurred while setting featured contact.`)
      }
    }
  }
}
