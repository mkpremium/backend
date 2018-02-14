import t from 'tcomb';
import {CouchbaseModel} from '../db/model';

export class Building extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Building;
  }
}

export class BuildingRepository extends Building {

}
