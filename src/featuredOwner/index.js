import jwt from '../middleware/jwt'
import { featuredOwnerRoutes } from './routes'

export default (app, { couchbaseBucket }) => {
  const secured = jwt()
  app.use('/', secured, featuredOwnerRoutes(couchbaseBucket))
}
