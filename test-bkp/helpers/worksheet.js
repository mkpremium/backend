import t from 'tcomb'
import times from 'lodash/times'
import Promise from 'bluebird'
import request from 'supertest'
import { WorksheetRepository } from '../../src/worksheet/models/worksheet'
import BuildingHelper from './building'
import app from '../../src/app'
import {
  createOwnerViaEndpointBadContacts,
  createOwnerViaEndpointNoContacts,
  createOwnerViaEndpointValid
} from './owner'
import _ from 'lodash'

/**
 * Creates worksheets using the model
 * @param payload
 * @property {Number} payload.times - how many dummy worksheets we are going to create.
 * @returns {Promise<[any]>}
 */
async function createWorksheetsViaModel (payload) {
  const payloadData = payload || { times: 5 }
  const worksheetRepository = new WorksheetRepository()

  return Promise.all(times(payloadData.times, () => worksheetRepository.save({})))
}

async function createWorksheetsWithBuildingsAssociated () {
  const worksheetRepository = new WorksheetRepository()
  const buildings = await BuildingHelper.runBuildingSeedAndGetThemAll()
  const worksheets = await createWorksheetsViaModel({ times: 1 })

  return Promise.map(worksheets, async (ws) => {
    const building = buildings.pop()
    let updatedWorksheet = t.update(ws, { buildingAddress: { $set: building.address } })
    await worksheetRepository.save(updatedWorksheet, false)
    updatedWorksheet = t.update(ws, { relatedBuildingIds: { $set: [building.id] } })
    return worksheetRepository.save(updatedWorksheet, false)
  })
}

async function updateQueueIdWorksheetModel (worksheetId, queueId) {
  const worksheetRepository = new WorksheetRepository()
  const worksheet = worksheetRepository.findByIdOrThrow(worksheetId)
  const updatedWorksheet = t.update(worksheet, { queueId: { $set: queueId } })
  return worksheetRepository.save(updatedWorksheet, false)
}

async function findByIdModel (worksheetId) {
  const worksheetRepository = new WorksheetRepository()

  return worksheetRepository.findByIdOrThrow(worksheetId)
}

async function searchWorksheetEndpoint (authenticatedManager, payload) {
  return request(app)
    .get('/worksheets/search')
    .set('Authorization', authenticatedManager.authorization)
    .query(payload)
    .expect(200)
    .then(response => {
      return response.body
    })
}

export const CreateWorksheetType = {
  VALID: 0,
  INVALID_NO_CONTACTS: 1,
  INVALID_BAD_CONTACTS: 2
}

/**
 * Creates worksheets, each with building and an owner associated.
 * @param authenticatedManager
 * @param type
 * @returns {Promise<Object<>>} - array of objects, object has two properties: worksheet and owner
 */
async function createWorksheetsAndOwnerWithBuilding (authenticatedManager, type = CreateWorksheetType.VALID) {
  const worksheetRepository = new WorksheetRepository()
  const worksheets = await createWorksheetsWithBuildingsAssociated()

  return Promise.map(worksheets, async (worksheet) => {
    const buildingId = _.first(worksheet.relatedBuildingIds)
    const owner = await createOwnerByType(authenticatedManager, buildingId, type)
    const updatedWorksheet = await worksheetRepository.addOwner(worksheet, owner)
    return {
      worksheet: updatedWorksheet,
      owner: owner
    }
  })
}

export async function createOwnerByType (authenticatedManager, buildingId, type) {
  switch (type) {
    case CreateWorksheetType.INVALID_NO_CONTACTS:
      return createOwnerViaEndpointNoContacts(authenticatedManager, buildingId)
    case CreateWorksheetType.INVALID_BAD_CONTACTS:
      return createOwnerViaEndpointBadContacts(authenticatedManager, buildingId)
    case CreateWorksheetType.VALID:
    default:
      return createOwnerViaEndpointValid(authenticatedManager, buildingId)
  }
}

/**
 * Updates worksheet status via model
 * @param worksheetId
 * @param operatorId
 * @returns {Promise<*>}
 */
function updateStatusViaModel (worksheetId, operatorId) {
  const worksheetRepository = new WorksheetRepository()
  return worksheetRepository.updateStatus(worksheetId, operatorId)
}

export default {
  createWorksheetsWithBuildingsAssociated,
  updateQueueIdWorksheetModel,
  findByIdModel,
  searchWorksheetEndpoint,
  createWorksheetsAndOwnerWithBuilding,
  updateStatusViaModel
}
