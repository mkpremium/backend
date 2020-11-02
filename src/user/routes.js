import { Router } from 'express'
import { createMeController, createAddFavoritesController, createDeleteFavoriteBuildingController } from './controllers'
import { wrap } from 'express-promise-wrap'

export const userRoutes = (usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService) => {
  const router = new Router()

  router.get('/me', wrap(createMeController(usersRepository)))
  router.post('/favorites', wrap(createAddFavoritesController(addFavoriteBuildingService)))
  router.delete('/favorites/:buildingId', wrap(createDeleteFavoriteBuildingController(deleteFavoriteBuildingService)))

  return router
}
