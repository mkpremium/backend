import times from 'lodash/times';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import BuildingHelper from './building';
import Promise from 'bluebird';
import t from 'tcomb';
import app from "../../src/app";
import request from "supertest";
import _ from "lodash";

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
  const worksheets = await createWorksheetsViaModel({times: buildingArraySize});
  
  return Promise.map(worksheets, async(ws) => {
    const building = buildings.pop();
    const updatedWorksheet = t.update(ws, {buildingAddress: {$set: building.address}});
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

module.exports = {
  createWorksheetsWithBuildingsAssociated,
  updateQueueIdWorksheetModel,
  findByIdModel,
  searchWorksheetEndpoint
};
