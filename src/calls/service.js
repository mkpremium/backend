import axios from 'axios';
import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {newHttpError} from '../lib/http-error';

import {Calls} from './models';
import {numintec} from '../../config';
import {encodePlusSign} from './helper';

const requester = axios.create({
  baseURL: numintec.apiUrl,
  params: {
    license: numintec.apiKey
  }
});

function getCallParams(from, to, serviceId) {
  const struct = t.CallService({
    from: from.split('-')[1],
    to: encodePlusSign(to.value),
    service_id: parseInt(serviceId),
    return_id: true
  });

  return `?from=${struct.from}&to=${struct.to}&options[service_id]=${struct.service_id}&options[return_id]=${true}&options[autoanswer]=1`;
}

async function call(from, phone, serviceId) {
  const model = new Calls();
  try {
    let params = getCallParams(from, phone, serviceId);
    const result = await requester.get(`/Call/rest/call/${params}`);
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
