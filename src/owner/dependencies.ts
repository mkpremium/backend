import { aliasTo, asClass, asFunction, AwilixContainer } from 'awilix'
import { createChangeContactStatusController } from './controller/change-contact-status.controller'
import { createSearchOwnersController } from './controller/search-owners.controller'
import { ChangeContactStatusService } from './service/change-contact-status.service'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { markGoodContactOnCallScheduled } from './event-listener/mark-good-contact-on-call-scheduled'
import { getOwnerController } from './controller/get-owner.controller'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'
import { createResetOwnerBadContactsHandler } from './command-handler/reset-owner-bad-contacts.handler'
import { CouchbaseOwnersRepository } from './repository/couchbase-owners.repository'
import { PostgresOwnersRepository } from './repository/postgres-owners.repository'
import { addOwnerContactControllerFactory, updateOwnerControllerFactory } from './controllers'
import { createAddOwnerToBuildingController } from '../building/controllers'
import { AddOwnerService } from './service/add-owner.service'
import { AddContactService } from './service/add-contact.service'
import { SearchOwnerOrBuildingService } from './service/search-owner-or-building.service'
import { importOwnerCommandHandler } from './service/import-owner-command-handler'

export const setupOwnerDependencies = (container: AwilixContainer, usePostgres: boolean) => {
  container.register({
    getOwnerController: asFunction(getOwnerController).singleton(),
    updateOwnerController: asFunction(updateOwnerControllerFactory).singleton(),
    addOwnerContactController: asFunction(addOwnerContactControllerFactory).singleton(),
    addOwnerToBuildingController: asFunction(createAddOwnerToBuildingController).singleton(),
    changeContactStatusController: asFunction(createChangeContactStatusController).singleton(),
    searchOwnerController: asFunction(createSearchOwnersController).classic().singleton(),
    setFeaturedContactController: asFunction(createSetFeaturedContactController).classic().singleton(),

    markGoodContactOnCallScheduled: asFunction(markGoodContactOnCallScheduled).singleton(),

    changeContactStatusService: asClass(ChangeContactStatusService).singleton().classic(),
    searchOwnerOrBuildingService: asClass(SearchOwnerOrBuildingService).singleton().classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).singleton().classic(),
    addContactService: asClass(AddContactService).singleton().classic(),
    addOwnerService: asClass(AddOwnerService).singleton().classic(),

    postgresOwnersRepository: asClass(PostgresOwnersRepository).singleton().classic(),
    couchbaseOwnersRepository: asClass(CouchbaseOwnersRepository).singleton().classic(),
    ownersRepository: aliasTo(usePostgres ? 'postgresOwnersRepository' : 'couchbaseOwnersRepository'),

    resetOwnerBadContactsHandler: asFunction(createResetOwnerBadContactsHandler).singleton(),
    importOwnerCommandHandler: asFunction(importOwnerCommandHandler).singleton(),
  })
}
