import {wrap} from 'express-promise-wrap';
import {OwnerRepository} from './models';
import {History} from '../history/models';

async function updateOwnerContact(req, res) {
  const ownerId = req.params.id;
  const contactId = req.params.contactId;
  const contextModel = {_documentType: 'owner-contact', contactId};

  const repo = new OwnerRepository();
  await repo.updateContact(ownerId, contactId, req.body);
  await History.registerUpdate({contextModel, user: req.user});
  res.status(204).send();
}

async function updateOwner(req, res) {
  const id = req.params.id;
  const contextModel = {_documentType: 'owner', id};
  const repo = new OwnerRepository();
  await repo.update(id, Object.assign({}, req.body, {id}));
  await History.registerUpdate({contextModel, user: req.user});

  res.status(204).send();
}

async function addOwnerContact(req, res) {
  const ownerId = req.params.id;
  const repo = new OwnerRepository();
  const contextModel = await repo.addContact(ownerId, req.body);
  await History.registerCreate({contextModel, user: req.user});
  const updatedOwner = await repo.findByIdWithIncludes(ownerId);
  res.json(updatedOwner);
}

async function addOwner(req, res) {
  const repo = new OwnerRepository();
  const owner = await repo.createOwnerAndPerson(req.body);
  await History.registerCreate({contextModel: owner, user: req.user});
  res.status(201).json(owner);
}

export const updateOwnerContactController = wrap(updateOwnerContact);
export const updateOwnerController = wrap(updateOwner);
export const addOwnerContactController = wrap(addOwnerContact);
export const addOwnerController = wrap(addOwner);
