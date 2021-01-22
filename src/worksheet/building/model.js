import _ from 'lodash'
import { BuildingByCadastre, CreateBuildingInput } from './types'
import { LegacyBuildingRepository } from '../../building/models'
import { LegacyWorksheetRepository } from '../models/worksheet-repository'

/**
 *
 * @param {BuildingByCadastre|BuildingByAddress|*} data
 * @return {Promise<*>}
 */

export async function createBuildingWithWorksheet (data = {}) {
  const input = CreateBuildingInput(data)
  const { created, building } = BuildingByCadastre.is(input)
    ? await createBuildingByCadastre(data)
    : await createBuildingByAddress(data)
  const worksheet = created
    ? await LegacyWorksheetRepository.createNewForBuilding(building)
    : await (new LegacyWorksheetRepository().findByBuilding(building.id))

  return { created, worksheet }
}

/**
 *
 * @param {BuildingByAddress} input
 * @return {Promise<*>}
 */
async function createBuildingByAddress (input) {
  const building = await LegacyBuildingRepository.findByAddress(_.get(input, 'address.fullAddress', ''))
  if (building) {
    return {
      created: false,
      building
    }
  } else {
    return {
      created: true,
      building: await LegacyBuildingRepository.createNewBuilding(input)
    }
  }
}

/**
 *
 * @param {BuildingByCadastre} input
 * @return {Promise<*>}
 */
export async function createBuildingByCadastre (input) {
  const building = await LegacyBuildingRepository.findByCadastreReference(input.cadastre)
  if (building) {
    return {
      created: false,
      building
    }
  } else {
    return {
      created: true,
      building: await LegacyBuildingRepository.createNewBuilding(input)
    }
  }
}
