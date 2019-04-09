import {OwnerRepository} from '../../src/owner/models';
import request from 'supertest';
import app from "../../src/app";
const chance = require('chance').Chance();

/**
 * Creates a dummy verified and principal owner
 * @param authenticatedManager
 * @param buildingId
 * @returns {Promise<*>}
 */
async function createOwnerViaEndpoint(authenticatedManager, buildingId) {
  const ownerWithPersonToSave = {
    type: 'PRINCIPAL',
    status: 'VERIFICADO',
    buildingId: '',
    note: '',
    person: {
      name: chance.name(),
      personType: 'NATURAL'
    }
  };
  
  if (buildingId) {
    ownerWithPersonToSave.buildingId = buildingId;
  }
  
  return request(app)
    .post('/owners')
    .set('Authorization', authenticatedManager.authorization)
    .send(ownerWithPersonToSave)
    .expect(201)
    .then(response => {
      return response.body;
    });
}

/**
 * Updates owner via endpoint
 * @param ownerId
 * @param payload
 * @param authenticatedOperator
 * @returns {Promise<Test|*|void>}
 */
async function updateOwnerViaEndpoint(ownerId, payload, authenticatedOperator) {
  return request(app)
    .put(`/owners/${ownerId}`)
    .set('Authorization', authenticatedOperator.authorization)
    .send(payload)
    .expect(204);
}

/**
 *
 * @param ownerId
 */
function findOwner(ownerId) {
  const ownerRepo = new OwnerRepository();
  return ownerRepo.findById(ownerId);
}

module.exports = {
  createOwnerViaEndpoint,
  updateOwnerViaEndpoint,
  findOwner
};
