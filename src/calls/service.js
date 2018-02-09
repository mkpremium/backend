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
    to: to.value,
    options: {
      service_id: parseInt(numintec.serviceId),
      return_id: true
    }
  });
}

async function call(phone) {
  const model = new Calls();
  try {
    const params = getCallParams(phone);
    const result = await requester.get('/Call/rest/call/', params);
    if (!result.data.status) throw newHttpError(400, result.data.description);
    
    const call = model.save({
      to: phone.value,
      data: result.data,
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
    const result = await requester.get(`/Call/rest/hangup/?options[call_id]=${id}`);
    if (!result.data.status) throw newHttpError(400, result.data.description);
    return result.data;
  } catch (e) {
    throw newHttpError(400, e);
  }
};

export const requestCall = wrap(call);
export const requestHangup = wrap(hangup);
