import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import socket from '../socket/client';
import {getRecordStruct} from './helper';

import './types';

export class Record extends CouchbaseModel {
  constructor(emitEvent = null) {
    super();
    this.Struct = t.Record;
    this.emitEvent = emitEvent;
  }

  async register(type, contextModel, user) {
    const data = await getRecordStruct(type, contextModel, user);
    const structData = this.Struct(data);
    const savedRecord = await this.save(structData);
    
    if (!savedRecord) {
      console.error(`Error on saving record for ${structData.model}`);
      return false;
    }
    
    if (savedRecord && this.emitEvent && structData.type !== 'ERROR') {
      this.socketClient = await socket.connectServer();
      await this.socketClient.sendEvent('add', savedRecord);
    }

    return savedRecord;
  }
}
