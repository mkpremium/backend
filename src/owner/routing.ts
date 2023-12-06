import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'
import jwt from '../middleware/jwt'
import { wrap } from 'express-promise-wrap'

export const setupOwnersRoutes = (app: Express, container: AwilixContainer) => {
  const secured = jwt()
  const router = Router()

  router.get('/:ownerId', wrap(container.resolve('getOwnerController')))
  router.put('/:id', wrap(container.resolve('updateOwnerController')))

  router.put('/:ownerId/contacts/:contactId', wrap(container.resolve('changeContactStatusController')))
  router.put('/:ownerId/contacts/:contactId/status', wrap(container.resolve('changeContactStatusController')))

  router.post('/:id/contacts', wrap(container.resolve('addOwnerContactController')))

  router.put('/:ownerId/featured-contact', wrap(container.resolve('setFeaturedContactController')))

  router.post('/search', wrap(container.resolve('searchOwnerController')))

  app.use('/owners', secured, router)
}
