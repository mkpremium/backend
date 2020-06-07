import { wrap } from 'express-promise-wrap'
import { History } from '../history/models'
import { newHttpError } from '../lib/http-error'
import { FeaturedContact, Owner } from '../types/owner'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { OwnerRepository, PersonRepository } from './models'
import { OwnerNotFound } from './OwnerRepository'
import { EmptyFeaturedContact } from './SetOwnerFeaturedContactService'
import t from './types'

async function updateOwnerContact (req, res) {
  const ownerId = req.params.id
  const contactId = req.params.contactId
  const contextModel = { _documentType: 'owner-contact', contactId }

  const repo = new OwnerRepository()
  await WorksheetRepository.notifyWorkSheetChangeByOwner(ownerId)
  await repo.updateContact(ownerId, contactId, req.body)
  await History.registerUpdate({ contextModel, user: req.user })

  res.status(204).send()
}

async function updateOwner (req, res) {
  const id = req.params.id
  const contextModel = { _documentType: 'owner', id }
  const repo = new OwnerRepository()
  await WorksheetRepository.notifyWorkSheetChangeByOwner(id)

  const owner = await repo.findByIdOrThrow(id)
  let updatedOwner = t.update(owner, { $merge: Object.assign({}, req.body, { id }) })
  if (typeof req.body.verified !== 'undefined') {
    const owner = Owner(updatedOwner)
    owner.verifyOwner(req.user.id, req.body.verified)
  }

  await History.registerUpdate({ contextModel, user: req.user })

  if (owner.status !== updatedOwner.status) {
    const personRepository = new PersonRepository()
    const person = personRepository.findById(updatedOwner.personId)
    const updatedPerson = t.update(person, {
      $set: {
        active: owner.status === 'VERIFICADO'
      }
    })
    await personRepository.save(updatedPerson)
  }

  res.status(204).send()
}

async function addOwnerContact (req, res) {
  const ownerId = req.params.id
  const repo = new OwnerRepository()
  const contextModel = await repo.addContact(ownerId, req.body)
  await History.registerCreate({ contextModel, user: req.user })
  await WorksheetRepository.notifyWorkSheetChangeByOwner(ownerId)
  const [updatedOwner] = await repo.findByIdWithIncludes(ownerId, ['building', 'person'])
  res.json(updatedOwner)
}

async function addOwner (req, res) {
  const repo = new OwnerRepository()
  const owner = await repo.createOwnerAndPerson(req.body)
  await History.registerCreate({ contextModel: owner, user: req.user })
  res.status(201).json(owner)
}

async function ownerList (req, res) {
  const repo = new OwnerRepository()
  const owners = await repo.list(req.query)
  res.json(owners)
}

export const updateOwnerContactController = wrap(updateOwnerContact)
export const updateOwnerController = wrap(updateOwner)
export const addOwnerContactController = wrap(addOwnerContact)
export const addOwnerController = wrap(addOwner)
export const listOwnerController = wrap(ownerList)

export const createSetFeaturedContactController = setOwnerFeaturedContactService => {
  return async (req, res) => {
    try {
      const featuredContact = FeaturedContact(req.body)
      await setOwnerFeaturedContactService.setFeaturedContact(req.params.ownerId, featuredContact)

      res.sendStatus(200)
    } catch (e) {
      if (e instanceof EmptyFeaturedContact) {
        throw newHttpError(400, `Invalid featured contact request.`)
      } else if (e instanceof OwnerNotFound) {
        throw newHttpError(400, e.message)
      } else {
        console.error(e)
        throw newHttpError(500, `Some error occurred while setting featured contact.`)
      }
    }
  }
}
