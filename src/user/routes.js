import { Router } from 'express'
import { createMeController, createAddFavoritesController, createDeleteFavoriteBuildingController } from './controllers'

export const userRoutes = (usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService) => {
  const router = new Router()

  router.get('/me', createMeController(usersRepository))
  router.post('/favorites', createAddFavoritesController(addFavoriteBuildingService))
  router.delete('/favorites/:buildingId', createDeleteFavoriteBuildingController(deleteFavoriteBuildingService))

  return router
}
