import {BuildingByPlaceId, CreateBuildingInput} from './types';
import {BuildingRepository} from '../../building/models';
import {newHttpError} from '../../lib/http-error';
import {WorksheetRepository} from '../models/worksheet';

const errorsMessage = {
  errorBuildingByPlaceId: [400, 'Ya Existe un edificio con el mismo placeId']
};

/**
 *
 * @param {BuildingByCadastre|BuildingByPlaceId|*} data
 * @return {Promise<void>}
 */

export async function createBuildingWithWorksheet(data = {}) {
  const input = CreateBuildingInput(data);

  if (BuildingByPlaceId.is(input)) {
    return createBuildingByPlaceId(input);
  }

  return createBuildingByCadastre(input);
}

/**
 *
 * @param {BuildingByPlaceId} input
 * @return {Promise<void>}
 */
async function createBuildingByPlaceId(input) {
  const building = await BuildingRepository.findByPlaceId(input.placeId);
  if (building) {
    throw newHttpError(...errorsMessage.errorBuildingByPlaceId);
  }

  const newBuilding = await BuildingRepository.createNewBuilding(input);
  return WorksheetRepository.createNewForBuilding(newBuilding);
}

/**
 *
 * @param {BuildingByCadastre} input
 * @return {Promise<void>}
 */
async function createBuildingByCadastre(input) {

}
