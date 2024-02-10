import { aliasTo, asClass, asFunction, AwilixContainer } from 'awilix'
import { SetBuildingSalePriceService } from './service/set-building-sale-price.service'
import { FeaturedOwnerService } from './service/featured-owner.service'
import { AddProposalService } from './service/add-proposal.service'
import { UpdateBuildingNegotiationStatusService } from './service/update-building-negotiation-status.service'
import { SetBuildingExpensesService } from './service/set-building-expenses.service'
import { ListBuildingsService } from './service/list-buildings.service'
import { ListBuildingProposalsService } from './service/list-building-proposals.service'
import { GetDocumentsSignedURLService } from './service/get-documents-signed-URL.service'
import aws from 'aws-sdk'
import { metadataS3Config } from '../../config'
import { AdminBuildingRepository } from './repository/admin-building.repository'
import { createListBuildingOwnersController } from './controller/list-building-owners.controller'
import { createSetFeaturedOwnerController } from './controller/set-featured-owner.controller'
import {
  createUpdateBuildingNegotiationStatusController
} from './controller/update-building-negotiation-status.controller'
import { addNegotiationProposalControllerFactory, updateNegotiationProposalControllerFactory } from './controllers'
import { createSetBuildingExpensesController } from './controller/set-building-expenses.controller'
import { createScheduledCallListener } from './event-listener/call-scheduled.listener'
import { createAddNoteToBuildingListener } from './event-listener/add-note-to-building.listener'
import {
  setFeaturedOwnerAndContactFromMeetingListener
} from './event-listener/set-featured-owner-and-contact-from-meeting.listener'
import { AddOfferRequestService } from './service/add-offer-request.service'
import { setFeaturedOwnerFromOfferRequestListenerFactory } from './event-listener/set-featured-owner-from-offer-request'
import { addOfferRequestControllerFactory } from './controller/add-offer-request.controller'
import { createAddProposalController } from './controller/add-proposal.controller'
import { AddProposalForBuildingService } from './service/add-proposal-for-building.service'
import { ProposalsSenderService } from './service/proposals-sender.service'
import { PdfProposalComposer } from './service/pdf-proposal-composer'
import { createListBuildingsController } from './controller/list-buildings.controller'
import { createProposalScheduledListener } from './event-listener/proposal-added.listener'
import { LeadRecorderService } from './service/lead-recorder.service'
import { createBuildingController } from './controller/create-building.controller'
import { PostgresBuildingsRepository } from './repository/postgres-buildings.repository'
import { UpdateProposalService } from './service/update-proposal.service'
import { PostgresProposalsRepository } from './repository/postgres-proposals.repository'
import { AddBuildingService } from './service/add-building.service'
import { importBuildingCommandHandler } from './service/import-building-command-handler'
import { PostgresBuildingNotesRepository } from './repository/postgres-building-notes.repository'
import { BuildingNotesImporterService } from './service/building-notes-importer'

export const setupBuildingDependencies = async (container: AwilixContainer) => {
  container.register({
    setBuildingSalePriceService: asClass(SetBuildingSalePriceService).classic().singleton(),
    featuredOwnerService: asClass(FeaturedOwnerService).singleton().classic(),
    addProposalService: asClass(AddProposalService).singleton().classic(),
    addProposalForBuildingService: asClass(AddProposalForBuildingService).singleton().classic(),
    updateProposalService: asClass(UpdateProposalService).singleton().classic(),
    updateBuildingNegotiationStatusService: asClass(UpdateBuildingNegotiationStatusService).singleton().classic(),
    setBuildingExpensesService: asClass(SetBuildingExpensesService).singleton(),
    listBuildingsService: asClass(ListBuildingsService).classic().singleton(),
    listBuildingProposalsService: asClass(ListBuildingProposalsService).singleton().classic(),
    getDocumentsSignedURLService: asClass(GetDocumentsSignedURLService).inject(() => ({
      s3Client: new aws.S3({
        signatureVersion: 'v4',
        region: metadataS3Config.region
      }),
      documentBucket: metadataS3Config.bucket
    })).singleton().classic(),
    pdfProposalComposer: asClass(PdfProposalComposer).classic().singleton(),
    proposalsSenderService: asClass(ProposalsSenderService).singleton().classic(),
    postgresBuildingsRepository: asClass(PostgresBuildingsRepository).singleton().classic(),
    buildingsRepository: aliasTo('postgresBuildingsRepository'),
    buildingsReadRepository: aliasTo('postgresBuildingsRepository'),

    leadRecorder: asClass(LeadRecorderService).singleton().classic(),
    buyOffersRepository: aliasTo('legacyBuildingsRepository'),

    adminBuildingRepository: asClass(AdminBuildingRepository).classic().singleton(),
    postgresBuildingNotesRepository: asClass(PostgresBuildingNotesRepository).classic().singleton(),
    buildingNotesRepository: aliasTo('postgresBuildingNotesRepository'),
    proposalsRepository: asClass(PostgresProposalsRepository).classic().singleton(),

    updateNegotiationProposalController: asFunction(updateNegotiationProposalControllerFactory).singleton(),
    createBuildingController: asFunction(createBuildingController).singleton(),
    listBuildingsController: asFunction(createListBuildingsController).singleton(),
    listBuildingOwnersController: asFunction(createListBuildingOwnersController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedOwnerController).singleton(),
    updateBuildingNegotiationStatusController: asFunction(createUpdateBuildingNegotiationStatusController).singleton(),
    addNegotiationProposalController: asFunction(addNegotiationProposalControllerFactory).singleton(),
    setBuildingExpensesController: asFunction(createSetBuildingExpensesController).singleton(),
    scheduledCallListener: asFunction(createScheduledCallListener).singleton(),
    addProposalController: asFunction(createAddProposalController).singleton(),
    proposalScheduledListener: asFunction(createProposalScheduledListener).singleton(),

    addNoteToBuilding: asFunction(createAddNoteToBuildingListener).singleton(),
    setFeaturedOwnerAndContactFromMeeting: asFunction(setFeaturedOwnerAndContactFromMeetingListener).singleton(),

    addOfferRequestService: asClass(AddOfferRequestService).classic().singleton(),
    setFeaturedOwnerFromOfferRequestListener: asFunction(setFeaturedOwnerFromOfferRequestListenerFactory).singleton(),
    addOfferRequestController: asFunction(addOfferRequestControllerFactory),
    addBuildingService: asClass(AddBuildingService).classic().singleton(),

    // Postgres migration
    importBuildingCommandHandler: asFunction(importBuildingCommandHandler),
    buildingNotesImporterService: asClass(BuildingNotesImporterService).classic().singleton()
  })
}
