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
import { BuildingsRepository } from './repository/buildings.repository'
import { LegacyBuildingRepository } from './models'
import { MetadataRepository } from './repository/metadata.repository'
import { BuildingsReadRepository } from './repository/buildings-read.repository'
import { AdminBuildingRepository } from './repository/admin-building.repository'
import { BuildingDocumentsRepository } from './repository/building-documents.repository'
import { BuildingNotesRepository } from './repository/building-notes.repository'
import { createListBuildingOwnersController } from './controller/list-building-owners.controller'
import { createSetFeaturedOwnerController } from './controller/set-featured-owner.controller'
import { createUpdateBuildingNegotiationStatusController } from './controller/update-building-negotiation-status.controller'
import { createAddNegotiationProposalController } from './controllers'
import { createSetBuildingExpensesController } from './controller/set-building-expenses.controller'
import { createScheduledCallListener } from './event-listener/call-scheduled.listener'
import { createAddNoteToBuildingListener } from './event-listener/add-note-to-building.listener'
import { setFeaturedOwnerAndContactFromMeetingListener } from './event-listener/set-featured-owner-and-contact-from-meeting.listener'
import { createWorksheetMadeAvailableListener } from './event-listener/worksheet-made-available.listener'
import { OfferRequestsRepository } from './repository/offer-requests.repository'
import { AddOfferRequestService } from './service/add-offer-request.service'
import { createSetFeaturedOwnerFromOfferRequestListener } from './event-listener/set-featured-owner-from-offer-request'
import { createAddOfferRequestController } from './controller/add-offer-request.controller'
import { createAddProposalController } from './controller/add-proposal.controller'
import { AddProposalForBuildingService } from './service/add-proposal-for-building.service'
import { ProposalsSenderService } from './service/proposals-sender.service'
import { ProposalsRepository } from './repository/proposals.repository'
import { PdfProposalComposer } from './service/pdf-proposal-composer'
import { createListBuildingsController } from './controller/list-buildings.controller'
import { createProposalScheduledListener } from './event-listener/proposal-added.listener'
import { addSmsNoteListener } from './event-listener/add-sms-note.listener'
import { LeadRecorderService } from './service/lead-recorder.service'
import { BuildingSearcherService } from './service/building-searcher.service'

export const setupBuildingDependencies = (container: AwilixContainer) => {
  container.register({
    setBuildingSalePriceService: asClass(SetBuildingSalePriceService).singleton(),
    featuredOwnerService: asClass(FeaturedOwnerService).singleton().classic(),
    addProposalService: asClass(AddProposalService).singleton(),
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
    buildingsRepository: asClass(BuildingsRepository).singleton().classic(),
    leadRecorder: asClass(LeadRecorderService).singleton().classic(),

    buildingRepository: aliasTo('buildingsRepository'),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository).singleton(),
    legacyMetadataRepository: asClass(MetadataRepository).singleton(),
    buildingsReadRepository: asClass(BuildingsReadRepository).classic().singleton(),
    adminBuildingRepository: asClass(AdminBuildingRepository).classic().singleton(),
    buildingDocumentsRepository: asClass(BuildingDocumentsRepository).classic().singleton(),
    buildingNotesRepository: asClass(BuildingNotesRepository).classic().singleton(),
    proposalsRepository: asClass(ProposalsRepository).classic().singleton(),

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
    worksheetMadeAvailableListener: asFunction(createWorksheetMadeAvailableListener).singleton(),

    offerRequestsRepository: asClass(OfferRequestsRepository).classic().singleton(),
    addOfferRequestService: asClass(AddOfferRequestService).classic().singleton(),
    setFeaturedOwnerFromOfferRequestListener: asFunction(createSetFeaturedOwnerFromOfferRequestListener).singleton(),
    addOfferRequestController: asFunction(createAddOfferRequestController),

    buildingSearcherService: asClass(BuildingSearcherService).classic().singleton(),
  })
}
