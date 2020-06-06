import { Router } from 'express'
import { createSetFeaturedOwnerController } from './controllers'

export const featuredOwnerRoutes = featuredOwnerService => {
  const router = new Router()

  router.post('/buildings/:buildingId/set-featured-owner', createSetFeaturedOwnerController(featuredOwnerService))

  return router
}
