import { Router } from 'express'
import { createMeController } from './controllers'

export const userRoutes = (couchbaseAdapter) => {
  const router = new Router()

  router.get('/me', createMeController(couchbaseAdapter))

  return router
}
