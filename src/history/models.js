import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {getHistoryStruct} from './helper';

import './types';

export class History extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.History;
  }

  async register(eventData, sendEvent = true) {
    const data = await getHistoryStruct(eventData);
    const savedRecord = await this.save(data, sendEvent);

    if (!savedRecord) {
      console.error(`Error on saving record for ${eventData.contextModel}`);
      return false;
    }

    return savedRecord;
  }

  static async registerCreate(eventData, sendEvent = true) {
    const history = new History();
    eventData.type = 'CREATE';
    const record = await history.register(eventData, sendEvent);
    return record;
  }

  static async registerGet(eventData, sendEvent = true) {
    const history = new History();
    eventData.type = 'GET';
    const record = await history.register(eventData, sendEvent);
    return record;
  }

  static async registerUpdate(eventData, sendEvent = true) {
    const history = new History();
    eventData.type = 'UPDATE';
    const record = await history.register(eventData, sendEvent);
    return record;
  }

  static async registerOpen(eventData, sendEvent = true) {
    const history = new History();
    eventData.type = 'OPEN';
    const record = await history.register(eventData, sendEvent);
    return record;
  }

  static async registerList(eventData, sendEvent = true) {
    const history = new History();
    eventData.type = 'LIST';
    const record = await history.register(eventData, sendEvent);
    return record;
  }
}
