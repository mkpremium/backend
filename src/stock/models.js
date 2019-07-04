
import {CouchbaseModel} from '../db/model';
import { Stock } from './types';

export class StockRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = Stock;
  }
}
