import { wrap } from 'express-promise-wrap'
import { History } from '../history/models'
import { OwnerRepository } from './models'
import { Owner } from './owner'
import t from 'tcomb'

async function updateOwner (req, res) {
  const id = req.params.id
  const contextModel = { _documentType: 'owner', id }
  const repo = new OwnerRepository()

  const owner = await repo.findByIdOrThrow(id)
  let updatedOwner = t.update(owner, { $merge: Object.assign({}, req.body, { id }) })
  if (typeof req.body.verified !== 'undefined') {
    const owner = Owner(updatedOwner)
    updatedOwner = owner.verifyOwner(req.user.id, req.body.verified)
  }

  await repo.save(updatedOwner)

  await History.registerUpdate({ contextModel, user: req.user })

  res.status(204).send()
}

async function addOwnerContact (req, res) {
  const ownerId = req.params.id
  const repo = new OwnerRepository()
  const updatedOwner = await repo.addContact(ownerId, req.body)

  await History.registerCreate({ contextModel: updatedOwner, user: req.user })

  res.json(updatedOwner)
}

export const updateOwnerController = wrap(updateOwner)
export const addOwnerContactController = wrap(addOwnerContact)
