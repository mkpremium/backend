import t from 'tcomb'

const setBuildingSalePriceCommand = t.struct({
  buildingId: t.String,
  salePrice: t.Number
})

export class SetBuildingSalePriceService {
  constructor ({ legacyBuildingsRepository }) {
    this.legacyBuildingsRepository = legacyBuildingsRepository
  }

  async setBuildingSalePrice (cmd) {
    const { buildingId, salePrice } = setBuildingSalePriceCommand(cmd)

    const building = await this.legacyBuildingsRepository.findById(buildingId)
    const updatedBuilding = t.update(building, {
      salePrice: {
        $set: salePrice
      }
    })

    return this.legacyBuildingsRepository.save(updatedBuilding)
  }
}
