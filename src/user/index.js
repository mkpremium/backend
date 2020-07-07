import jwt from '../middleware/jwt'
import { userRoutes } from './routes'

export default (app, { usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService }) => {
  const secured = jwt()
  app.use('/', secured, userRoutes(usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService))
}
