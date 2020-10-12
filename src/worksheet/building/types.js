import * as t from 'tcomb'
import { BuildingCadastre } from '../../types/building'
import { Address } from '../../types/common'

const BuildingLocation = t.struct({
  lat: t.Number,
  lng: t.Number
}, 'BuildingLocation')

const BaseBuilding = t.struct({
  location: BuildingLocation,
  address: Address
})

export const BuildingByCadastre = BaseBuilding
  .extend({
    cadastre: t.maybe(BuildingCadastre)
  }, 'BuildingByCadastre')

export const BuildingByAddress = BaseBuilding.extend({}, 'BuildingByAddress')

export const CreateBuildingInput = t.union([BuildingCadastre, BuildingByAddress])
CreateBuildingInput.dispatch = function (input) {
  if (input.cadastre) {
    return BuildingByCadastre
  }

  return BuildingByAddress
}
