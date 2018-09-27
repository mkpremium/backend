import {wrap} from 'express-promise-wrap';
import {OwnerRepository} from './models';
import {History} from '../history/models';
import {WorksheetRepository} from '../worksheet/models/worksheet';
import {saveBuildingOwnerToFirebase} from '../firebase/lib/business';
import t from './types';

async function updateOwnerContact(req, res) {
  const ownerId = req.params.id;
  const contactId = req.params.contactId;
  const contextModel = {_documentType: 'owner-contact', contactId};

  const repo = new OwnerRepository();
  await WorksheetRepository.notifyWorkSheetChangeByOwner(ownerId);
  await repo.updateContact(ownerId, contactId, req.body);
  await History.registerUpdate({contextModel, user: req.user});

  const [updatedOwner] = await repo.findByIdWithIncludes(ownerId, ['building', 'person']);
  await saveBuildingOwnerToFirebase(updatedOwner);

  res.status(204).send();
}

async function updateOwner(req, res) {
  const id = req.params.id;
  const contextModel = {_documentType: 'owner', id};
  const repo = new OwnerRepository();
  await WorksheetRepository.notifyWorkSheetChangeByOwner(id);
  await repo.update(id, req.body, req.user.id);
  await History.registerUpdate({contextModel, user: req.user});

  const [updatedOwner] = await repo.findByIdWithIncludes(id, ['building', 'person']);
  await saveBuildingOwnerToFirebase(updatedOwner);

  res.status(204).send();
}

async function addOwnerContact(req, res) {
  const ownerId = req.params.id;
  const repo = new OwnerRepository();
  const contextModel = await repo.addContact(ownerId, req.body);
  await History.registerCreate({contextModel, user: req.user});
  await WorksheetRepository.notifyWorkSheetChangeByOwner(ownerId);
  const [updatedOwner] = await repo.findByIdWithIncludes(ownerId, ['building', 'person']);
  await saveBuildingOwnerToFirebase(updatedOwner);
  res.json(updatedOwner);
}

async function addOwner(req, res) {
  const repo = new OwnerRepository();
  const owner = await repo.createOwnerAndPerson(req.body);
  await History.registerCreate({contextModel: owner, user: req.user});
  res.status(201).json(owner);
}

async function updateBusinessStatus(req, res) {
  t.OwnerUpdateBusinessStatus(req.body);
  const ownerId = req.params.id;
  const status = req.body.status;
  const updatedBy = req.user.id;

  const repo = new OwnerRepository();
  const owner = await repo.updateBusinessStatusFirebase(ownerId, status, updatedBy);

  await History.registerCreate({owner, user: req.user});
  res.status(204).send();
}

export const updateOwnerContactController = wrap(updateOwnerContact);
export const updateOwnerController = wrap(updateOwner);
export const addOwnerContactController = wrap(addOwnerContact);
export const addOwnerController = wrap(addOwner);
export const updateBusinessStatusController = wrap(updateBusinessStatus);
