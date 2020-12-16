import { Router } from 'express'
import {
  addOwnerContactController,
  listOwnerController,
  updateOwnerContactController,
  updateOwnerController
} from './controllers'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'
import { createSearchOwnersController } from './controller/search-owners.controller'
import { wrap } from 'express-promise-wrap'

export default (setOwnerFeaturedContactService, ownerRepository) => {
  const router = Router()

  router.put('/:id', updateOwnerController)

  router.put('/:id/contacts/:contactId', updateOwnerContactController)
  router.put('/:id/contacts/:contactId/status', updateOwnerContactController)

  router.post('/:id/contacts', addOwnerContactController)

  router.put('/:ownerId/featured-contact', createSetFeaturedContactController(setOwnerFeaturedContactService))

  router.get('/', listOwnerController)

  router.post('/search', wrap(createSearchOwnersController(ownerRepository)))

  return router
}
