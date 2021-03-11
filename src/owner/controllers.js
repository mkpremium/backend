import { wrap } from 'express-promise-wrap'
import { History } from '../history/models'
import { LegacyWorksheetRepository } from '../worksheet/models/worksheet-repository'
import { OwnerRepository } from './models'
import { Owner } from './owner'
import t from './types'

async function updateOwnerContactStatus (req, res) {
  const ownerId = req.params.id
  const contactId = req.params.contactId
  const contextModel = { _documentType: 'owner-contact', contactId }

  const { status } = req.body
  const repo = new OwnerRepository()
  await repo.changeContactStatus(ownerId, contactId, status)
  await History.registerUpdate({ contextModel, user: req.user })

  res.status(204).send()
}

async function updateOwner (req, res) {
  const id = req.params.id
  const contextModel = { _documentType: 'owner', id }
  const repo = new OwnerRepository()
  await LegacyWorksheetRepository.notifyWorkSheetChangeByOwner(id)

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
  await LegacyWorksheetRepository.notifyWorkSheetChangeByOwner(ownerId)

  res.json(updatedOwner)
}

async function ownerList (req, res) {
  const repo = new OwnerRepository()
  const owners = await repo.list(req.query)
  res.json(owners)
}

export const updateOwnerContactController = wrap(updateOwnerContactStatus)
export const updateOwnerController = wrap(updateOwner)
export const addOwnerContactController = wrap(addOwnerContact)
export const listOwnerController = wrap(ownerList)
