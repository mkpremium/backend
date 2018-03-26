import {wrap} from 'express-promise-wrap';
import {OwnerRepository} from '../owner/models';
import {Calls} from './models';
import {requestCall, requestHangup} from './service';

import {
  isUnknownEvent,
  getCallStatus,
  shouldOmitEvent,
  buildCallEvent
} from './helper';

async function call(req, res) {
  const ownerId = req.params.ownerId;
  const {contactId} = req.body;
  const owner = new OwnerRepository();
  const from = req.user.operator;
  const phoneValue = await owner.getContactPhoneNumber(ownerId, contactId);
  const call = await requestCall(from, phoneValue);
  res.status(200).send(call);
}

async function hangup(req, res) {
  const operatorId = req.user.operator.id;
  await requestHangup(operatorId);
  res.status(204).send();
}

async function webhook(req, res) {
  const model = new Calls();
  const unknownEvent = await isUnknownEvent(req.body);
  if (unknownEvent) return res.status(204).send();
  if (shouldOmitEvent(req.body)) return res.status(204).send();

  const status = getCallStatus(req.body);
  const call = await model.findOrCreate(req.body);
  await model.updateStatus(call.callId, status);
  const newCallEvent = buildCallEvent(req.body);
  const updatedCall = await model.addEvent(call.callId, newCallEvent, true);

  res.status(200).send(updatedCall);
}

async function addNote(req, res) {
  const id = req.params.callId;
  const model = new Calls();
  await model.addNote(id, req.body.note);
  res.status(204).send();
}

export const callController = wrap(call);
export const hangupController = wrap(hangup);
export const webhookController = wrap(webhook);
export const addNoteController = wrap(addNote);
