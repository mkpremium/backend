import { asClass, asFunction, AwilixContainer } from 'awilix'
import { createChangeContactStatusController } from './controller/change-contact-status.controller'
import { searchOwnersControllerFactory } from './controller/search-owners.controller'
import { ChangeContactStatusService } from './service/change-contact-status.service'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { markGoodContactOnCallScheduled } from './event-listener/mark-good-contact-on-call-scheduled'
import { getOwnerController } from './controller/get-owner.controller'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'
import { createResetOwnerBadContactsHandler } from './command-handler/reset-owner-bad-contacts.handler'
import { PostgresOwnersRepository } from './repository/postgres-owners.repository'
import { addOwnerContactControllerFactory, updateOwnerControllerFactory } from './controllers'
import { addOwnerToBuildingControllerFactory } from '../building/controllers'
import { AddOwnerService } from './service/add-owner.service'
import { AddContactService } from './service/add-contact.service'
import { SearchOwnerOrBuildingService } from './service/search-owner-or-building.service'
import { importOwnerHandlerFactory } from './service/import-owner-command-handler'

export const setupOwnerDependencies = (container: AwilixContainer) => {
  container.register({
    getOwnerController: asFunction(getOwnerController).singleton(),
    updateOwnerController: asFunction(updateOwnerControllerFactory).singleton(),
    addOwnerContactController: asFunction(addOwnerContactControllerFactory).singleton(),
    addOwnerToBuildingController: asFunction(addOwnerToBuildingControllerFactory).singleton(),
    changeContactStatusController: asFunction(createChangeContactStatusController).singleton(),
    searchOwnerController: asFunction(searchOwnersControllerFactory).classic().singleton(),
    setFeaturedContactController: asFunction(createSetFeaturedContactController).classic().singleton(),

    markGoodContactOnCallScheduled: asFunction(markGoodContactOnCallScheduled).singleton(),

    changeContactStatusService: asClass(ChangeContactStatusService).singleton().classic(),
    searchOwnerOrBuildingService: asClass(SearchOwnerOrBuildingService).singleton().classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).singleton().classic(),
    addContactService: asClass(AddContactService).singleton().classic(),
    addOwnerService: asClass(AddOwnerService).singleton().classic(),

    ownersRepository: asClass(PostgresOwnersRepository).singleton().classic(),

    resetOwnerBadContactsHandler: asFunction(createResetOwnerBadContactsHandler).singleton(),
    importOwnerCommandHandler: asFunction(importOwnerHandlerFactory).singleton()
  })
}
