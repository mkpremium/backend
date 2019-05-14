import _ from 'lodash';
import {BuildingByCadastre, CreateBuildingInput} from './types';
import {BuildingRepository} from '../../building/models';
import {WorksheetRepository} from '../models/worksheet';

/**
 *
 * @param {BuildingByCadastre|BuildingByAddress|*} data
 * @return {Promise<*>}
 */

export async function createBuildingWithWorksheet(data = {}) {
  const input = CreateBuildingInput(data);
  const {created, building} = BuildingByCadastre.is(input)
    ? await createBuildingByCadastre(data)
    : await createBuildingByAddress(data);
  const worksheet = created
    ? await WorksheetRepository.createNewForBuilding(building)
    : await WorksheetRepository.findByBuilding(building.id);

  return {created, worksheet};
}

/**
 *
 * @param {BuildingByAddress} input
 * @return {Promise<*>}
 */
async function createBuildingByAddress(input) {
  const building = await BuildingRepository.findByAddress(_.get(input, 'address.fullAddress', ''));
  if (building) {
    return {
      created: false,
      building
    };
  } else {
    return {
      created: true,
      building: await BuildingRepository.createNewBuilding(input)
    };
  }
}

/**
 *
 * @param {BuildingByCadastre} input
 * @return {Promise<*>}
 */
async function createBuildingByCadastre(input) {
  const building = await BuildingRepository.findByCadastre(input.cadastre);
  if (building) {
    return {
      created: false,
      building
    };
  } else {
    return {
      created: true,
      building: await BuildingRepository.createNewBuilding(input)
    };
  }
}
