import { aliasTo, asClass, asFunction, AwilixContainer } from 'awilix'
import { createChangeContactStatusController } from './controller/change-contact-status.controller'
import { createSearchOwnersController } from './controller/search-owners.controller'
import { ChangeContactStatusService } from './service/change-contact-status.service'
import { SetOwnerFeaturedContactService } from './service/set-featured-contact.service'
import { createCallFinishedListener } from './event-listener/call-finished.listener'
import { markGoodContactOnCallScheduled } from './event-listener/mark-good-contact-on-call-scheduled'
import { getOwnerController } from './controller/get-owner.controller'
import { discardNonExistingContactListener } from './event-listener/discard-non-existing-contact.listener'
import { createSetFeaturedContactController } from './controller/set-featured-contact.controller'
import { createResetOwnerBadContactsHandler } from './command-handler/reset-owner-bad-contacts.handler'
import { CouchbaseOwnersRepository } from './repository/couchbase-owners.repository'
import { PostgresOwnersRepository } from './repository/postgres-owners.repository'
import { createAddOwnerContactController, createUpdateOwnerController } from './controllers'
import { createAddOwnerToBuildingController } from '../building/controllers'
import { AddOwnerService } from './service/add-owner.service'

export const setupOwnerDependencies = (container: AwilixContainer, usePostgres: boolean) => {
  container.register({
    getOwnerController: asFunction(getOwnerController).singleton(),
    updateOwnerController: asFunction(createUpdateOwnerController).singleton(),
    addOwnerContactController: asFunction(createAddOwnerContactController).singleton(),
    addOwnerToBuildingController: asFunction(createAddOwnerToBuildingController).singleton(),
    changeContactStatusController: asFunction(createChangeContactStatusController).singleton(),
    searchOwnerController: asFunction(createSearchOwnersController).classic().singleton(),
    setFeaturedContactController: asFunction(createSetFeaturedContactController).classic().singleton(),

    callFinishedListener: asFunction(createCallFinishedListener).singleton(),
    markGoodContactOnCallScheduled: asFunction(markGoodContactOnCallScheduled).singleton(),
    discardNonExistingContactListener: asFunction(discardNonExistingContactListener).singleton(),

    changeContactStatusService: asClass(ChangeContactStatusService).singleton().classic(),
    setOwnerFeaturedContactService: asClass(SetOwnerFeaturedContactService).singleton().classic(),
    addOwnerService: asClass(AddOwnerService).singleton().classic(),

    postgresOwnersRepository: asClass(PostgresOwnersRepository).singleton().classic(),
    couchbaseOwnersRepository: asClass(CouchbaseOwnersRepository).singleton().classic(),
    ownersRepository: aliasTo(usePostgres ? 'postgresOwnersRepository' : 'couchbaseOwnersRepository'),

    resetOwnerBadContactsHandler: asFunction(createResetOwnerBadContactsHandler).singleton(),
  })
}
