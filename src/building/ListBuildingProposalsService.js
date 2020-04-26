export class ListBuildingProposalsService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  forBuilding (buildingId) {
    return this.buildingRepository.listProposalsForBuilding(buildingId)
  }
}
