import t from 'tcomb';
import {newHttpError} from '../lib/http-error';
import _get from 'lodash/get';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../db/model';
import {
  getCallId,
  getCallStatus
} from './helper';

export class Calls extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Calls;
  }

  async findByCallId(callId) {
    const qb = await this.getQueryBuilder()
      .where('callId = ?', callId)
      .limit(1);

    const [call] = await this.query(qb);
    if (call) {
      return fromJSON(call, this.Struct);
    } else {
      return null;
    }
  }

  async addEvent(callId, newEvent, sendEvent = false) {
    const call = await this.findByCallId(callId);

    if (!call) {
      throw newHttpError(400, `Registro de llamada inválido`);
    }

    const updatedEvents = t.update(call.events, {$push: [newEvent]});
    const updatedCall = t.update(call, {events: {$merge: updatedEvents}});

    return this.save(updatedCall, sendEvent);
  }

  async updateStatus(callId, status) {
    const call = await this.findByCallId(callId);

    if (!call) {
      throw newHttpError(400, `Registro de llamada inválido`);
    }

    const updatedCall = t.update(call, {status: {$set: status}});
    
    return this.save(updatedCall);
  }

  async findOrCreate(body) {
    const callId = getCallId(body);
    let call = await this.findByCallId(callId);

    if (!call) {
      const from = _get(body, 'data.called', null);
      const to = _get(body, 'data.fromuser', null);

      call = await this.save({
        from: from.split('-')[1],
        to,
        callId,
        origin: 'WEBHOOK',
        events: [],
        status: getCallStatus(body)
      });
      call = fromJSON(call, this.Struct);
    }

    return call;
  }
}

export class CallsRawEvents extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.CallsRawEvents;
  }
}
