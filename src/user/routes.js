import { Router } from 'express'
import { createMeController, createAddFavoritesController, createDeleteFavoriteBuildingController } from './controllers'
import { wrap } from 'express-promise-wrap'

export const userRoutes = awilixContainer => {
  const router = new Router()

  router.get('/me', wrap(createMeController(awilixContainer.resolve('usersRepository'))))
  router.post('/favorites', wrap(createAddFavoritesController(awilixContainer.resolve('addFavoriteBuildingService'))))
  router.delete('/favorites/:buildingId', wrap(createDeleteFavoriteBuildingController(awilixContainer.resolve('deleteFavoriteBuildingService'))))

  return router
}
