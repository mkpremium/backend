import { Router } from 'express'
import { createMeController, createAddFavoritesController } from './controllers'

export const userRoutes = (usersRepository, addFavoriteBuildingService) => {
  const router = new Router()

  router.get('/me', createMeController(usersRepository))
  router.post('/favorites', createAddFavoritesController(addFavoriteBuildingService))

  return router
}
