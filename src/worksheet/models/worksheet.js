import t from 'tcomb';
import {CouchbaseModel} from '../../db/model';

export class Worksheet extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
  }
}

export class WorksheetRepository extends Worksheet {

}
