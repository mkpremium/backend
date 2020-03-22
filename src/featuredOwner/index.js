import jwt from '../middleware/jwt'
import { featuredOwnerRoutes } from './routes'

export default (app, { featuredOwnerService }) => {
  const secured = jwt()
  app.use('/', secured, featuredOwnerRoutes(featuredOwnerService))
}
