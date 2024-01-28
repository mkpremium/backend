import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { addFavoritesControllerFactory, deleteFavoriteBuildingControllerFactory, meControllerFactory } from './controllers'

export const setupUserRoutes = (app, container, secured) => {
  const router = Router()

  router.get('/me', wrap(meControllerFactory(container.resolve('usersRepository'))))
  router.post('/favorites', wrap(addFavoritesControllerFactory(container.resolve('flipperFavoritesBuildingsService'))))
  router.delete('/favorites/:buildingId', wrap(
    deleteFavoriteBuildingControllerFactory(container.resolve('deleteFavoriteBuildingService'))))


  app.use('/', secured, router)
}
