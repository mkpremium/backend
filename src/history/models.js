import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {getHistoryStruct} from './helper';
import fromJSON from 'tcomb/lib/fromJSON';
import {emitHistoryEvents} from '../../config';
import {addDateQueryToBuilder, addBetweenQueryToBuilder} from '../lib/query/helpers';

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

export class HistoryRepository extends History {
  async list(query = {}) {
    const params = t.HistoryListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.operatorId) {
      qb.where('operatorId = ?', params.userId);
      qbCount.where('operatorId = ?', params.userId);
    }

    if (params.actionType) {
      qb.where('type = ?', params.actionType);
      qbCount.where('type = ?', params.actionType);
    }

    if (params.modelName) {
      qb.where('modelName = ?', params.modelName);
      qbCount.where('modelName = ?', params.modelName);
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'timestamp', params.createdAt);
      addDateQueryToBuilder(qbCount, 'timestamp', params.createdAt);
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'timestamp', params.createdBetween);
      addBetweenQueryToBuilder(qbCount, 'timestamp', params.createdBetween);
    }
    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.HistoryListResponse);
  }
}
