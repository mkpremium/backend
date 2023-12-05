import jwt from '../middleware/jwt'
import { worksheetRoutes } from './routes'
import { AwilixContainer } from 'awilix'
import { Express } from 'express'

export const worksheetsRoutes = (app: Express, container: AwilixContainer) => {
  const secured = jwt()

  app.use('/worksheets', secured, worksheetRoutes(container))
}
