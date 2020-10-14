import { Router } from 'express'
import {
  addOwnerContactController,
  createSetFeaturedContactController,
  listOwnerController,
  updateOwnerContactController,
  updateOwnerController
} from './controllers'

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
