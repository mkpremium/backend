import * as t from 'tcomb';
import {BuildingCadastre} from '../../types/building';
import {Address} from '../../types/common';

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

export const CreateBuildingInput = t.union([BuildingCadastre, BuildingByPlaceId]);
CreateBuildingInput.dispatch = function(input) {
  if (input.placeId) {
    return BuildingByPlaceId;
  }

  return BuildingByCadastre;
};
