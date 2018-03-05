import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';

export class Building extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Building;
  }
}

export class BuildingRepository extends Building {
  async findByIdOrThrow(buildingId) {
    const building = await this.findById(buildingId);
    if (!building) {
      throw newHttpError(404, `El edificio ${buildingId} no existe`);
    }

    return building;
  }
}
