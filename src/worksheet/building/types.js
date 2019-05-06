import * as t from 'tcomb';
import {BuildingCadastre} from '../../types/building';
import {Address} from '../../types/common';

/**
 * @swagger
 * definitions:
 *   BuildingLocation:
 *     properties:
 *       lat:
 *         type: number
 *       lng:
 *         type: number
 */
const BuildingLocation = t.struct({
  lat: t.Number,
  lng: t.Number
}, 'BuildingLocation');

const BaseBuilding = t.struct({
  location: BuildingLocation,
  address: Address
});

export const BuildingByCadastre = BaseBuilding
  .extend({cadastre: BuildingCadastre}, 'BuildingByCadastre');

export const BuildingByPlaceId = BaseBuilding
  .extend({placeId: t.String}, 'BuildingByPlaceId');

/**
 * @swagger
 * definitions:
 *   CreateBuildingInput:
 *     properties:
 *       location:
 *         $ref: "#/definitions/BuildingLocation"
 *       address:
 *         $ref: "#/definitions/Address"
 *       placeId:
 *         type: string
 *         description: Google Place ID obligatorio si cadastre no esta presente
 *       cadastre:
 *         $ref: "#/definitions/Cadastre"
 *         description: Obligatorio si placeId no esta presente
 */
export const CreateBuildingInput = t.union([BuildingCadastre, BuildingByPlaceId]);
CreateBuildingInput.dispatch = function(input) {
  if (input.placeId) {
    return BuildingByPlaceId;
  }

  return BuildingByCadastre;
};
