import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'
import { BuildingNotesRepository } from './repository/building-notes.repository'
import { TNote } from '../notes/types'

export default (app, {
  listBuildingsService,
  listBuildingProposalsService,
  updateBuildingNegotiationStatusService,
  adminBuildingRepository,
  setBuildingSalePriceService,
  getDocumentsSignedURLService,
  eventBus,
  couchbaseAdapter
},
{
  ownerRepository, buildingRepository
}) => {
  const buildingNotesRepository = new BuildingNotesRepository(couchbaseAdapter)
  eventBus.on('worksheet.made_available', async ({ buildingId }) => {
    const note = TNote({
      note: 'Ficha devuelta al callcenter',
      createdBy: 'SYSTEM',
      context: { buildingId }
    })
    await buildingNotesRepository.save(note)
  })

  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes(
    listBuildingsService,
    listBuildingProposalsService,
    ownerRepository,
    updateBuildingNegotiationStatusService,
    buildingRepository,
    adminBuildingRepository,
    setBuildingSalePriceService,
    getDocumentsSignedURLService
  ))
}
