import t from 'tcomb';
import {CouchbaseModel} from '../db/model';

export class Calls extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Calls;
  }
}
