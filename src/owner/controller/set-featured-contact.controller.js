import { WrongFeaturedContact, FeaturedContact } from '../owner'
import { newHttpError } from '../../lib/http-error'
import { logger } from '../../infrastructure/logger'

export const createSetFeaturedContactController = setOwnerFeaturedContactService => {
  return async (req, res) => {
    try {
      const featuredContact = FeaturedContact(req.body)
      await setOwnerFeaturedContactService.setFeaturedContact(req.params.ownerId, featuredContact)

      res.json()
    } catch (e) {
      if (e instanceof WrongFeaturedContact) {
        throw newHttpError(400, 'Invalid featured contact request.')
      } else {
        logger.error(e)
        throw newHttpError(500, 'Some error occurred while setting featured contact.')
      }
    }
  }
}
