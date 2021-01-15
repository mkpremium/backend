import routes from './routes'

import './types'
import jwt from '../middleware/jwt'
import { OwnerRepository } from './repository/owner.repository'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { asClass } from 'awilix'

export const setupOwnerDependencies = awilixContainer => {
  awilixContainer.register({
    ownersRepository: asClass(OwnerRepository).classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).classic()
  })
}

export const setupOwnersRoutes = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/owners', secured, routes(
    awilixContainer.resolve('setOwnerFeaturedContactService'),
    awilixContainer.resolve('ownersRepository')
  ))
}
