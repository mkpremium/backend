/**
 * @property {BuildingsRepository} buildingsRepository
 */
export class SetBuildingExpensesService {
  constructor ({ buildingsRepository }) {
    this.buildingsRepository = buildingsRepository
  }

  async setTotalExpensesAmount (buildingId, totalAmount) {
    const building = await this.buildingsRepository.get(buildingId)
    const updatedBuilding = building.withTotalExpensesAmount(totalAmount)

    return this.buildingsRepository.save(updatedBuilding)
  }
}
