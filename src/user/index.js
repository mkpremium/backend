import jwt from '../middleware/jwt'
import { userRoutes } from './routes'
import { asClass } from 'awilix'
import { UserRepository } from './repository/user.repository'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'

export default (app, awilixContainer) => {
  const secured = jwt()
  awilixContainer.register({
    usersRepository: asClass(UserRepository).classic(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic()
  })

  app.use('/', secured, userRoutes(awilixContainer))
}
