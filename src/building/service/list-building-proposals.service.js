export class ListBuildingProposalsService {
  constructor (buildingsReadRepository) {
    this.buildingsReadRepository = buildingsReadRepository
  }

  forBuilding (buildingId) {
    return this.buildingsReadRepository.listProposalsForBuilding(buildingId)
  }
}
