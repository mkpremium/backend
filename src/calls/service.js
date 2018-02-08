import axios from 'axios';
import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {newHttpError} from '../lib/http-error';

import {Calls} from './models';
import {numintec} from '../../config';

const requester = axios.create({
  baseURL: numintec.apiUrl,
  params: {
    license: numintec.apiKey
  }
});

// TODO: get 'from' from context
function getFromNumber() {
  return '905';
}

function getCallParams(to) {
  return t.CallService({
    from: getFromNumber(),
    to: to,
    options: {
      service_id: numintec.serviceId,
      return_id: true
    }
  });
}

function getHangupParams(callId) {
  return t.HangupService({
    options: {
      call_id: callId
    }
  });
}

async function call(phone) {
  const model = new Calls();
  try {
    const params = getCallParams(phone);
    const result = await requester.get('/Call/rest/call/', t.Call(params));
    if (!result.status) throw newHttpError(400, result);
    
    const call = model.save({
      to: phone,
      data: result,
      date: new Date(),
      status: t.CallStatus.INICIADA
    });
    return call;
  } catch (e) {
    throw newHttpError(400, e);
  }
};

async function hangup(id) {
  try {
    const params = getHangupParams(id);
    const result = await requester.get('/Call/rest/hangup/', t.Hangup(params));
    if (!result.status) throw newHttpError(400, result);
    return result;
  } catch (e) {
    throw newHttpError(400, e);
  }
};

export const requestCall = wrap(call);
export const requestHangup = wrap(hangup);
