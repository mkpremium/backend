import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {getHistoryStruct} from './helper';
import {emitHistoryEvents} from '../../config';

import './types';

export class History extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.History;
  }

  async register(eventData, sendEvent) {
    const emitEvent = sendEvent || JSON.parse(emitHistoryEvents);
    return this.save(getHistoryStruct(eventData), emitEvent);
  }

  static async registerCreate(eventData, sendEvent = false) {
    const history = new History();
    eventData.type = 'CREATE';
    return history.register(eventData, sendEvent);
  }

  static async registerGet(eventData, sendEvent = false) {
    const history = new History();
    eventData.type = 'GET';
    return history.register(eventData, sendEvent);
  }

  static async registerUpdate(eventData, sendEvent = false) {
    const history = new History();
    eventData.type = 'UPDATE';
    return history.register(eventData, sendEvent);
  }

  static async registerOpen(eventData, sendEvent = false) {
    const history = new History();
    eventData.type = 'OPEN';
    return history.register(eventData, sendEvent);
  }

  static async registerList(eventData, sendEvent = false) {
    const history = new History();
    eventData.type = 'LIST';
    return history.register(eventData, sendEvent);
  }
}
