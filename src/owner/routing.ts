import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'
import jwt from '../middleware/jwt'
import { addOwnerContactController, listOwnerController, updateOwnerController } from './controllers'
import { wrap } from 'express-promise-wrap'

export const setupOwnersRoutes = (app: Express, container: AwilixContainer) => {
  const secured = jwt()
  const router = Router()

  router.put('/:id', updateOwnerController)

  router.put('/:ownerId/contacts/:contactId', wrap(container.resolve('changeContactStatusController')))
  router.put('/:ownerId/contacts/:contactId/status', wrap(container.resolve('changeContactStatusController')))

  router.post('/:id/contacts', addOwnerContactController)

  router.put('/:ownerId/featured-contact', wrap(container.resolve('setFeaturedOwnerController')))

  router.get('/', listOwnerController)

  router.post('/search', wrap(container.resolve('searchOwnerController')))

  app.use('/owners', secured, router)
}
