import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'

export const callsRoutes = (container: AwilixContainer, app: Express) => {
  const router = Router()

  router.post('/token', container.resolve('callTokenGeneratorController'))

  app.use('/calls', router)
}
