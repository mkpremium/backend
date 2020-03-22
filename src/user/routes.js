import { Router } from 'express'
import { createMeController } from './controllers'

export const userRoutes = (usersRepository) => {
  const router = new Router()

  router.get('/me', createMeController(usersRepository))

  return router
}
