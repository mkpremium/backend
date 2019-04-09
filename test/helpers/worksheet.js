import t from 'tcomb';
import times from 'lodash/times';
import Promise from 'bluebird';
import request from 'supertest';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import BuildingHelper from './building';
import app from '../../src/app';
import {createOwnerViaEndpoint} from './owner';
import _ from 'lodash';

/**
 * Creates worksheets using the model
 * @param payload
 * @property {Number} payload.times - how many dummy worksheets we are going to create.
 * @returns {Promise<[any]>}
 */
async function createWorksheetsViaModel(payload) {
  const payloadData = payload || {times: 5};
  const worksheetRepository = new WorksheetRepository();

  return Promise.all(times(payloadData.times, () => worksheetRepository.save({})));
}

async function createWorksheetsWithBuildingsAssociated() {
  const worksheetRepository = new WorksheetRepository();
  const buildings = await BuildingHelper.runBuildingSeedAndGetThemAll();
  const buildingArraySize = buildings.length;
  const worksheets = await createWorksheetsViaModel({times: 1});

  return Promise.map(worksheets, async(ws) => {
    const building = buildings.pop();
    let updatedWorksheet = t.update(ws, {buildingAddress: {$set: building.address}});
    await worksheetRepository.save(updatedWorksheet, false);
    updatedWorksheet = t.update(ws, {relatedBuildingIds: {$set: [building.id]}});
    return worksheetRepository.save(updatedWorksheet, false);
  });
}

async function updateQueueIdWorksheetModel(worksheetId, queueId) {
  const worksheetRepository = new WorksheetRepository();
  const worksheet = worksheetRepository.findByIdOrThrow(worksheetId);
  const updatedWorksheet = t.update(worksheet, {queueId: {$set: queueId}});
  return worksheetRepository.save(updatedWorksheet, false);
}

async function findByIdModel(worksheetId) {
  const worksheetRepository = new WorksheetRepository();

  return worksheetRepository.findByIdOrThrow(worksheetId);
}

async function searchWorksheetEndpoint(authenticatedManager, payload) {
  return request(app)
    .get(`/worksheets/search`)
    .set('Authorization', authenticatedManager.authorization)
    .query(payload)
    .expect(200)
    .then(response => {
      return response.body;
    });
}

/**
 * Creates worksheets, each with building and an owner associated.
 * @param authenticatedManager
 * @returns {Promise<void>} - array of objects, object has two properties: worksheet and owner
 */
async function createWorksheetsAndOwnerWithBuilding(authenticatedManager) {
  const worksheetRepository = new WorksheetRepository();
  const worksheets = await createWorksheetsWithBuildingsAssociated();
  
  return Promise.map(worksheets, async(worksheet) => {
    const buildingId = _.first(worksheet.relatedBuildingIds);
    const owner = await createOwnerViaEndpoint(authenticatedManager, buildingId);
    const updatedWorksheet = await worksheetRepository.addOwner(worksheet, owner);
    return {
      worksheet: updatedWorksheet,
      owner: owner
    }
  });
}

/**
 * Updates worksheet status via model
 * @param worksheetId
 * @param operatorId
 * @returns {Promise<*>}
 */
function updateStatusViaModel(worksheetId, operatorId) {
  const worksheetRepository = new WorksheetRepository();
  return worksheetRepository.updateStatus(worksheetId, operatorId);
}

module.exports = {
  createWorksheetsWithBuildingsAssociated,
  updateQueueIdWorksheetModel,
  findByIdModel,
  searchWorksheetEndpoint,
  createWorksheetsAndOwnerWithBuilding,
  updateStatusViaModel
};
