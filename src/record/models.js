import t from 'tcomb';
import {newHttpError} from '../lib/http-error';
import {CouchbaseModel} from '../db/model';
import socket from '../socket/client';
import {getRecordStruct} from './helper';

import './types';

export class Record extends CouchbaseModel {
  constructor(emitEvent) {
    super();
    this.Struct = t.Record;
    this.emitEvent = emitEvent;
  }

  async register(type, contextModel, user) {
    if (!contextModel) throw newHttpError(400, `Undefined context model`);
    const data = getRecordStruct(type, contextModel, user);
    const structData = this.Struct(data);
    const savedRecord = await this.save(structData);
    
    if (!savedRecord) {
      throw newHttpError(400, `Error on saving record for ${structData.model}`);
    }
    
    if (savedRecord && this.emitEvent) {
      this.socketClient = await socket.connectServer();
      await this.socketClient.sendEvent('add', savedRecord);
    }

    return savedRecord;
  }
};
