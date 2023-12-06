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
import { LegacyBuildingRepository } from './models'
import { MetadataRepository } from './repository/metadata.repository'
import { AdminBuildingRepository } from './repository/admin-building.repository'
import { BuildingDocumentsRepository } from './repository/building-documents.repository'
import { BuildingNotesRepository } from './repository/building-notes.repository'
import { createListBuildingOwnersController } from './controller/list-building-owners.controller'
import { createSetFeaturedOwnerController } from './controller/set-featured-owner.controller'
import {
  createUpdateBuildingNegotiationStatusController
} from './controller/update-building-negotiation-status.controller'
import { createAddNegotiationProposalController, createUpdateNegotiationProposalController } from './controllers'
import { createSetBuildingExpensesController } from './controller/set-building-expenses.controller'
import { createScheduledCallListener } from './event-listener/call-scheduled.listener'
import { createAddNoteToBuildingListener } from './event-listener/add-note-to-building.listener'
import {
  setFeaturedOwnerAndContactFromMeetingListener
} from './event-listener/set-featured-owner-and-contact-from-meeting.listener'
import { AddOfferRequestService } from './service/add-offer-request.service'
import { createSetFeaturedOwnerFromOfferRequestListener } from './event-listener/set-featured-owner-from-offer-request'
import { createAddOfferRequestController } from './controller/add-offer-request.controller'
import { createAddProposalController } from './controller/add-proposal.controller'
import { AddProposalForBuildingService } from './service/add-proposal-for-building.service'
import { ProposalsSenderService } from './service/proposals-sender.service'
import { PdfProposalComposer } from './service/pdf-proposal-composer'
import { createListBuildingsController } from './controller/list-buildings.controller'
import { createProposalScheduledListener } from './event-listener/proposal-added.listener'
import { addSmsNoteListener } from './event-listener/add-sms-note.listener'
import { LeadRecorderService } from './service/lead-recorder.service'
import { BuildingSearcherService } from './service/building-searcher.service'
import { Portugal2021BuildingsRepository } from './repository/portugal2021-buildings.repository'
import { Portugal2021BuildingsImporterService } from './service/portugal2021-buildings-importer.service'
import { Portugal2021OwnersImporterService } from './service/portugal2021-owners-importer.service'
import { Portugal2021WorksheetInitializerService } from './service/portugal2021-worksheet-initializer.service'
import { createBuildingController } from './controller/create-building.controller'
import { CouchbaseBuildingsRepository } from './repository/couchbase-building.repository'
import { CouchbaseBuildingsReadRepository } from './repository/couchbase-buildings-read.repository'
import { PostgresBuildingsRepository } from './repository/postgres-buildings.repository'
import { CouchbaseOfferRequestsRepository } from './repository/couchbase-offer-requests.repository'
import { PostgresOfferRequestsRepository } from './repository/postgres-offer-requests.repository'
import { UpdateProposalService } from './service/update-proposal.service'
import { CouchbaseProposalsRepository } from './repository/couchbase-proposals.repository'
import { PostgresProposalsRepository } from './repository/postgres-proposals.repository'

export const setupBuildingDependencies = (container: AwilixContainer, usePostgres: boolean) => {
  container.register({
    setBuildingSalePriceService: asClass(SetBuildingSalePriceService).singleton(),
    featuredOwnerService: asClass(FeaturedOwnerService).singleton().classic(),
    addProposalService: asClass(AddProposalService).singleton().classic(),
    updateProposalService: asClass(UpdateProposalService).singleton().classic(),
    updateBuildingNegotiationStatusService: asClass(UpdateBuildingNegotiationStatusService).singleton().classic(),
    setBuildingExpensesService: asClass(SetBuildingExpensesService).singleton(),
    listBuildingsService: asClass(ListBuildingsService).classic().singleton(),
    listBuildingProposalsService: asClass(ListBuildingProposalsService).singleton().classic(),
    addProposalForBuildingService: asClass(AddProposalForBuildingService).singleton().classic(),
    getDocumentsSignedURLService: asClass(GetDocumentsSignedURLService).inject(() => ({
      s3Client: new aws.S3({
        signatureVersion: 'v4',
        region: metadataS3Config.region
      }),
      documentBucket: metadataS3Config.bucket
    })).singleton().classic(),
    pdfProposalComposer: asClass(PdfProposalComposer).classic().singleton(),
    proposalsSenderService: asClass(ProposalsSenderService).singleton().classic(),
    couchbaseBuildingsRepository: asClass(CouchbaseBuildingsRepository).singleton().classic(),
    postgresBuildingsRepository: asClass(PostgresBuildingsRepository).singleton().classic(),
    buildingsRepository: aliasTo(usePostgres ? 'postgresBuildingsRepository' : 'couchbaseBuildingsRepository'),
    couchbaseBuildingsReadRepository: asClass(CouchbaseBuildingsReadRepository).classic().singleton(),
    buildingsReadRepository: aliasTo(usePostgres ? 'postgresBuildingsRepository' : 'couchbaseBuildingsReadRepository'),

    leadRecorder: asClass(LeadRecorderService).singleton().classic(),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository).singleton(),
    buyOffersRepository: aliasTo('legacyBuildingsRepository'),

    legacyMetadataRepository: asClass(MetadataRepository).singleton(),
    adminBuildingRepository: asClass(AdminBuildingRepository).classic().singleton(),
    buildingDocumentsRepository: asClass(BuildingDocumentsRepository).classic().singleton(),
    buildingNotesRepository: asClass(BuildingNotesRepository).classic().singleton(),
    couchbaseProposalsRepository: asClass(CouchbaseProposalsRepository).classic().singleton(),
    postgresProposalsRepository: asClass(PostgresProposalsRepository).classic().singleton(),
    proposalsRepository: aliasTo(usePostgres ? 'postgresProposalsRepository' : 'couchbaseProposalsRepository'),

    updateNegotiationProposalController: asFunction(createUpdateNegotiationProposalController).singleton(),
    createBuildingController: asFunction(createBuildingController).singleton(),
    listBuildingsController: asFunction(createListBuildingsController).singleton(),
    listBuildingOwnersController: asFunction(createListBuildingOwnersController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedOwnerController).singleton(),
    updateBuildingNegotiationStatusController: asFunction(createUpdateBuildingNegotiationStatusController).singleton(),
    addNegotiationProposalController: asFunction(createAddNegotiationProposalController).singleton(),
    setBuildingExpensesController: asFunction(createSetBuildingExpensesController).singleton(),
    scheduledCallListener: asFunction(createScheduledCallListener).singleton(),
    addProposalController: asFunction(createAddProposalController).singleton(),
    proposalScheduledListener: asFunction(createProposalScheduledListener).singleton(),
    addSmsNoteListener: asFunction(addSmsNoteListener).singleton(),

    addNoteToBuilding: asFunction(createAddNoteToBuildingListener).singleton(),
    setFeaturedOwnerAndContactFromMeeting: asFunction(setFeaturedOwnerAndContactFromMeetingListener).singleton(),

    couchbaseOfferRequestsRepository: asClass(CouchbaseOfferRequestsRepository).classic().singleton(),
    postgresOfferRequestsRepository: asClass(PostgresOfferRequestsRepository).classic().singleton(),
    offerRequestsRepository: aliasTo(usePostgres ? 'postgresOfferRequestsRepository' : 'couchbaseOfferRequestsRepository'),
    addOfferRequestService: asClass(AddOfferRequestService).classic().singleton(),
    setFeaturedOwnerFromOfferRequestListener: asFunction(createSetFeaturedOwnerFromOfferRequestListener).singleton(),
    addOfferRequestController: asFunction(createAddOfferRequestController),

    buildingSearcherService: asClass(BuildingSearcherService).classic().singleton(),

    // Portugal 2021 import
    portugal2021BuildingsRepository: asClass(Portugal2021BuildingsRepository).classic().singleton(),
    portugal2021BuildingsImporterService: asClass(Portugal2021BuildingsImporterService).classic().singleton(),
    portugal2021OwnersImporterService: asClass(Portugal2021OwnersImporterService).classic().singleton(),
    portugal2021WorksheetInitializerService: asClass(Portugal2021WorksheetInitializerService).classic().singleton(),
  })
}
