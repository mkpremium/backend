import jwt from '../middleware/jwt'
import { userRoutes } from './routes'

export default (app, { usersRepository, addFavoriteBuildingService }) => {
  const secured = jwt()
  app.use('/', secured, userRoutes(usersRepository, addFavoriteBuildingService))
}
