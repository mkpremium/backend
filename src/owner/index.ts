import { createChangeContactStatusController } from './controller/change-contact-status.controller'
import { createSearchOwnersController } from './controller/search-owners.controller'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'
import { ownersRouting } from './routes'

import './types'
import jwt from '../middleware/jwt'
import { OwnerRepository } from './repository/owner.repository'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { asClass, asFunction, AwilixContainer } from 'awilix'
import { OwnerRepository as LegacyOwnerRepository } from './models'
import { Express } from 'express'
import { ChangeContactStatusService } from './service/change-contact-status.service'

export const setupOwnerDependencies = (container: AwilixContainer) => {
  container.register({
    changeContactStatusController: asFunction(createChangeContactStatusController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedContactController).classic().singleton(),
    searchOwnerController: asFunction(createSearchOwnersController).classic().singleton(),
    ownersRepository: asClass(OwnerRepository).singleton().classic(),

    changeContactStatusService: asClass(ChangeContactStatusService).singleton().classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).singleton().classic(),

    legacyOwnersRepository: asClass(LegacyOwnerRepository).singleton()
  })
}

export const setupOwnersRoutes = (app: Express, container: AwilixContainer) => {
  const secured = jwt()

  app.use('/owners', secured, ownersRouting(container))
}
