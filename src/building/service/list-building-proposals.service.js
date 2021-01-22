export class ListBuildingProposalsService {
  constructor (commercialsBuildingRepository) {
    this.commercialsBuildingRepository = commercialsBuildingRepository
  }

  forBuilding (buildingId) {
    return this.commercialsBuildingRepository.listProposalsForBuilding(buildingId)
  }
}
