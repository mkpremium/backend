import { Router } from 'express'
import {
  addOwnerContactController,
  listOwnerController,
  updateOwnerContactController,
  updateOwnerController
} from './controllers'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'

const router = Router()

router.put('/:id', updateOwnerController)

router.put('/:id/contacts/:contactId', updateOwnerContactController)
router.put('/:id/contacts/:contactId/status', updateOwnerContactController)

router.post('/:id/contacts', addOwnerContactController)

router.get('/', listOwnerController)

export default (setOwnerFeaturedContactService) => {
  router.put('/:ownerId/featured-contact', createSetFeaturedContactController(setOwnerFeaturedContactService))

  return router
}
