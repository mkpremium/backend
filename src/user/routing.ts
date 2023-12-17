import jwt from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { createAddFavoritesController, createDeleteFavoriteBuildingController, createMeController } from './controllers'

export const setupUserRoutes = (app, container) => {
  const secured = jwt()

  const router = Router()

  router.get('/me', wrap(createMeController(container.resolve('usersRepository'))))
  router.post('/favorites', wrap(createAddFavoritesController(container.resolve('addFavoriteBuildingService'))))
  router.delete('/favorites/:buildingId', wrap(
    createDeleteFavoriteBuildingController(container.resolve('deleteFavoriteBuildingService'))))


  app.use('/', secured, router)
}
