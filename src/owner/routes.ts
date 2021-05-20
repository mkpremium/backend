import { Router } from 'express'
import { addOwnerContactController, listOwnerController, updateOwnerController } from './controllers'
import { wrap } from 'express-promise-wrap'
import { AwilixContainer } from 'awilix'

export const ownersRouting = (container: AwilixContainer) => {
  const router = Router()

  router.put('/:id', updateOwnerController)

  router.put('/:ownerId/contacts/:contactId', wrap(container.resolve('changeContactStatusController')))
  router.put('/:ownerId/contacts/:contactId/status', wrap(container.resolve('changeContactStatusController')))

  router.post('/:id/contacts', addOwnerContactController)

  router.put('/:ownerId/featured-contact', wrap(container.resolve('setFeaturedOwnerController')))

  router.get('/', listOwnerController)

  router.post('/search', wrap(container.resolve('searchOwnerController')))

  return router
}
