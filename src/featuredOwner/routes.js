import { Router } from 'express'
import { PropertyManagerRepository } from '../PropertyManager/PropertyManagerRepository'
import { createSetFeaturedOwnerController } from './controllers'
import { FeaturedOwnerService } from './FeaturedOwnerService'

export const featuredOwnerRoutes = (couchbaseBucket) => {
  const propertyManagerRepository = new PropertyManagerRepository(couchbaseBucket)
  const featuredOwnerService = new FeaturedOwnerService(propertyManagerRepository)

  const router = new Router()

  router.post('/buildings/:id/set-featured-owner', createSetFeaturedOwnerController(featuredOwnerService))

  return router
}
