import {wrap} from 'express-promise-wrap';
import {OwnerRepository} from './models';

async function updateOwnerContactStatus(req, res) {
  const id = req.params.id;
  const repo = new OwnerRepository();
  await repo.updateContactStatus(id, req.body || {});
  res.status(204).send();
}

//async function update

export const updateOwnerContactStatusController = wrap(updateOwnerContactStatus);
