import { asClass, asFunction, AwilixContainer } from 'awilix'
import { createChangeContactStatusController } from './controller/change-contact-status.controller'
import { createSearchOwnersController } from './controller/search-owners.controller'
import { OwnerRepository } from './repository/owner.repository'
import { ChangeContactStatusService } from './service/change-contact-status.service'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { OwnerRepository as LegacyOwnerRepository } from './models'
import { createCallFinishedListener } from './event-listener/call-finished.listener'
import { markGoodContactOnCallScheduled } from './event-listener/mark-good-contact-on-call-scheduled'
import { getOwnerController } from './controller/get-owner.controller'
import { discardNonExistingContactListener } from './event-listener/discard-non-existing-contact.listener'

export const setupOwnerDependencies = (container: AwilixContainer) => {
  container.register({
    getOwnerController: asFunction(getOwnerController).singleton(),
    changeContactStatusController: asFunction(createChangeContactStatusController).singleton(),
    searchOwnerController: asFunction(createSearchOwnersController).classic().singleton(),

    callFinishedListener: asFunction(createCallFinishedListener).singleton(),
    markGoodContactOnCallScheduled: asFunction(markGoodContactOnCallScheduled).singleton(),
    discardNonExistingContactListener: asFunction(discardNonExistingContactListener).singleton(),

    changeContactStatusService: asClass(ChangeContactStatusService).singleton().classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).singleton().classic(),

    ownersRepository: asClass(OwnerRepository).singleton().classic(),
    legacyOwnersRepository: asClass(LegacyOwnerRepository).singleton()
  })
}
