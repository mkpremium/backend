import t from 'tcomb';
import {newHttpError} from '../lib/http-error';
import _get from 'lodash/get';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../db/model';
import {CallStatus} from '../types/enums';
import {
  getCallId,
  getCallStatus
} from './helper';
import {OperatorStats} from '../stats/models';
import {OperatorActions} from '../stats/types';

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

  async findActiveCallByOperatorId(operatorId) {
    const qb = await this.getQueryBuilder()
      .where('userId = ?', operatorId)
      .where('status != ?', CallStatus.terminated)
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

    if (newEvent.status === CallStatus.confirmed && call.userId) {
      await OperatorStats.registerAction(call.userId, OperatorActions.CALL_ANSWERED);
    }

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

  async addNote(callId, note) {
    const newNote = t.AddCallNote({note});
    const call = await this.findByCallId(callId);

    const updatedNotes = t.update(call.notes, {$push: [newNote]});
    const updatedCall = t.update(call, {notes: {$merge: updatedNotes}});

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
