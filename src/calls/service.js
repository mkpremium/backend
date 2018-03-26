import axios from 'axios';
import t from 'tcomb';
import {newHttpError} from '../lib/http-error';

import {Calls} from './models';
import {numintec} from '../../config';
import {encodePlusSign} from './helper';
import debug from 'debug';

const debugService = debug('app:calls:numintec');

const requester = axios.create({
  baseURL: numintec.apiUrl,
  params: {
    license: numintec.apiKey
  }
});

function getCallParams(from, to, serviceId) {
  const struct = t.CallService({
    from: from.agentNumber.split('-')[1],
    to: encodePlusSign(to.value),
    service_id: parseInt(serviceId),
    return_id: true
  });

  return `?from=${struct.from}&to=${struct.to}&options[service_id]=${struct.service_id}&options[return_id]=${true}&options[autoanswer]=1`;
}

async function call(from, phone) {
  const model = new Calls();
  try {
    let params = getCallParams(from, phone, from.serviceId);
    const url = `/Call/rest/call/${params}`;
    debugService('requester GET', url);
    const result = await requester.get(url);
    if (!result.data.status) throw newHttpError(400, result.data.description);
    const call = model.save({
      userId: from.id,
      from: from.agentNumber,
      to: phone.value,
      callId: result.data.id
    });
    return call;
  } catch (e) {
    if (e.response && e.response.status === 401) {
      throw newHttpError(500, 'Internal server error');
    }
    throw newHttpError(400, e);
  }
}

async function hangup(operatorId) {
  const model = new Calls();
  try {
    const activeCall = await model.findActiveCallByOperatorId(operatorId);
    const url = `/Call/rest/hangup/?options[call_id]=${activeCall.callId}`;
    debugService('requester GET', url);
    const result = await requester.get(url);
    if (!result.data.status) throw newHttpError(400, result.data.description);
    return result.data;
  } catch (e) {
    if (e.response && e.response.status === 401) {
      throw newHttpError(500, 'Internal server error');
    }
    throw newHttpError(400, e);
  }
}

export const requestCall = call;
export const requestHangup = hangup;
