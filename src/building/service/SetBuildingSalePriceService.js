import t from 'tcomb'

const setBuildingSalePriceCommand = t.struct({
  buildingId: t.String,
  salePrice: t.Number
})

export class SetBuildingSalePriceService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  async setBuildingSalePrice (cmd) {
    const { buildingId, salePrice } = setBuildingSalePriceCommand(cmd)

    const building = await this.buildingRepository.get(buildingId)
    const updatedBuilding = t.update(building, {
      salePrice: {
        $set: salePrice
      }
    })

    return this.buildingRepository.save(updatedBuilding)
  }
}
