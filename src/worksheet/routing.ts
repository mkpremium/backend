import { worksheetRoutes } from './routes'
import { AwilixContainer } from 'awilix'
import { Express } from 'express'

export const worksheetsRoutes = (app: Express, container: AwilixContainer, secured) => {
  app.use('/worksheets', secured, worksheetRoutes(container))
}
