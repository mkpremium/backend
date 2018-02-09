import {wrap} from 'express-promise-wrap';
import {OwnerRepository} from '../owner/models';
import {requestCall, requestHangup} from './service';

async function call(req, res) {
  const id = req.params.id;
  const owner = new OwnerRepository();
  const phoneValue = await owner.getContactPhoneNumber(id, req.body);
  const call = await requestCall(phoneValue);
  res.status(200).send(call);
};

async function hangup(req, res) {
  const id = req.params.callId;
  await requestHangup(id);
  res.status(204).send();
};

export const callController = wrap(call);
export const hangupController = wrap(hangup);
