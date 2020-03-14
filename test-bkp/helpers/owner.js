import { OwnerRepository, PersonRepository } from '../../src/owner/models'
import request from 'supertest'
import app from '../../src/app'
const chance = require('chance').Chance()

/**
 * Creates a dummy verified and principal owner
 * @param authenticatedManager
 * @param buildingId
 * @returns {Promise<*>}
 */
export async function createOwnerViaEndpointValid (authenticatedManager, buildingId) {
  return createOwnerViaEndpoint_(authenticatedManager, buildingId, [
    {
      value: '12345678',
      status: 'UNDEFINED'
    }
  ])
}

export async function createOwnerViaEndpointNoContacts (authenticatedManager, buildingId) {
  return createOwnerViaEndpoint_(authenticatedManager, buildingId, [])
}

export async function createOwnerViaEndpointBadContacts (authenticatedManager, buildingId) {
  return createOwnerViaEndpoint_(authenticatedManager, buildingId, [
    {
      value: '12345678',
      status: 'BAD'
    }
  ])
}

export async function createOwnerViaEndpoint_ (authenticatedManager, buildingId, contacts) {
  const ownerWithPersonToSave = {
    type: 'PRINCIPAL',
    status: 'VERIFICADO',
    buildingId: '',
    note: '',
    person: {
      name: chance.name(),
      personType: 'NATURAL',
      contacts
    }
  }

  if (buildingId) {
    ownerWithPersonToSave.buildingId = buildingId
  }

  return request(app)
    .post('/owners')
    .set('Authorization', authenticatedManager.authorization)
    .send(ownerWithPersonToSave)
    .expect(201)
    .then(response => {
      return response.body
    })
}

/**
 * Updates owner via endpoint
 * @param ownerId
 * @param payload
 * @param authenticatedOperator
 * @returns {Promise<Test|*|void>}
 */
export async function updateOwnerViaEndpoint (ownerId, payload, authenticatedOperator) {
  return request(app)
    .put(`/owners/${ownerId}`)
    .set('Authorization', authenticatedOperator.authorization)
    .send(payload)
    .expect(204)
}

/**
 *
 * @param ownerId
 */
export function findOwner (ownerId) {
  const ownerRepo = new OwnerRepository()
  return ownerRepo.findById(ownerId)
}

/**
 * Find person by owner.personId
 * @param personId
 */
export function findOwnerPerson (personId) {
  const personRepository = new PersonRepository()
  return personRepository.findById(personId)
}

module.exports = {
  createOwnerViaEndpointNoContacts,
  createOwnerViaEndpointBadContacts,
  createOwnerViaEndpointValid,
  updateOwnerViaEndpoint,
  findOwner,
  findOwnerPerson
}
